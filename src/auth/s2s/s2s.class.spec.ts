import { AxiosPromise } from 'axios'
// eslint-disable-next-line @typescript-eslint/camelcase
import jwt_decode from 'jwt-decode'
import * as nodeOtp from 'node-otp'
import { http } from '../../http/http'
import { DecodedJWT } from './decodedJwt.interface'
import { S2SConfig } from './s2sConfig.interface'
import { S2SAuth } from './s2s.class'

describe('S2SAuth', () => {
    let s2sAuth: S2SAuth
    const s2sConfig = {
        microservice: 'rpx_xui',
        s2sEndpointUrl: 'http://s2s.local',
        s2sSecret: 'topSecret',
    } as S2SConfig
    const token = {
        data: 'abc123',
    }
    const oneTimePassword = 'password'

    beforeEach(() => {
        s2sAuth = new S2SAuth()
        s2sAuth.configure(s2sConfig)

        jest.spyOn(nodeOtp, 'totp').mockReturnValue(oneTimePassword)
        jest.spyOn(http, 'post').mockImplementation(() => (Promise.resolve(token) as unknown) as AxiosPromise<string>)

        jest.mock(
            'jwt-decode',
            () => jest.fn().mockReturnValue({ exp: Math.floor((Date.now() + 10000) / 1000) }),
            // jest.fn().mockImplementation(() => ({ exp: Math.floor((Date.now() + 10000) / 1000) } as DecodedJWT)),
        )
    })

    it('should be true that S2SAuth is defined', () => {
        expect(S2SAuth).toBeDefined()
    })

    xit('should generate an S2S token', async () => {
        const s2sToken = await s2sAuth.serviceTokenGenerator()
        expect(s2sToken).toEqual(token)
    })
    // it('should return true that the cache is valid', () => {
    //     const req = mockReq()
    //     const res = mockRes()
    //     // eslint-disable-next-line @typescript-eslint/no-empty-function
    //     const next = (): void => {}

    //     s2sAuth.s2sHandler(req, res, next)
    // })
})
