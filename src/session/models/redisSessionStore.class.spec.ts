import redisSessionStore from './redisSessionStore.class'
import passport from 'passport'
import { Request, Response, NextFunction } from 'express'
import {createMock} from 'ts-auto-mock';
import {RedisSessionMetadata} from "./sessionMetadata.interface";
import { default as connectRedis } from 'connect-redis'
import {default as redis, RedisClient} from 'redis'
// import { AUTH } from '../../auth.constants'

describe('shouldReturnTrue()', () => {
    expect(redisSessionStore.shouldReturnTrue()).toBeTruthy()
})

describe('getStore()', () => {

    it('should call redis.createClient() with the redisCloudUrl.', () => {

        const MOCK_REDIS_CLOUD_URL = 'redis://i.am.a.redis.cloud.url'
        const MOCK_REDIS_KEY_PREFIX = 'mockRedisKeyPrefix'

        const redisSessionMetadata = createMock<RedisSessionMetadata>()

        redisSessionMetadata.redisStoreOptions.redisCloudUrl = MOCK_REDIS_CLOUD_URL
        redisSessionMetadata.redisStoreOptions.redisKeyPrefix = MOCK_REDIS_KEY_PREFIX

        const spyOnRedisCreateClient = jest.spyOn(redis, 'createClient')

        redisSessionStore.getStore(redisSessionMetadata)

        expect(spyOnRedisCreateClient).toBeCalledWith(MOCK_REDIS_CLOUD_URL, { prefix: MOCK_REDIS_KEY_PREFIX })
    })

    it('should listen for redisClient on \'ready\' event.', () => {

        const MOCK_REDIS_CLOUD_URL = 'redis://i.am.a.redis.cloud.url'
        const MOCK_REDIS_KEY_PREFIX = 'mockRedisKeyPrefix'

        const redisSessionMetadata = createMock<RedisSessionMetadata>()

        redisSessionMetadata.redisStoreOptions.redisCloudUrl = MOCK_REDIS_CLOUD_URL
        redisSessionMetadata.redisStoreOptions.redisKeyPrefix = MOCK_REDIS_KEY_PREFIX

        const spyOnRedisClientReadyListener = jest.spyOn(redisSessionStore, 'redisClientReadyListener')


        redisSessionStore.getStore(redisSessionMetadata)

        expect(spyOnRedisClientReadyListener).toBeCalledWith('hello')

        // expect(spyOnRedisCreateClient).toBeCalledWith(MOCK_REDIS_CLOUD_URL, { prefix: MOCK_REDIS_KEY_PREFIX })


    })
})

