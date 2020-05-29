// import axios from 'axios'
// import { AxiosInstance } from 'axios'
// import { AxiosResponse } from 'axios'
// import chai from 'chai'
// import { expect } from 'chai'
// // eslint-disable-next-line @typescript-eslint/camelcase
// import jwt_decode from 'jwt-decode'
// import sinon from 'sinon'
// import sinonChai from 'sinon-chai'
// import { mockReq, mockRes } from 'sinon-express-mock'
import { S2SConfig } from './s2sConfig.interface'
import { S2SAuth } from './s2s.class'
// import * as serviceAuth from './serviceAuth'

// chai.use(sinonChai)

describe('S2SAuth', () => {
    let s2sAuth: S2SAuth
    const s2sConfig = {
        microservice: 'rpx-xui',
        s2sEndpointUrl: 'http://s2s.local',
        s2sSecret: 'topSecret',
    } as S2SConfig
    // const token = 'abc123'

    beforeEach(() => {
        s2sAuth = new S2SAuth()
        s2sAuth.configure(s2sConfig)
        // sinon.stub(serviceAuth, 'postS2SLease').resolves(token)
        // eslint-disable-next-line @typescript-eslint/camelcase
        // sinon.stub(jwt_decode.prototype).returns({ exp: Math.floor(Date.now() + 10000 / 1000) })
    })

    it('should be true that S2SAuth is defined', () => {
        expect(S2SAuth).toBeDefined()
    })

    // xit('should return true that the cache is valid', () => {
    //     const req = mockReq()
    //     const res = mockRes()
    //     // eslint-disable-next-line @typescript-eslint/no-empty-function
    //     const next = (): void => {}

    //     s2sAuth.s2sHandler(req, res, next)
    // })
})
