import { sortArray } from './'

describe('sortArray()', () => {
    it('should sort an array alphabetically', () => {
        const roles = [
            'caseworker-divorce-financialremedy',
            'pui-user-manager',
            'pui-case-manager',
            'caseworker-probate-solicitor',
            'caseworker',
            'caseworker-probate',
            'caseworker-divorce-financialremedy-solicitor',
            'caseworker-divorce',
            'pui-organisation-manager',
            'pui-finance-manager',
            'caseworker-divorce-solicitor',
        ]

        const sortedRoles = roles.sort()

        expect(sortArray(roles)).toEqual(sortedRoles)
    })
})
