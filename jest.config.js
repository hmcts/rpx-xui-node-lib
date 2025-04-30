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
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    restoreMocks: true,
    globals: {},
}

module.exports = config
