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

/**
 * Latest non-draft release (without the leading "v") + its assets.
 *
 * Asks /releases/latest FIRST and only then falls back to listing. For this
 * repo the list endpoint returns an empty array even though releases plainly
 * exist and /releases/latest answers correctly — so the list-only version of
 * this function always threw "No published release found". It went unnoticed
 * because CI passes --version explicitly; only a manual run with no argument
 * ever reached it.
 *
 * /releases/latest is also the more correct source: GitHub excludes drafts and
 * pre-releases from it, which is exactly what a download button wants.
 */
async function latestRelease() {
  try {
    const rel = await githubJson(`/repos/${REPO}/releases/latest`);
    if (rel && rel.tag_name) return rel;
  } catch (e) {
    console.warn(`/releases/latest unavailable (${e.message}) — falling back to the release list`);
  }
  const releases = await githubJson(`/repos/${REPO}/releases?per_page=20`);
  const rel = Array.isArray(releases) ? releases.find((r) => !r.draft && !r.prerelease) : null;
  if (!rel) throw new Error('No published release found');
  return rel;
}

/** Human size like "81 MB" from a byte count. */
const mb = (bytes) => `${Math.round(bytes / 1048576)} MB`;

const hasDmg = (rel) => (rel?.assets || []).some((a) => /-arm64\.dmg$/.test(a.name));

/**
 * The newest version that actually ships a macOS .dmg, at or below `version`.
 * Falls back to `version` if nothing can be determined, so a GitHub hiccup
 * cannot silently freeze the mac link on something ancient.
 */
async function resolveMacVersion(version) {
  try {
    const target = await githubJson(`/repos/${REPO}/releases/tags/v${version}`).catch(() => null);
    if (target && hasDmg(target)) return version;

    // Walk BACK through tags, newest first, asking each tag's release directly.
    // The /releases LIST endpoint is not usable on this repo — it returns [] even
    // though releases exist — and when it did, this function "fell back" to the
    // very version it had just failed to verify. That is how a Windows-only
    // release aimed every Mac visitor at a .dmg that was never built.
    const tags = await githubJson(`/repos/${REPO}/tags?per_page=30`);
    for (const t of (Array.isArray(tags) ? tags : [])) {
      if (!/^v\d+\.\d+\.\d+$/.test(t.name || '')) continue;
      const rel = await githubJson(`/repos/${REPO}/releases/tags/${t.name}`).catch(() => null);
      if (rel && !rel.draft && !rel.prerelease && hasDmg(rel)) {
        return String(rel.tag_name).replace(/^v/, '');
      }
    }
  } catch (e) {
    console.warn('mac version lookup failed:', e.message);
  }
  // Nothing could be CONFIRMED to carry a .dmg. Return null so the caller
  // leaves the mac links exactly as they are. A stale-but-working download
  // beats a current-looking 404.
  return null;
}

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

  // The macOS link cannot simply follow the Windows one. A release built on a
  // Windows host has no .dmg at all, and this script used to rewrite the dmg
  // URL to the new version regardless — pointing every Mac visitor at a file
  // that was never uploaded. Only move the dmg to a version that actually has
  // one; otherwise leave it on the newest release that does.
  let macVersion = await resolveMacVersion(version);
  if (macVersion === null) {
    // Nothing could be CONFIRMED to carry a .dmg. Rather than guess, keep
    // whatever the site already points at — that version was verified the last
    // time this ran, and a stale-but-working download beats a fresh-looking
    // 404. Read it from index.html so links AND the "vX beta" note stay in
    // agreement; leaving macVersion null would let the general beta-note rule
    // relabel a link it isn't allowed to move.
    const idx = join(ROOT, 'index.html');
    const onPage = existsSync(idx)
      ? (readFileSync(idx, 'utf8').match(/Credent-(\d+\.\d+\.\d+)-arm64\.dmg/) || [])[1]
      : null;
    macVersion = onPage || null;
    console.log(macVersion
      ? `macOS: no .dmg confirmed for any release — holding mac links at v${macVersion} (unchanged)`
      : 'macOS: no .dmg confirmed and none referenced on the page — skipping mac rewrites');
  } else if (macVersion !== version) {
    console.log(`macOS: v${version} has no .dmg — holding mac links at v${macVersion}`);
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
    // macVersion === null means "no .dmg could be confirmed anywhere" — skip
    // every mac rewrite and leave whatever is on the page, rather than moving
    // the link to a file that does not exist.
    if (macVersion) {
      after = after.replace(
        /\/releases\/download\/v\d+\.\d+\.\d+\/Credent-\d+\.\d+\.\d+-arm64\.dmg/g,
        `/releases/download/v${macVersion}/Credent-${macVersion}-arm64.dmg`,
      );
    }
    // bare filename references (install steps <code>…</code>)
    after = after.replace(/Credent-Setup-\d+\.\d+\.\d+\.exe/g, `Credent-Setup-${version}.exe`);
    if (macVersion) {
      after = after.replace(/Credent-\d+\.\d+\.\d+-arm64\.dmg/g, `Credent-${macVersion}-arm64.dmg`);
    }

    // 2) "vX.Y.Z beta" notes. General rule first, then the dmg note corrects
    //    itself back to the mac version — the specific rule has to run LAST or
    //    the general one clobbers it and the note claims a build that the link
    //    beside it does not point to.
    after = after.replace(/v\d+\.\d+\.\d+ beta/g, `v${version} beta`);
    if (macVersion) {
      after = after.replace(/\.dmg · v\d+\.\d+\.\d+ beta/g, `.dmg · v${macVersion} beta`);
    }
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
