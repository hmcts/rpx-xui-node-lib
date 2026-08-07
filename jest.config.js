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
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    modulePathIgnorePatterns: ['<rootDir>/dist/'],
    moduleNameMapper: {
        '^jest-mock-axios$': '<rootDir>/node_modules/jest-mock-axios/dist/index.js',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    restoreMocks: true,
    globals: {},
}

module.exports = config
