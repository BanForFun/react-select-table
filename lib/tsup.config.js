import { defineConfig } from 'tsup';
import { sassPlugin } from 'esbuild-sass-plugin';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import postcssPresetEnv from 'postcss-preset-env';

const postCss = postcss([
    autoprefixer,
    postcssPresetEnv({ stage: 2 })
]);

export default defineConfig(options => ({
    entry: ['src/index.ts'],
    dts: true,
    sourcemap: true,
    format: ['esm', 'cjs'],
    target: 'es2022',
    minify: !options.watch,
    esbuildPlugins: [
        sassPlugin({
            transform: (src, dir, file) =>
                postCss.process(src, { from: file }).then(r => r.css)
        })
    ]
}));
