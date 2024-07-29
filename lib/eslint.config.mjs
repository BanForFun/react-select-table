import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import { fixupPluginRules } from '@eslint/compat';

export default tsEslint.config(
    eslint.configs.recommended,
    ...tsEslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        plugins: {
            react: reactPlugin,
            'react-hooks': fixupPluginRules(reactHooksPlugin)
        },
        settings: {
            react: {
                version: 'detect'
            }
        },
        rules: {
            ...reactPlugin.configs['recommended'].rules,
            ...reactPlugin.configs['jsx-runtime'].rules,
            ...reactHooksPlugin.configs.recommended.rules
        }
    }
);