import { defineConfig } from 'tsup'
import { sassPlugin } from 'esbuild-sass-plugin'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import postcssPresetEnv from 'postcss-preset-env'

const postCss = postcss([
  autoprefixer,
  postcssPresetEnv({ stage: 2 })
])

export default defineConfig({
  entry: ['src/index.js'],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ['esm', 'cjs'],
  onSuccess: 'run-s build-definitions',
  esbuildPlugins: [
    sassPlugin({
      async transform(source) {
        const { css } = await postCss.process(source, { from: undefined })
        return css
      }
    })
  ]
})
