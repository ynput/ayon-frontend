import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'
import scss from 'rollup-plugin-scss'
import styles from 'rollup-plugin-styles'

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
    resolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx'], // Add extensions here
    }),
    commonjs(),
    // Place typescript before babel
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      inlineSources: true,
    }),
    babel({
      exclude: 'node_modules/**',
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
        '@babel/preset-typescript', // Add TypeScript preset
      ],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      babelHelpers: 'bundled',
    }),
    scss({
      // Add rollup-plugin-scss
      // You can add options here if needed (e.g., outputStyle)
    }),
    styles({
      // Add rollup-plugin-styles
      mode: 'inject', // Or 'extract' for separate CSS files
    }),
  ],
  external: Object.keys(packageJson.peerDependencies), // Important: Don't bundle peerDependencies
}
