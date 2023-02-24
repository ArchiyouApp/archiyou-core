require('dotenv').config() // see https://www.npmjs.com/package/dotenv

module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: 'Archiyou docs',
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: 'Archiyou documentation and API reference',

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
  head: [
    ['link', { rel: "icon", type: "image/png", sizes: "32x32", href: "/fav_icon.png"}],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    logo: '/ay_logo_pwa.png',
    repo: '',
    editLinks: false,
    docsDir: '',
    editLinkText: '',
    lastUpdated: false,
    nav: [
      {
        text: 'Guide',
        link: '/guide/',
      },
      {
        text: 'API reference',
        link: process.env.AY_APIDOCS_URL,
      },
      {
        text: 'Forum',
        link: process.env.AY_FORUM_URL,
      },
    ],
    // see: https://v1.vuepress.vuejs.org/theme/default-theme-config.html#multiple-sidebars
    sidebar: 
        [
          {
            title: 'Introduction',
            path: '/guide/introduction/',
            collapsable: false,
            sidebarDepth: 1,
            children: [
              // included index.md
              '/guide/introduction/why-archiyou',
              '/guide/introduction/archiyou-ecosystem',
              '/guide/introduction/language-introduction',
              '/guide/introduction/language-more',
              '/guide/introduction/language-basics'
            ]
          },
          {
            title: 'Quickstart Examples',
            path: '/guide/quickstart/',
            collapsable: false,
            sidebarDepth: 1,
            children: [
              '/guide/quickstart/tablex',
            ]
          },
          {
            title: 'User guide',
            path: '/guide/userguide/',
            collapsable: false,
            sidebarDepth: 1,
            children: [
              '/guide/userguide/editor',
            ]
          },
          {
            title: 'Modeling Guide',
            path: '/guide/modeling/',
            collapsable: false,
            sidebarDepth: 1,
            children: [
              '/guide/modeling/terminology',
              '/guide/modeling/model-org',
              '/guide/modeling/model-access',
              '/guide/modeling/overview',
              '/guide/modeling/topology',
              '/guide/modeling/csg',
              '/guide/modeling/sketching',
              '/guide/modeling/surface',
              '/guide/modeling/systems',
              '/guide/modeling/misc',
            ]
          },
        ]
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    '@vuepress/plugin-back-to-top',
    '@vuepress/plugin-medium-zoom',
    ['vuepress-plugin-typedoc', {
        // see: https://www.npmjs.com/package/vuepress-plugin-typedoc
        // Plugin options
        // Paths from docs dir
        entryPoints: ["../src/internal.ts"],    
        tsconfig : "../tsconfig.json",
        out: 'api',
        sidebar: {
          fullNames: true,
          parentCategory: 'API'
        },
      }
    ]
  ]
}
