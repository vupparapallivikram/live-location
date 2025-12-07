import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsparser,
        ecmaVersion: 2021,
        sourceType: 'module',
        extraFileExtensions: ['.vue']
      },
      globals: {
        // Browser globals
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        WebSocket: 'readonly',
        crypto: 'readonly',
        clearTimeout: 'readonly',
        setTimeout: 'readonly',
        // TypeScript types
        HTMLDivElement: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      'vue/multi-word-component-names': 'off',
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-empty': 'warn'
    }
  },
  {
    ignores: ['node_modules', 'dist', '*.config.js', '.eslintrc.cjs']
  }
]
