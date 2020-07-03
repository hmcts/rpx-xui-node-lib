import { arrayPatternMatch } from './'
/**
 * Same as isStringPatternMatch() but testing with multiple strings
 */
describe('arrayPatternMatch()', () => {
    const roles = ['pui-organisation-manager', 'pui-user-manager', 'pui-finance-manager']
    test.each`
        array    | pattern           | expectedResult
        ${roles} | ${'user-manager'} | ${true}
        ${roles} | ${'.'}            | ${true}
        ${roles} | ${'dwp'}          | ${false}
    `('matches $array to $pattern expecting $expectedResult', ({ array, pattern, expectedResult }) => {
        expect(arrayPatternMatch(array, pattern)).toBe(expectedResult)
    })
})
