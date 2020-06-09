import oidc from './openid.class'
import passport from 'passport'
import { Request, Response, NextFunction } from 'express'
import { AUTH } from '../../auth.constants'
import { Issuer, Strategy, Client } from 'openid-client'

afterEach(() => {
    jest.restoreAllMocks()
})

test('OIDC Auth', () => {
    expect(oidc).toBeDefined()
})

test('OIDC configure strategy', () => {
    const spy = jest.spyOn(passport, 'use')
    const strategy = {} as Strategy<any, any>
    oidc.useStrategy('name', strategy)
    expect(spy).toBeCalledWith('name', strategy)
})

test('OIDC configure serializeUser', () => {
    const spy = jest.spyOn(passport, 'serializeUser')
    oidc.serializeUser()
    expect(spy).toBeCalled()
})

test('OIDC configure deserializeUser', () => {
    const spy = jest.spyOn(passport, 'deserializeUser')
    oidc.deserializeUser()
    expect(spy).toBeCalled()
})

test('OIDC loginHandler', () => {
    const spy = jest.spyOn(passport, 'authenticate')
    const mockRequest = {
        body: {},
    } as Request
    const mockResponse = {} as Response
    const next = jest.fn()

    oidc.loginHandler(mockRequest, mockResponse, next)
    expect(spy).toBeCalled()
})

test('OIDC jwTokenExpired', () => {
    const spy = jest
    let jwtData = { exp: new Date('Jun 04, 2020').getTime() / 1000 }
    let isTokenExpired = oidc.jwTokenExpired(jwtData)
    expect(isTokenExpired).toBeTruthy()

    jwtData = { exp: new Date().getTime() / 1000 }
    isTokenExpired = oidc.jwTokenExpired(jwtData)
    expect(isTokenExpired).toBeFalsy()
})

test('OIDC configure initializePassport', () => {
    const spy = jest.spyOn(passport, 'initialize')
    oidc.initializePassport()
    expect(spy).toBeCalled()
})

test('OIDC configure initializeSession', () => {
    const spy = jest.spyOn(passport, 'session')
    oidc.initializeSession()
    expect(spy).toBeCalled()
})

test('OIDC OptionsMapper', () => {
    const options = {
        authorizationURL: '',
        tokenURL: '',
        clientID: 'clientId',
        clientSecret: 'Clientsecret',
        discoveryEndpoint: 'someEndpoint',
        issuerURL: 'issuer_url',
        logoutURL: 'logouturl',
        callbackURL: 'redirect_uri',
        responseTypes: ['none'],
        scope: 'some scope',
        sessionKey: 'key',
        tokenEndpointAuthMethod: 'client_secret_basic',
        useRoutes: false,
    }
    const openIdOptions = oidc.getOpenIDOptions(options)

    expect(openIdOptions.client_id).toEqual(options.clientID)
    expect(openIdOptions.client_secret).toEqual(options.clientSecret)
    expect(openIdOptions.discovery_endpoint).toEqual(options.discoveryEndpoint)
    expect(openIdOptions.issuer_url).toEqual(options.issuerURL)
    expect(openIdOptions.logout_url).toEqual(options.logoutURL)
    expect(openIdOptions.redirect_uri).toEqual(options.callbackURL)
    expect(openIdOptions.response_types).toEqual(options.responseTypes)
    expect(openIdOptions.scope).toEqual(options.scope)
    expect(openIdOptions.sessionKey).toEqual(options.sessionKey)
    expect(openIdOptions.token_endpoint_auth_method).toEqual(options.tokenEndpointAuthMethod)
    expect(openIdOptions.useRoutes).toEqual(options.useRoutes)
})

test('test validateOptions', () => {
    const options = {
        authorizationURL: '',
        tokenURL: '454',
        clientID: 'clientId',
        clientSecret: 'Clientsecret',
        discoveryEndpoint: 'someEndpoint',
        issuerURL: 'issuer_url',
        logoutURL: 'logouturl',
        callbackURL: 'redirect_uri',
        responseTypes: ['none'],
        scope: 'some scope',
        sessionKey: 'key',
        tokenEndpointAuthMethod: 'client_secret_basic',
        useRoutes: false,
    }
    expect(() => {
        oidc.validateOptions(options)
    }).toThrowError('authorizationURL')

    //positive case
    options.authorizationURL = 'something'
    const isValid = oidc.validateOptions(options)
    expect(isValid).toBeTruthy()
})
test('OIDC verifyLogin error Path', () => {
    const mockRequest = {
        body: {},
    } as Request
    mockRequest.logIn = (user: any, done: (err: any) => void) => {
        console.log('mockRequest.logIn')
        done({})
    }
    const mockResponse = {} as Response
    const next = jest.fn()
    const user = {}

    oidc.verifyLogin(mockRequest, user, next, mockResponse)
    expect(next).toBeCalledWith({})
})

