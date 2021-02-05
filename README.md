# vue-sidenoder

![Platforms](https://img.shields.io/static/v1?label=platform&message=win%20%7C%20mac%20%7C%20linux&color=blue&style=for-the-badge)
[![GitHub release](https://img.shields.io/github/v/release/ov3rk1ll/vue-sidenoder?style=for-the-badge&sort=semver&label=release)](https://github.com/ov3rk1ll/vue-sidenoder/releases/latest)
[![GitHub build](https://img.shields.io/github/workflow/status/ov3rk1ll/vue-sidenoder/build-release?style=for-the-badge)](https://github.com/ov3rk1ll/vue-sidenoder/actions?query=workflow%3Abuild-release)

_Based on [quest-sidenoder](https://github.com/whitewhidow/quest-sidenoder)_

**New interface built in Vue with some new features**

![preview](https://i.imgur.com/Z80gSnU.gif)

## Project setup

Make sure to use at least node v15 and npm v7!  
You can check your current version by running `node --version` and `npm --version` respectively.  
To update node, follow the install instructions [here](https://nodejs.org/en/download/current/). To update npm you can run `npm i -g npm@7`.

After that, clone the project and run `npm install` to download all dependencies.

## Commands

See below for a list of usefull commands

## Compiles and hot-reloads for development

This is the primary command to run the app

```
npm run serve
```

## Build for production

```
npm run build
```

## Format code and fix lint issues

After any changes to the code, make sure they are formatted correctly using prettier by running

```
npm run fmt
```

## Test before commit

Before a commit, make sure all files are formatted correctly and pass all eslint checks by running

```
npm run test
```

This is also run as a pre-commit hook automatically using husky.
