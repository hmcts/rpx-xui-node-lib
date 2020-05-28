import axios from 'axios'
import { AxiosInstance } from 'axios'
import { AxiosResponse } from 'axios'
import chai from 'chai'
import { expect } from 'chai'
import * as otp from 'otp'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { S2SConfig } from './s2sConfig.interface'
import * as serviceAuth from './serviceAuth'

chai.use(sinonChai)

xdescribe('serviceAuth', () => {
    let fakeAxiosInstance: AxiosInstance

    const s2sConfig = {
        microservice: 'rpx-xui',
        s2sEndpointUrl: 'http://s2s.local',
        s2sSecret: 'topSecret',
    } as S2SConfig
    const oneTimePassword = 'password'

    beforeEach(() => {
        // Ensure that when postS2SLease() calls http(req), its axios.create() function call returns a fake AxiosInstance
        fakeAxiosInstance = ({
            interceptors: {
                request: {
                    use: sinon.stub(),
                },
                response: {
                    use: sinon.stub(),
                },
            },
            post: Function(),
        } as unknown) as AxiosInstance
        sinon.stub(axios, 'create').returns(fakeAxiosInstance)
    })

    afterEach(() => {
        sinon.restore()
    })

    it('should make a http.post call to the S2S endpoint URL to obtain a token', async () => {
        // Stub the fakeAxiosInstance.post call to return a mock response
        sinon.stub(fakeAxiosInstance, 'post').resolves({ data: 'okay' } as AxiosResponse)

        // Stub the OTP.totp call to return a dummy password
        sinon.stub(otp.prototype, 'totp').returns(oneTimePassword)

        const response = await serviceAuth.postS2SLease(s2sConfig)
        expect(fakeAxiosInstance.post).to.be.calledWith(s2sConfig.s2sEndpointUrl, {
            microservice: s2sConfig.microservice,
            oneTimePassword,
        })
        expect(response).to.equal('okay')
    })
})
