import { isStringPatternMatch } from './'

describe('isRoleMatch()', () => {
    test.each`
        string                | pattern    | expectedResult
        ${'pui-case-manager'} | ${'case-'} | ${true}
        ${'pui-case-manager'} | ${'pui'}   | ${true}
        ${'pui-case-manager'} | ${'dwp-'}  | ${false}
        ${'pui'}              | ${'.'}     | ${true}
    `('matches $string to $pattern', ({ string, pattern, expectedResult }) => {
        expect(isStringPatternMatch(string, pattern)).toBe(expectedResult)
    })
})
