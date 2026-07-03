# PaSoRich 2.5 for Xcratch
An extension for [Xcratch](https://xcratch.github.io/) that reads the IDm of FeliCa smart cards
(Suica, PASMO, student ID cards, etc.) with a SONY PaSoRi USB NFC reader via the WebUSB API.

## ✨ What You Can Do With This Extension

- Connect one or more PaSoRi readers to your project
- Read the IDm (unique ID) of a FeliCa card held over a reader
- Trigger scripts with the "when read" hat block
- Requires a WebUSB-capable browser (Google Chrome / Microsoft Edge)

### Supported readers

| Reader | Windows | macOS / Android | Note |
| --- | --- | --- | --- |
| SONY RC-S380/S, RC-S380/P | ✅ *1 | ✅ | |
| SONY RC-S300/S, RC-S300/P | ✅ *1 | ✅ | |
| SONY RC-S330 | ✅ *2 | ✅ | |
| SONY RC-S320 | ✅ *2 | ✅ | |
| SONY RC-S310 | ✅ *2 | ✅ (untested) | Same protocol as RC-S320; not verified on real hardware |

On Windows, WebUSB requires the reader to be bound to the WinUSB driver.
All RC-S models need the driver switched to WinUSB before use:

- \*1 Switch the driver to WinUSB with SONY's official software (NFC Port Software).
- \*2 No official tool covers these legacy readers; manually replace the driver with
  WinUSB using a tool such as [Zadig](https://zadig.akeo.ie/) (untested).

The RC-S310/S320/S330 protocol implementation is based on
[libpafe](https://github.com/rfujita/libpafe), with WebUSB feasibility proven by
[webpasori](https://github.com/muojp/webpasori).

Play the [Example Project](https://xcratch.github.io/editor/#https://con3code.github.io/xcx-pasorich/projects/example.sb3) to see what you can do with the PaSoRich extension.

> Note: ISO/IEC 14443 Type B cards (e.g. My Number Card) are not supported.
> See [docs/usb-nfc4-typeb-report.md](docs/usb-nfc4-typeb-report.md) for the technical study
> of Type B support and generic PC/SC readers such as I-O DATA USB-NFC4 (in Japanese).

## How to Use in Xcratch

This extension can be used with other extensions in [Xcratch](https://xcratch.github.io/).
1. Open the [Xcratch Editor](https://xcratch.github.io/editor)
2. Click the 'Add Extension' button
3. Select the 'Extension Loader' extension
4. Type the module URL in the input field
```
https://con3code.github.io/xcx-pasorich/dist/pasorich.mjs
```
5. Click the 'OK' button
6. Now you can use the blocks of this extension

## Blocks

| Block | Type | Description |
| --- | --- | --- |
| Connect | command | Open the device chooser and register a PaSoRi reader |
| read #[n] reader | command | Poll reader n for a FeliCa card and store its IDm |
| IDm of #[n] | reporter | The IDm last read by reader n (empty if no card) |
| reset IDm | command | Clear the stored IDm of all readers |
| reset Device | command | Release and unregister all readers |
| when read #[n] reader | hat | Fires after reader n finished a read |

## Development

### Source Layout

- `src/vm/extensions/block/index.js` — block definitions and device management
- `src/vm/extensions/block/s380-driver.js` — RC-S380 communication (vendor protocol)
- `src/vm/extensions/block/s300-driver.js` — RC-S300 communication (CCID escape / transparent session)
- `src/vm/extensions/block/s330-driver.js` — RC-S330 communication (PN533 commands over bulk transfer)
- `src/vm/extensions/block/s320-driver.js` — RC-S310/S320 communication (vendor control transfer + interrupt IN)
- `src/vm/extensions/block/usb-util.js` — shared WebUSB helpers (framing, checksum, timeout)

### Install Dependencies

```sh
npm install
```

### Setup Development Environment

Run the setup-dev script with the path to your local `scratch-vm` to link its sources into `src/vm`.

```sh
npm run setup-dev -- ../xcratch/packages/scratch-vm
```

### Bundle into a Module

Run the build script to bundle this extension into a module file which can be loaded on Xcratch.

```sh
npm run build
```

### Watch and Bundle

Run the watch script to watch the changes of source files and bundle automatically.

```sh
npm run watch
```

### Test

Run the test script to test this extension.

```sh
npm run test
```

### Versioning and Deployment

This project uses npm version commands and GitHub Actions for versioning and deployment.

#### Create a New Version

Use the npm version command to update the version number. This will automatically:
1. Update version in `package.json`
2. Run the build script
3. Create version-specific build files in `dist/{version}/`
4. Update `dist/versions.json` with the new version info
5. Create a git commit and tag

```sh
# Patch version (1.3.0 → 1.3.1)
npm version patch

# Minor version (1.3.1 → 1.4.0)
npm version minor

# Major version (1.4.0 → 2.0.0)
npm version major
```

#### Deploy to GitHub Pages

After creating a new version, push the tag to trigger automatic deployment:

```sh
# Push the version tag
git push origin v1.4.0

# Or push all tags
git push --tags
```

The GitHub Actions workflow will:
1. Build the extension
2. Deploy `dist/`, `projects/`, and `README.md` to GitHub Pages

You can also manually trigger deployment from the Actions tab in GitHub.

#### Version Information

All build versions are recorded in `dist/versions.json`:

```json
{
  "extensionId": "pasorich",
  "latest": "1.0.0",
  "versions": [
    {
      "version": "1.0.0",
      "buildDate": "2025-10-19T12:34:56.789Z",
      "module": "1.0.0/pasorich.mjs"
    }
  ]
}
```

## 🏠 Home Page

Open this page from [https://con3code.github.io/xcx-pasorich/](https://con3code.github.io/xcx-pasorich/)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check the [issues page](https://github.com/con3code/xcx-pasorich/issues).
