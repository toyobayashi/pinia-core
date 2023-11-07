import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from "rollup"
import ts from '@rollup/plugin-typescript'
import replace from '@rollup/plugin-replace'
import nodeResolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const input = join(__dirname, './src/index.ts')

const replaceValues = {
  __TEST__: 'false',
  __FEATURE_PROD_DEVTOOLS__: 'false',
  __COMPAT__: 'false',
  __SSR__: 'false'
}

const tsOptions = { declaration: false }

export default defineConfig([
  {
    input,
    output: {
      file: join(__dirname, './dist/pinia-core.esm-bundler.js'),
      format: 'esm'
    },
    external: ['@vue/reactivity', '@vue/shared'],
    plugins: [
      ts(tsOptions),
      nodeResolve(),
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
      replace({
        preventAssignment: true,
        values: {
          __DEV__: 'true',
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
      replace({
        preventAssignment: true,
        values: {
          __DEV__: 'false',
          ...replaceValues
        }
      }),
      terser()
    ]
  },
])
