# Archiyou VuePress docs

This directory contains the VuePress documentation.

## Deployments

```
yarn dev
yarn build
```

## Setup

* Config: ./src/.vuepress/config.js contains all the configuration (plugins, themes etc)
* Homepage: ./src/index.md uses Frontmatter YAML to config a basic homepage. See: https://vuepress.vuejs.org/theme/default-theme-config.html#homepage
* Pages: Are grouped by section. Each section is a directory in ./src/. For example /guide

## Generating API docs

* in /docs 
* npx typedoc