// test('OIDC configure serializeUser', () => {
//     const spy = jest.spyOn(passport, 'serializeUser')
//     oidc.serializeUser()
//     expect(spy).toBeCalled()
// })
//
// test('OIDC configure deserializeUser', () => {
//     const spy = jest.spyOn(passport, 'deserializeUser')
//     oidc.deserializeUser()
//     expect(spy).toBeCalled()
// })
//
// test('OIDC loginHandler', () => {
//     const spy = jest.spyOn(passport, 'authenticate')
//     const mockRequest = {
//         body: {},
//     } as Request
//     const mockResponse = {} as Response
//     const next = jest.fn()
//
//     oidc.loginHandler(mockRequest, mockResponse, next)
//     expect(spy).toBeCalled()
// })
//
// test('OIDC jwTokenExpired', () => {
//     const spy = jest
//     let jwtData = { exp: new Date('Jun 04, 2020').getTime() / 1000 }
//     let isTokenExpired = oidc.jwTokenExpired(jwtData)
//     expect(isTokenExpired).toBeTruthy()
//
//     jwtData = { exp: new Date().getTime() / 1000 }
//     isTokenExpired = oidc.jwTokenExpired(jwtData)
//     expect(isTokenExpired).toBeFalsy()
// })
//
// test('OIDC configure initializePassport', () => {
//     jest.mock('express', () => ({
//         Router: () => ({
//             use: jest.fn(),
//         }),
//     }))
//     const spy = jest.spyOn(passport, 'initialize')
//     oidc.initializePassport()
//     expect(spy).toBeCalled()
// })
//
// xtest('OIDC configure initializeSession', () => {
//     const spy = jest.spyOn(passport, 'session')
//     oidc.initializeSession()
//     expect(spy).toBeCalled()
// })
//
// test('OIDC OptionsMapper', () => {
//     const options = {
//         authorizationURL: '',
//         tokenURL: '',
//         clientID: 'clientId',
//         clientSecret: 'Clientsecret',
//         discoveryEndpoint: 'someEndpoint',
//         issuerURL: 'issuer_url',
//         logoutURL: 'logouturl',
//         callbackURL: 'redirect_uri',
//         responseTypes: ['none'],
//         scope: 'some scope',
//         sessionKey: 'key',
//         tokenEndpointAuthMethod: 'client_secret_basic',
//         useRoutes: false,
//     }
//     const openIdOptions = oidc.getOpenIDOptions(options)
//
//     expect(openIdOptions.client_id).toEqual(options.clientID)
//     expect(openIdOptions.client_secret).toEqual(options.clientSecret)
//     expect(openIdOptions.discovery_endpoint).toEqual(options.discoveryEndpoint)
//     expect(openIdOptions.issuer_url).toEqual(options.issuerURL)
//     expect(openIdOptions.logout_url).toEqual(options.logoutURL)
//     expect(openIdOptions.redirect_uri).toEqual(options.callbackURL)
//     expect(openIdOptions.response_types).toEqual(options.responseTypes)
//     expect(openIdOptions.scope).toEqual(options.scope)
//     expect(openIdOptions.sessionKey).toEqual(options.sessionKey)
//     expect(openIdOptions.token_endpoint_auth_method).toEqual(options.tokenEndpointAuthMethod)
//     expect(openIdOptions.useRoutes).toEqual(options.useRoutes)
// })
//
// test('test validateOptions', () => {
//     const options = {
//         authorizationURL: '',
//         tokenURL: '454',
//         clientID: 'clientId',
//         clientSecret: 'Clientsecret',
//         discoveryEndpoint: 'someEndpoint',
//         issuerURL: 'issuer_url',
//         logoutURL: 'logouturl',
//         callbackURL: 'redirect_uri',
//         responseTypes: ['none'],
//         scope: 'some scope',
//         sessionKey: 'key',
//         tokenEndpointAuthMethod: 'client_secret_basic',
//         useRoutes: false,
//     }
//     expect(() => {
//         oidc.validateOptions(options)
//     }).toThrowError('authorizationURL')
//
//     //positive case
//     options.authorizationURL = 'something'
//     const isValid = oidc.validateOptions(options)
//     expect(isValid).toBeTruthy()
// })
// test('OIDC verifyLogin error Path', () => {
//     const mockRequest = {
//         body: {},
//     } as Request
//     mockRequest.logIn = (user: any, done: (err: any) => void) => {
//         console.log('mockRequest.logIn')
//         done({})
//     }
//     const mockResponse = {} as Response
//     const next = jest.fn()
//     const user = {}
//
//     oidc.verifyLogin(mockRequest, user, next, mockResponse)
//     expect(next).toBeCalledWith({})
// })
//
// test('OIDC verifyLogin happy Path with no subscription', () => {
//     const mockRequest = {
//         body: {},
//     } as Request
//     mockRequest.logIn = (user: any, done: (err: any) => void) => {
//         console.log('mockRequest.logIn')
//         done(undefined)
//     }
//     const mockResponse = {} as Response
//     const mockRedirect = jest.fn()
//     mockResponse.redirect = mockRedirect
//     const next = jest.fn()
//     const user = {}
//
//     oidc.verifyLogin(mockRequest, user, next, mockResponse)
//     expect(next).not.toBeCalledWith({})
//     expect(mockRedirect).toBeCalledWith(AUTH.ROUTE.DEFAULT_REDIRECT)
// })
//
// test('OIDC verifyLogin happy Path with subscribtion', () => {
//     const mockRequest = {
//         body: {},
//     } as Request
//     mockRequest.logIn = (user: any, done: (err: any) => void) => {
//         console.log('mockRequest.logIn')
//         done(undefined)
//     }
//     const mockResponse = {} as Response
//     const mockRedirect = jest.fn()
//     mockResponse.redirect = mockRedirect
//     const next = jest.fn()
//     const user = {}
//
//     oidc.addListener(AUTH.EVENT.AUTHENTICATE_SUCCESS, (authObject, isVerify) => {
//         expect(isVerify).toBeFalsy()
//     })
//     oidc.verifyLogin(mockRequest, user, next, mockResponse)
//     expect(next).not.toBeCalledWith({})
// })
