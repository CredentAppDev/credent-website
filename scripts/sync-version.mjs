#!/usr/bin/env node
/**
 * Sync the download website's version strings to the latest desktop release.
 *
 * The site hard-codes the app version in a few places (download buttons, the
 * hero CTA, the JSON-LD softwareVersion, the "Version X · Beta" labels, the
 * filename in the install steps, and the installer size text). This script
 * rewrites ALL of them to match whatever the latest GitHub release is — so we
 * never hand-edit version numbers again.
 *
 * Source of truth: the latest (non-draft) release of CredentAppDev/credent-website
 * (that's where electron-builder publishes the installers).
 *
 * Usage:
 *   node scripts/sync-version.mjs                 # query GitHub for latest
 *   node scripts/sync-version.mjs --version 1.3.0 # force a version (skip query)
 *   VERSION=1.3.0 node scripts/sync-version.mjs   # same, via env
 *
 * In CI we pass the version explicitly (the release that just published). Run
 * locally with no args and it figures it out from the GitHub API.
 *
 * Exits 0 and writes nothing if the site is already on the target version.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REPO = 'CredentAppDev/credent-website';

// Files that carry version strings. Add new ones here if the site grows.
const FILES = ['index.html', 'app/download.html', 'app/js/main.js'];

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
};

async function githubJson(path) {
  const headers = { 'User-Agent': 'credent-sync', Accept: 'application/vnd.github+json' };
  if (process.env.GH_TOKEN) headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub ${path} → HTTP ${res.status}`);
  return res.json();
}

/** Latest non-draft release version (without the leading "v") + its assets. */
async function latestRelease() {
  const releases = await githubJson(`/repos/${REPO}/releases?per_page=20`);
  const rel = releases.find((r) => !r.draft);
  if (!rel) throw new Error('No published release found');
  return rel;
}

/** Human size like "81 MB" from a byte count. */
const mb = (bytes) => `${Math.round(bytes / 1048576)} MB`;

async function main() {
  let version = arg('version') || process.env.VERSION;
  let exeBytes = null;

  if (!version) {
    const rel = await latestRelease();
    version = String(rel.tag_name || '').replace(/^v/, '');
    const exe = (rel.assets || []).find((a) => /Credent-Setup-.*\.exe$/.test(a.name));
    if (exe) exeBytes = exe.size;
  } else if (!arg('no-size')) {
    // Version forced (CI); still fetch the size from that release if we can.
    try {
      const rel = await githubJson(`/repos/${REPO}/releases/tags/v${version}`);
      const exe = (rel.assets || []).find((a) => /Credent-Setup-.*\.exe$/.test(a.name));
      if (exe) exeBytes = exe.size;
    } catch { /* size is best-effort */ }
  }

  if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
    throw new Error(`Bad version "${version}" — expected X.Y.Z`);
  }

  const sizeText = exeBytes ? mb(exeBytes) : null;
  let changed = 0;

  for (const rel of FILES) {
    const file = join(ROOT, rel);
    if (!existsSync(file)) { console.warn(`skip (missing): ${rel}`); continue; }
    const before = readFileSync(file, 'utf8');
    let after = before;

    // 1) Release-asset URLs + filenames: any existing X.Y.Z in a Credent-Setup
    //    /Credent-…-arm64.dmg / vX.Y.Z path → the new version.
    after = after.replace(
      /\/releases\/download\/v\d+\.\d+\.\d+\/Credent-Setup-\d+\.\d+\.\d+\.exe/g,
      `/releases/download/v${version}/Credent-Setup-${version}.exe`,
    );
    after = after.replace(
      /\/releases\/download\/v\d+\.\d+\.\d+\/Credent-\d+\.\d+\.\d+-arm64\.dmg/g,
      `/releases/download/v${version}/Credent-${version}-arm64.dmg`,
    );
    // bare filename references (install steps <code>…</code>)
    after = after.replace(/Credent-Setup-\d+\.\d+\.\d+\.exe/g, `Credent-Setup-${version}.exe`);
    after = after.replace(/Credent-\d+\.\d+\.\d+-arm64\.dmg/g, `Credent-${version}-arm64.dmg`);

    // 2) "vX.Y.Z beta" notes
    after = after.replace(/v\d+\.\d+\.\d+ beta/g, `v${version} beta`);
    // 3) "Version X.Y.Z · Beta" eyebrow
    after = after.replace(/Version \d+\.\d+\.\d+/g, `Version ${version}`);
    // 4) JSON-LD softwareVersion
    after = after.replace(/"softwareVersion":\s*"\d+\.\d+\.\d+"/g, `"softwareVersion": "${version}"`);

    // 5) Installer size text (best-effort; only if we know the real size)
    if (sizeText) {
      after = after.replace(/~\d+\s*MB/g, `~${sizeText}`);
      after = after.replace(/·\s*\d+\s*MB\s*·/g, `· ${sizeText} ·`);
    }

    if (after !== before) { writeFileSync(file, after); changed++; console.log(`updated: ${rel}`); }
  }

  console.log(changed
    ? `\n✅ Synced site to v${version}${sizeText ? ` (~${sizeText})` : ''} — ${changed} file(s) changed.`
    : `\nℹ️  Site already on v${version} — nothing to do.`);

  // Expose the version for CI commit messages.
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `version=${version}\nchanged=${changed}\n`, { flag: 'a' });
  }
}

main().catch((e) => { console.error('❌ sync-version failed:', e.message); process.exit(1); });
