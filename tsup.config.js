import { defineConfig } from 'tsup'
import { sassPlugin } from 'esbuild-sass-plugin'

export default defineConfig({
  entry: ['src/index.js'],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ['esm', 'cjs'],
  onSuccess: 'run-s build-definitions',
  esbuildPlugins: [
    sassPlugin()
  ]
})
