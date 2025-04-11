import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'
import alias from '@rollup/plugin-alias'
import path from 'path'

const packageJson = require('./package.json')

export default {
  input: 'src/index.tsx', // Your main entry point
  output: [
    {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: packageJson.module,
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    babel({
      exclude: 'node_modules/**',
      presets: ['@babel/preset-env', '@babel/preset-react'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      babelHelpers: 'bundled',
    }),
    alias({
      entries: [{ find: '@frontend', replacement: path.resolve(__dirname, '../../') }],
    }),
  ],
  external: Object.keys(packageJson.peerDependencies), // Important: Don't bundle peerDependencies
}
