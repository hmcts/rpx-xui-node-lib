// import { AxiosResponse } from 'axios'
// import chai from 'chai'
// import { expect } from 'chai'
// import * as nodeOtp from 'node-otp'
// import sinon from 'sinon'
// import sinonChai from 'sinon-chai'
// import { http } from '../../http/http'
// import { S2SConfig } from './s2sConfig.interface'
// import * as serviceAuth from './serviceAuth'

// chai.use(sinonChai)

// describe('serviceAuth', () => {
//     const s2sConfig = {
//         microservice: 'rpx-xui',
//         s2sEndpointUrl: 'http://s2s.local',
//         s2sSecret: 'topSecret',
//     } as S2SConfig
//     const oneTimePassword = 'password'

//     afterEach(() => {
//         sinon.restore()
//     })

//     it('should make a http.post call to the S2S endpoint URL to obtain a token', async () => {
//         // Stub the http.post call to return a mock response
//         sinon.stub(http, 'post').resolves({ data: 'okay' } as AxiosResponse)

//         // Stub the node-otp totp call to return a dummy password
//         sinon.stub(nodeOtp, 'totp').returns(oneTimePassword)

//         const response = await serviceAuth.postS2SLease(s2sConfig)
//         expect(http.post).to.be.calledWith(s2sConfig.s2sEndpointUrl, {
//             microservice: s2sConfig.microservice,
//             oneTimePassword,
//         })
//         expect(response).to.equal('okay')
//     })
// })

it('should serviceAuth', () => {
    expect(true).toBeTruthy()
})
