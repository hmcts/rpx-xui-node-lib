import { AxiosPromise } from 'axios'
import { Request, Response } from 'express'
import { authenticator } from 'otplib'
import { http } from '../../common'
import { S2SAuth } from './s2s.class'
import { S2S } from './s2s.constants'
import { S2SConfig } from './s2sConfig.interface'

describe('S2SAuth', () => {
    let s2sAuth: S2SAuth
    const s2sConfig = {
        microservice: 'rpx_xui',
        s2sEndpointUrl: 'http://s2s.local',
        s2sSecret: 'topSecret',
    } as S2SConfig
    const postS2SResponse = {
        data: 'abc123',
    }
    const oneTimePassword = 'password'

    beforeEach(() => {
        s2sAuth = new S2SAuth()
        s2sAuth.configure(s2sConfig, {})

        jest.spyOn(authenticator, 'generate').mockReturnValue(oneTimePassword)
        jest.spyOn(http, 'post').mockImplementation(
            () => (Promise.resolve(postS2SResponse) as unknown) as AxiosPromise<string>,
        )

        // Clear the S2S token cache of any existing token for the microservice
        s2sAuth.deleteCachedToken()
    })

    it('should be true that S2SAuth is defined', () => {
        expect(S2SAuth).toBeDefined()
    })

    it('should generate an S2S token', async () => {
        const s2sToken = await s2sAuth.serviceTokenGenerator()
        expect(authenticator.generate).toHaveBeenCalledWith(s2sConfig.s2sSecret)
        expect(http.post).toHaveBeenCalledWith(`${s2sConfig.s2sEndpointUrl}`, {
            microservice: s2sConfig.microservice,
            oneTimePassword,
        })
        expect(s2sToken).toEqual('abc123')
    })

    it('should get a cached S2S token', async () => {
        // First time around, the S2S token cache is empty so a new token is generated and cached
        let s2sToken = await s2sAuth.serviceTokenGenerator()

        // Second time around, it should return the cached S2S token instead of generating a new one
        s2sToken = await s2sAuth.serviceTokenGenerator()
        expect(authenticator.generate).toHaveBeenCalledTimes(1)
        expect(http.post).toHaveBeenCalledTimes(1)
        expect(s2sToken).toEqual('abc123')
    })

    it('should generate a new S2S token if the existing one has expired', async () => {
        // First time around, the S2S token cache is empty so a new token is generated and cached
        await s2sAuth.serviceTokenGenerator()

        // Get the S2S token from the cache and manually alter the expiration
        const cachedToken = s2sAuth.getToken()
        cachedToken.expiresAt = Math.floor(Date.now() / 1000)

        // Second time around, it should generate a new S2S token (because the cached one has expired)
        await s2sAuth.serviceTokenGenerator()
        expect(authenticator.generate).toHaveBeenCalledTimes(2)
        expect(http.post).toHaveBeenCalledTimes(2)
    })

    it('should delete the cached S2S token', async () => {
        await s2sAuth.serviceTokenGenerator()
        let cachedToken = s2sAuth.getToken()
        expect(cachedToken).toBeDefined()
        s2sAuth.deleteCachedToken()
        cachedToken = s2sAuth.getToken()
        expect(cachedToken).toBeUndefined()
    })

    it('should add an S2S token to the request headers and return next()', async () => {
        const req = {
            headers: {},
        } as Request
        const res = {} as Response
        const next = (): string => {
            return 'Dummy next function'
        }

        const result = await s2sAuth.s2sHandler(req, res, next)
        expect(req.headers).toEqual({ ServiceAuthorization: 'Bearer abc123' })
        expect(result).toEqual('Dummy next function')
    })

    it('should add an S2S token to the request headers and emit an event', async () => {
        const req = {
            headers: {},
        } as Request
        const res = {} as Response
        const next = (): string => {
            return 'Dummy next function'
        }

        // Add a listener to s2sAuth, which is an EventEmitter
        s2sAuth.on(S2S.EVENT.AUTHENTICATE_SUCCESS, function (token, emittedReq, emittedRes, emittedNext) {
            expect(token).toEqual('abc123')
            expect(emittedReq).toEqual(req)
            expect(emittedRes).toEqual(res)
            expect(emittedNext).toEqual(next)
        })

        const result = await s2sAuth.s2sHandler(req, res, next)
        expect(req.headers).toEqual({ ServiceAuthorization: 'Bearer abc123' })
        // The handler should not return any result because next() should not be called, given that it should emit an
        // event instead
        expect(result).toBeUndefined()
    })

    it('should catch any error occurring and call next() with the error', async () => {
        const req = {
            headers: {},
        } as Request
        const res = {} as Response
        const next = jest.fn()

        // Mock the http.post call to return an error
        jest.spyOn(http, 'post').mockImplementation(
            () => (Promise.reject(new Error('Failed to request S2S token')) as unknown) as AxiosPromise<string>,
        )

        const result = await s2sAuth.s2sHandler(req, res, next)
        // There should not be any S2S token in the request headers
        expect(req.headers).toEqual({})
        expect(next).toHaveBeenCalledWith(Error('Failed to request S2S token'))
        expect(result).toBeUndefined()
    })

    it('should do nothing if no S2S token is returned or generated', async () => {
        const req = {
            headers: {},
        } as Request
        const res = {} as Response
        const next = jest.fn()

        // Mock the http.post call to return no token data
        jest.spyOn(http, 'post').mockImplementation(
            () => (Promise.resolve({ data: null }) as unknown) as AxiosPromise<string>,
        )

        const result = await s2sAuth.s2sHandler(req, res, next)
        // There should not be any S2S token in the request headers
        expect(req.headers).toEqual({})
        expect(next).not.toHaveBeenCalled()
        expect(result).toBeUndefined()
    })
})
