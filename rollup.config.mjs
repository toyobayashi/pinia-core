import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from "rollup"
import ts from '@rollup/plugin-typescript'
import replace from '@rollup/plugin-replace'
import nodeResolve from '@rollup/plugin-node-resolve'
import alias from '@rollup/plugin-alias'
import terser from '@rollup/plugin-terser'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const input = join(__dirname, './src/index.ts')
const require = createRequire(import.meta.url)

const replaceValues = {
  __VERSION__: JSON.stringify(require('./package.json').version),
  __PINIA_VESION__: JSON.stringify(require('./package.json').devDependencies.pinia),
  __TEST__: 'false',
  __FEATURE_PROD_DEVTOOLS__: 'false',
  __COMPAT__: 'false',
  __SSR__: 'false'
}

const tsOptions = { declaration: false }
const aliasOptions = { entries: [{ find: 'vue-demi', replacement: join(__dirname, './src/vue/index.ts') }] }
const terserOptions = {
  compress:true,
  mangle: true,
  output: {
    comments: false
  }
}

export default defineConfig([
  {
    input,
    output: {
      file: join(__dirname, './dist/pinia-core.esm-bundler.js'),
      format: 'esm'
    },
    external: ['@vue/reactivity', '@vue/shared', '@vue/runtime-core', '@vue/devtools-api'],
    plugins: [
      ts(tsOptions),
      nodeResolve(),
      alias(aliasOptions),
      replace({
        preventAssignment: true,
        values: {
          __DEV__: '(process.env.NODE_ENV !== "production")',
          ...replaceValues
        }
      })
    ]
  },
  {
    input,
    output: {
      file: join(__dirname, './dist/pinia-core.cjs.js'),
      format: 'cjs'
    },
    external: ['@vue/reactivity', '@vue/shared', '@vue/runtime-core', '@vue/devtools-api'],
    plugins: [
      ts(tsOptions),
      nodeResolve(),
      alias(aliasOptions),
      replace({
        preventAssignment: true,
        values: {
          __DEV__: 'true',
          'process.env.NODE_ENV': '"development"',
          ...replaceValues
        }
      })
    ]
  },
  {
    input,
    output: {
      file: join(__dirname, './dist/pinia-core.cjs.min.js'),
      format: 'cjs'
    },
    external: ['@vue/reactivity', '@vue/shared', '@vue/runtime-core', '@vue/devtools-api'],
    plugins: [
      ts(tsOptions),
      nodeResolve(),
      alias(aliasOptions),
      replace({
        preventAssignment: true,
        values: {
          __DEV__: 'false',
          'process.env.NODE_ENV': '"production"',
          ...replaceValues
        }
      }),
      terser(terserOptions)
    ]
  },
  {
    input,
    output: {
      file: join(__dirname, './dist/pinia-core.js'),
      format: 'umd',
      name: 'PiniaCore',
      globals: {
        '@vue/reactivity': 'VueReactivity'
      }
    },
    external: ['@vue/reactivity'],
    plugins: [
      ts(tsOptions),
      nodeResolve(),
      alias(aliasOptions),
      replace({
        preventAssignment: true,
        values: {
          __DEV__: 'true',
          'process.env.NODE_ENV': '"development"',
          ...replaceValues
        }
      })
    ]
  },
  {
    input,
    output: {
      file: join(__dirname, './dist/pinia-core.min.js'),
      format: 'umd',
      name: 'PiniaCore',
      globals: {
        '@vue/reactivity': 'VueReactivity'
      }
    },
    external: ['@vue/reactivity'],
    plugins: [
      ts(tsOptions),
      nodeResolve(),
      alias(aliasOptions),
      replace({
        preventAssignment: true,
        values: {
          __DEV__: 'false',
          'process.env.NODE_ENV': '"production"',
          ...replaceValues
        }
      }),
      terser(terserOptions)
    ]
  },
])
