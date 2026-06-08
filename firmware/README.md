# Web-flasher firmware binary

`flash.html` uses [ESP Web Tools](https://esphome.github.io/esp-web-tools/) to
flash the Mino firmware from a browser. It reads `manifest.json`, which points at
**`credent-mino.bin`** — a single merged binary for the ESP32-S3.

**That `.bin` is not committed here** — it must be built once from the firmware
source (`credent-mino-firmware`). Until you drop it in, the **Flash Mino** button
will load but fail to find the binary.

## Build the merged `.bin` (one time)

From the firmware repo, with [PlatformIO](https://platformio.org/) installed:

```bash
cd credent-mino-firmware
pio run                       # compiles for the esp32-s3 env
```

PlatformIO writes the parts under `.pio/build/<env>/`:
`bootloader.bin`, `partitions.bin`, and `firmware.bin`.

ESP Web Tools wants a **single image flashed at offset 0**, so merge them with
`esptool` (installed with PlatformIO):

```bash
# adjust the env folder name if yours differs (see platformio.ini)
ENV=.pio/build/dfrobot_esp32s3_ai_cam

esptool.py --chip esp32s3 merge_bin -o credent-mino.bin \
  0x0    $ENV/bootloader.bin \
  0x8000 $ENV/partitions.bin \
  0x10000 $ENV/firmware.bin
```

Then copy the result here:

```bash
cp credent-mino.bin <website>/firmware/credent-mino.bin
```

Commit it, and the **Flash Mino** button works.

> Offsets above are the standard ESP32-S3 Arduino layout. If your
> `platformio.ini` sets a custom partition table, use the offsets it prints
> during `pio run`. The `manifest.json` here already expects a single merged
> image at offset 0 — keep `merge_bin` (don't list parts separately) and the
> manifest stays correct.

## Updating the firmware later

Rebuild, re-merge, replace `credent-mino.bin`, and bump `"version"` in
`manifest.json` so users can tell builds apart.
