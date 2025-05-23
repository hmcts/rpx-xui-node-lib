import { getContentSecurityPolicy } from './'
import { SECURITY_POLICY } from './contentSecurityPolicy'

describe('getContentSecurityPolicy(helmet)', () => {
    it('should correctly call the content security policy', () => {
        const helmet: any = {
            contentSecurityPolicy: (policy: any) => {
                return policy
            },
        }
        expect(getContentSecurityPolicy(helmet)).toEqual({
            directives: {
                ...SECURITY_POLICY.directives,
                scriptSrc: [...SECURITY_POLICY.directives.scriptSrc, expect.any(Function)],
            },
        })
    })
})
