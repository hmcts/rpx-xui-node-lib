module.exports = {
    setupFiles: ['<rootDir>config.ts'],
    displayName: {
        name: 'XUI Node Lib',
        color: 'magenta',
    },
    transform: {
        '^.+\\.(t|j)sx?$': 'ts-jest',
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    // coverageThreshold: {
    //     global: {
    //         branches: 80,
    //         functions: 80,
    //         lines: 80,
    //         statements: 80,
    //     },
    // },
    restoreMocks: true,
    globals: {
        'ts-jest': {
            compiler: 'ttypescript',
        },
    },
}
