import { getContentSecurityPolicy } from './'
import { SECURITY_POLICY } from './contentSecurityPolicy'

describe('getContentSecurityPolicy(helmet)', () => {
    it('should correctly call the content security policy', () => {
        const helmet: any = {
            contentSecurityPolicy: (policy: any) => {
                return policy
            },
        }
        expect(getContentSecurityPolicy(helmet)).toBe(SECURITY_POLICY)
    })
})
