import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import jsdoc from 'eslint-plugin-jsdoc'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
    globalIgnores(['dist']),
    js.configs.recommended,
    {
        files: ['src/**/*.ts'],
        extends: [
            ...tseslint.configs.recommended,
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        plugins: {
            jsdoc,
        },
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                projectService: true,
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports' },
            ],
            'no-console': ['error', { allow: ['warn', 'error'] }],
            'prefer-template': 'error',
            'jsdoc/require-jsdoc': [
                'error',
                {
                    publicOnly: true,
                    require: {
                        FunctionDeclaration: true,
                        ClassDeclaration: true,
                        MethodDefinition: true,
                    },
                },
            ],
        },
    },
])