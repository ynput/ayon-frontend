import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  js.configs.recommended,
  react.configs.flat.recommended,
  prettierConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2021 },
    },
    // explicit: eslint-plugin-react 7.x 'detect' calls context.getFilename(), removed in ESLint 10
    settings: { react: { version: '18.3' } },
    plugins: {
      'react-hooks': reactHooks,
      prettier,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error', // Checks rules of Hooks
      'react-hooks/exhaustive-deps': 'warn', // Checks effect dependencies
    },
  },
  // TypeScript: parse TS syntax and leave what the compiler already checks (no-undef etc.) to tsc
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...tseslint.configs.eslintRecommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
]
