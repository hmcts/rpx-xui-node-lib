/** @type {import('jest').Config} */
const config = {
    setupFiles: ['<rootDir>config.ts'],
    displayName: {
        name: 'XUI Node Lib',
        color: 'magenta',
    },
    transform: {
        '^.+\\.(t|j)sx?$': ['ts-jest', { compiler: 'typescript' }],
    },
    // IMPORTANT: allow Jest to transform ESM deps we pull transitively from otplib adapter
    transformIgnorePatterns: [
        '/node_modules/(?!(@otplib|otplib|@scure|@noble)/)',
    ],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    restoreMocks: true,
    globals: {},
}

module.exports = config
