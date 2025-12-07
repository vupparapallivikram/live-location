# @dataport/eslint-config-geodev

This package provides shared ESLint configurations for JavaScript projects.

## Installation

```bash
$ npm i -D eslint @dataport/eslint-config-geodev
```

## Usage

Example for eslint.config.js:

```js
import { defineConfig } from 'eslint/config'
import mainConfig from '@dataport/eslint-config-geodev'
import nodeConfig from '@dataport/eslint-config-geodev/node'
import tsConfig from '@dataport/eslint-config-geodev/typescript'

export default defineConfig([
	{
		files: ['**/*.js', '**/*.ts'],
		extends: [mainConfig, nodeConfig],
	},
	{
		files: ['**/*.ts'],
		extends: [tsConfig],
	},
])
```

The following sub-configs are offered:

- `node`
- `browser`
- `typescript`
- `vue`
- `vue2`
