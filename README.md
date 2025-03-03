# Archiyou-core

![Archiyou](assets/archiyou_logo_header_white_bg.png)

## 🌐 What is Archiyou?

Archiyou is an online platform to codify design and making know-how. It is currently in alpha phase and freely available to try. See [Archiyou.com](https://archiyou.com).

## 🚩 What is Archiyou-core?

This is the core library of the Archiyou platform. It consists of the following parts:

- 🛠️ **Geom** - The module to create geometry and topology shapes. Wraps a custom build of [OpenCascade.js](https://github.com/donalffons/opencascade.js).
- 📦 **Exporter** - Module to export data
- ☝ **Importer (IO)** - Module in-progress to import data from different sources like SVG's, geodata etc.
- ⭐ **Annotator** - A module for generating annotations like dimension lines and labels
- 📚 **Doc** - The module to define documents, pages and add content (shapes, text, images) to them
- 🌈 **Misc utils** - A way to parse scripts in different scopes (like Webworkers)

This repository also contains:

- 📄 **Documentation** - Containing all VuePress documentation at [docs.archiyou.com](https://docs.archiyou.com)
- ⏰ **Unit tests** - Very basic tests of the core functionality based on Jest (see /tests/)

## 💙 Open Source Core

Archiyou would not exist without great open source software: geometry kernel [OpenCascade](https://github.com/Open-Cascade-SAS/OCCT), [OpenCascade.js](https://github.com/donalffons/opencascade.js), [CadQuery](https://github.com/CadQuery/cadquery) and many others.

That's why we want to keep the core of Archiyou open. This has some advantages:

* CAD content created on the Archiyou platform is always portable and can be used without Archiyou. Never a vendor lock-in!
* Open source CAD based on OpenCascade kernel like FreeCAD, CadQuery, ZenCAD, RepliCAD and now Archiyou can work together to challenge the proprietary CAD systems. For maximum adoption and compatibility with CadQuery we chose the Apache2 License

Currently the source code of the platform itself (the frontend app and server infrastructure) remains closed but parts of it become open source in collaborations like [OCCI](https://github.com/occi-cad).

## 🏗 What is the state of Archiyou-core?

We are building the Archiyou platform, its content and the core at the same time. Currently Archiyou-core is deployed in our alpha platform; running both in the browser as a server side Node environment. Please keep in mind that it is still _alpha_ phase code quality.

## 🚀 Getting started

* Try it out at [Archiyou.com](https://archiyou.com)
We are working on starter templates for developers:
- [ ] Basic: run your Archiyou script without Archiyou
- [ ] Use Archiyou-core in a modern app
- [ ] Use Archiyou-core in a server Node environment

Let us know if you like more usage scenarios!

## 🙋 Contributions

We love to get contributions. For example:

* Bug reports and fixes
* Documentation and examples for docs.archiyou.com
* Community organizing: workshops for example
* Open design content: make content and share it on the Archiyou platform or OCCI for others

## 🙏 Collaborations and recommended projects

* [Open CAD Components Interface (OCCI)](https://github.com/occi-cad) - Publish your CAD scripts as parametric CAD components (with CadQuery team and OTF)

Other great projects that might suit your needs:

* [CadQuery](https://github.com/CadQuery/cadquery) - Python based Script CAD and inspiration for Archiyou
* [OpenCascade.js](https://github.com/donalffons/opencascade.js) - Run a CAD kernel directly in your browser. Without the great work by Sebastian on porting the OpenCascade kernel to WASM Archiyou would not exist
* [Replicad](https://github.com/sgenoud/replicad) - Great script CAD library by Steve based on the same technology as Archiyou. Generally more focussed on developers.

## 🙌 License

Archiyou-core is licensed under the terms of the Apache Public License, version 2.0.

### Developer Notes

More developer guides are coming!

#### Basics

```
yarn
yarn dev
yarn build
yarn test
yarn apidocs
```

* To avoid TS errors on OC.js libs: Add // @ts-nocheck to archiyou-opencascade.d.ts

#### Special builds:

* Standalone TypeDocs: npx typedoc (in ./docs/src/.vuepress/dist/apidocs - so we can combine with VuePress docs)
* TS compilation testing: npx tsc  -t es5 --experimentalDecorators --esModuleInterop  --noEmit geom.ts
* TS compile *.d.ts for Intellisense: npx tsc  -t es5 --experimentalDecorators --esModuleInterop -d --outDir ".\d\d.ts" --emitDeclarationOnly geom.ts

#### Testing

```
yarn test
yarn test --silent
```

#### Debug

* Circular dependences:
     * with dpdm:
        `npm i -g dpdm
        dpdm internal.ts`
     * with madge:
        `npx madge --circular --extensions ts internal.ts`

#### Building as module and publishing locally

Untill we publish on NPM.

```bash
yarn build
npm link
# that at app that uses module
npm link archiyou-core
```