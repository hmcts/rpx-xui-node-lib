import tseslint from 'typescript-eslint';

export default [
    // Ignore dist directory
    {
        ignores: ['dist/**'],
    },

    // Recommended TypeScript config
    ...tseslint.configs.recommended,

    // Global rules that work in all files (TS + JS)
    {
        rules: {
            'quotes': ['warn', 'single', { avoidEscape: true }],
            'no-extra-semi': 'error',
        },
    },

    // typescript rules
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    args: 'after-used',
                    argsIgnorePattern: '^_', // Only ignores function args like `_param`
                    varsIgnorePattern: '^_', // Only ignores variables like `_unused`
                },
            ],
        },
    },
];
