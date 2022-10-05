# Contributing

If you make any contributions to this repository after this file was created,
you are agreeing that any code you have contributed will be licensed under the terms outlined in README.md.

## Prerequisites

* [node + npm](https://nodejs.org/) (Current Version)

## Setup

```
npm install
```

## Build

In order to test or distribute the extension, you must first build the TypeScript into a JavaScript bundle using one of the following commands (based on the target browser):

**Chrome:**

```
npm run build:chrome
```

**Edge:**

```
npm run build:edge
```

**Safari:**

[See here](safari/README.md) for more complete Safari instructions.

In addition to rebuilding the JavaScript extension with this command, you will also need to [re-build the Xcode Swift project as well for Safari](https://developer.apple.com/documentation/safariservices/safari_web_extensions/running_your_safari_web_extension#3744471) each time you make a change.

```
npm run build:safari
```


## Build in watch mode

You can also run the following command to automatically re-build the extension each time you change any of the source files using the `watch` script instead of `build`:

```
npm run watch:<chrome|edge|safari>
```

### Visual Studio Code

Run watch mode in VS Code:

type `Ctrl + Shift + B`

## Load extension to Chrome/Edge

1. Go to `about:extensions` or open Window -> Extensions
2. Enable "developer mode"
3. Click "Load unpacked" and select the `dist` directory

## Test

`npx jest` or `npm run test`
