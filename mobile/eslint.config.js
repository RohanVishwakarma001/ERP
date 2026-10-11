// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      // Unused Expo starter-template files, pending deletion (see refactor notes).
      "src/app/explore.tsx",
      "src/components/{animated-icon,animated-icon.web,app-tabs,app-tabs.web,external-link,hint-row,themed-text,themed-view,web-badge}.tsx",
      "src/components/ui/collapsible.tsx",
      "src/hooks/{use-color-scheme,use-color-scheme.web,use-theme}.ts",
    ],
  }
]);
