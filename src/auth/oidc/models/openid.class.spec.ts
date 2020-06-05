import oidc from './openid.class'
import passport from 'passport'
import { Request, Response, NextFunction } from 'express'

test('OIDC Auth', () => {
    expect(oidc).toBeDefined()
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
    jest.mock('express', () => ({
        Router: () => ({
            use: jest.fn(),
        }),
    }))
    const spy = jest.spyOn(passport, 'initialize')
    oidc.initializePassport()
    expect(spy).toBeCalled()
})

test('OIDC configure initializeSession', () => {
    jest.mock('express', () => ({
        Router: () => ({
            use: jest.fn(),
        }),
    }))
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
    try {
        oidc.validateOptions(options)
    } catch (error) {
        expect(error.message).toContain('"authorizationURL" is not allowed to be empty')
    }

    //positive case
    options.authorizationURL = 'something'
    oidc.validateOptions(options)
})