test('OIDC verifyLogin happy Path with no subscription', () => {
    const mockRequest = {
        body: {},
    } as Request
    mockRequest.logIn = (user: any, done: (err: any) => void) => {
        console.log('mockRequest.logIn')
        done(undefined)
    }
    const mockResponse = {} as Response
    const mockRedirect = jest.fn()
    mockResponse.redirect = mockRedirect
    const next = jest.fn()
    const user = {}

    oidc.verifyLogin(mockRequest, user, next, mockResponse)
    expect(next).not.toBeCalledWith({})
    expect(mockRedirect).toBeCalledWith(AUTH.ROUTE.DEFAULT_REDIRECT)
})

test('OIDC verifyLogin happy Path with subscribtion', () => {
    const mockRequest = {
        body: {},
    } as Request
    mockRequest.logIn = (user: any, done: (err: any) => void) => {
        console.log('mockRequest.logIn')
        done(undefined)
    }
    const mockResponse = {} as Response
    const mockRedirect = jest.fn()
    mockResponse.redirect = mockRedirect
    const next = jest.fn()
    const user = {}

    oidc.addListener(AUTH.EVENT.AUTHENTICATE_SUCCESS, (authObject, isVerify) => {
        expect(isVerify).toBeFalsy()
    })
    oidc.verifyLogin(mockRequest, user, next, mockResponse)
    expect(next).not.toBeCalledWith({})
})

test('OIDC discoverIssuer', async () => {
    const spy = jest.spyOn(Issuer, 'discover').mockImplementation(() => Promise.resolve({} as Issuer<Client>))
    await oidc.discoverIssuer()
    expect(spy).toBeCalled()
})

test('OIDC discover', () => {
    const issuer = {}
    const spyNewIssuer = jest.spyOn(oidc, 'newIssuer')
    const spy = jest.spyOn(oidc, 'discoverIssuer').mockImplementation(() => Promise.resolve({ metadata: issuer }))

    const result = oidc.discover()
    expect(spy).toBeCalled()
})

test('OIDC authenticate when not authenticated', async () => {
    const mockRequest = {
        body: {},
    } as Request
    mockRequest.isUnauthenticated = () => true
    const mockResponse = {} as Response
    const mockRedirect = jest.fn()
    mockResponse.redirect = mockRedirect

    const next = jest.fn()
    await oidc.authenticate(mockRequest, mockResponse, next)
    expect(mockRedirect).toBeCalledWith(AUTH.ROUTE.LOGIN)
})

test('OIDC authenticate when authenticated but session and client not initialised', async () => {
    const mockRequest = {
        body: {},
    } as Request
    mockRequest.isUnauthenticated = () => false
    const mockResponse = {} as Response
    const mockRedirect = jest.fn()
    mockResponse.redirect = mockRedirect

    const next = jest.fn()
    await oidc.authenticate(mockRequest, mockResponse, next)
    expect(mockRedirect).toBeCalledWith(AUTH.ROUTE.LOGIN)
})

test('OIDC initialiseStrategy', async () => {
    const issuer = {}
    const spyGetOptions = jest.spyOn(oidc, 'getOpenIDOptions')
    const spyGetNewStrategy = jest
        .spyOn(oidc, 'createNewStrategy')
        .mockImplementation(() => Promise.resolve({} as Strategy<any, any>))
    const spyUseStrategy = jest.spyOn(oidc, 'useStrategy')

    const options = {
        authorizationURL: '',
        tokenURL: '',
        clientID: 'clientId',
        clientSecret: 'Clientsecret',
        discoveryEndpoint: 'someEndpoint',
        issuerURL: 'issuer_url',
        logoutURL: 'logouturl',
        callbackURL: 'redirect_uri',
        responseTypes: ['none'],
        scope: 'some scope',
        sessionKey: 'key',
        tokenEndpointAuthMethod: 'client_secret_basic',
        useRoutes: false,
    }

    await oidc.initialiseStrategy(options)
    expect(spyGetOptions).toBeCalled()
    expect(spyGetNewStrategy).toBeCalled()
    expect(spyUseStrategy).toBeCalled()
})

test('test createNewStrategy', async () => {
    /* eslint-disable @typescript-eslint/camelcase */
    const options = {
        redirect_uri: 'http://oauth/callback',
        tokenURL: '',
        client_id: 'clientId',
        clientSecret: 'Clientsecret',
        discovery_endpoint: 'someEndpoint',
        issuer_url: 'issuer_url',
        logout_url: 'logouturl',
        callbackURL: 'redirect_uri',
        responseTypes: ['none'],
        scope: 'some scope',
        sessionKey: 'key',
        tokenEndpointAuthMethod: 'client_secret_basic',
        useRoutes: false,
    }
    /* eslint-disable @typescript-eslint/camelcase */
    const spyDiscover = jest.spyOn(oidc, 'discover').mockImplementation(() => Promise.resolve({} as Issuer<any>))
    const spyGetClient = jest.spyOn(oidc, 'getClientFromIssuer').mockReturnValue({} as Client)
    const spyOnStrategy = jest.spyOn(oidc, 'getNewStrategy').mockReturnValue({} as Strategy<any, Client>)
    await oidc.createNewStrategy(options)

    expect(spyDiscover).toBeCalled()
    expect(spyGetClient).toBeCalled()
    expect(spyOnStrategy).toBeCalled()
})
