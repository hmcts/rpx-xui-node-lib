/* eslint-disable @typescript-eslint/no-empty-function */

import { oidc, OpenID } from './openid.class'
import passport from 'passport'
import { Request, response, Response, Router } from 'express'
import express from 'express'
import { AUTH } from '../../auth.constants'
import { Client, Issuer, Strategy, TokenSet, UserinfoResponse } from 'openid-client'
import { createMock } from 'ts-auto-mock'
import { OpenIDMetadata } from './OpenIDMetadata.interface'
import { VERIFY_ERROR_MESSAGE_NO_ACCESS_ROLES } from '../../messaging.constants'
import { http } from '../../../common'
import { AuthOptions } from '../../models'

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

test('OIDC loginHandler', async () => {
    const spy = jest.spyOn(passport, 'authenticate')
    const mockRequest = {
        body: {},
    } as Request
    const mockResponse = {} as Response
    const next = jest.fn()

    await oidc.loginHandler(mockRequest, mockResponse, next)
    expect(spy).toBeCalled()
})

test('OIDC loginHandler with session', async () => {
    const mockRouter = createMock<Router>()
    const options = createMock<AuthOptions>()
    options.sessionKey = 'test'
    const logger = createMock<typeof console>()
    const openId = new OpenID(mockRouter, logger)
    spyOn(openId, 'validateOptions')
    spyOn(openId, 'serializeUser')
    spyOn(openId, 'deserializeUser')
    spyOn(openId, 'initializePassport')
    spyOn(openId, 'initializeSession')
    spyOn(openId, 'initialiseStrategy')
    spyOn(openId, 'initialiseCSRF')
    options.useRoutes = true
    openId.configure(options)

    const spy = jest.spyOn(passport, 'authenticate')
    const mockRequest = ({
        body: {},
        session: {
            save: (callback: any): void => callback(),
        },
    } as unknown) as Request
    const mockResponse = {} as Response
    const next = jest.fn()

    await openId.loginHandler(mockRequest, mockResponse, next)
    expect(spy).toBeCalled()
})

test('OIDC jwTokenExpired', () => {
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
        callbackURL: 'http://localhost/callback',
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
        done({})
    }
    const mockResponse = {} as Response
    const next = jest.fn()
    const user = {
        userinfo: {
            roles: ['test', 'admin'],
        },
    }

    oidc.verifyLogin(mockRequest, user, next, mockResponse)
    expect(next).toBeCalledWith({})
})

test('OIDC verifyLogin happy Path with no subscription', () => {
    const mockRequest = {
        body: {},
    } as Request
    mockRequest.csrfToken = jest.fn()
    mockRequest.logIn = (user: any, done: (err: any) => void) => {
        done(undefined)
    }
    const mockResponse = {} as Response
    const mockRedirect = jest.fn()
    mockResponse.cookie = jest.fn()
    mockResponse.redirect = mockRedirect
    const next = jest.fn()
    const user = {
        userinfo: {
            roles: ['test', 'admin'],
        },
    }

    oidc.verifyLogin(mockRequest, user, next, mockResponse)
    expect(next).not.toBeCalledWith({})
    expect(mockRedirect).toBeCalledWith(AUTH.ROUTE.DEFAULT_REDIRECT)
})

test('OIDC verifyLogin happy Path with subscription', () => {
    const mockRequest = {
        body: {},
    } as Request
    mockRequest.csrfToken = jest.fn()
    mockRequest.logIn = (user: any, done: (err: any) => void) => {
        done(undefined)
    }
    const mockResponse = {} as Response
    mockResponse.cookie = jest.fn()
    mockResponse.redirect = jest.fn()
    const next = jest.fn()
    const user = {
        userinfo: {
            roles: ['test', 'admin'],
        },
    }

    oidc.addListener(AUTH.EVENT.AUTHENTICATE_SUCCESS, (req) => {
        expect(req.isRefresh).toBeFalsy()
    })
    oidc.verifyLogin(mockRequest, user, next, mockResponse)
    expect(next).not.toBeCalledWith({})
    oidc.removeAllListeners()
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

xtest('OIDC authenticate when authenticated but session and client not initialised', () => {
    const mockRequest = {
        body: {},
    } as Request
    mockRequest.isUnauthenticated = () => false
    const mockResponse = {} as Response
    const mockRedirect = jest.fn()
    mockResponse.redirect = mockRedirect

    const next = jest.fn()
    oidc.authenticate(mockRequest, mockResponse, next)
    expect(mockRedirect).toBeCalledWith(AUTH.ROUTE.LOGIN)
})

xtest('OIDC authenticate when authenticated but session and client initialised', async () => {
    const mockRequest = {
        body: {},
    } as Request
    mockRequest.isUnauthenticated = () => false
    const mockResponse = {} as Response
    const mockRedirect = jest.fn()
    mockResponse.redirect = mockRedirect

    const session = createMock<Express.Session>()
    session.passport = {
        user: {
            tokenset: {
                accessToken: 'token-access',
            },
            userinfo: {
                roles: ['role1', 'role2'],
            },
        },
    }
    mockRequest.session = session
    mockRequest.headers = {}
    const mockClient = createMock<Client>()
    const spyOnClient = jest.spyOn(oidc, 'getClient').mockReturnValue(mockClient)
    const spyOnisTokenExpired = jest.spyOn(oidc, 'isTokenExpired').mockReturnValue(false)
    const spyOnAuthorization = jest.spyOn(oidc, 'makeAuthorization').mockReturnValue('Auth')
    const next = jest.fn()
    await oidc.authenticate(mockRequest, mockResponse, next)
    // expect(mockRedirect).toBeCalledWith(AUTH.ROUTE.LOGIN)
    expect(spyOnClient).toBeCalled()
    expect(spyOnisTokenExpired).toBeCalled()
    expect(spyOnAuthorization).toBeCalled()
    expect(mockRequest.headers.Authorization).toEqual('Auth')
    expect(next).toHaveBeenCalled()
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

test('verify() Should return a no access roles messages if the User has no roles.', async () => {
    const tokenSet = createMock<TokenSet>()
    const userinfo = createMock<UserinfoResponse>()

    const doneFunction = jest.fn((err, user, message) => {})

    oidc.verify(tokenSet, userinfo, doneFunction)

    expect(doneFunction).toBeCalledWith(null, false, { message: VERIFY_ERROR_MESSAGE_NO_ACCESS_ROLES })
})

test('verify() Should return the user token set if a User has roles.', async () => {
    const tokenSet = createMock<TokenSet>()
    const userinfo = createMock<UserinfoResponse>()

    userinfo.roles = ['pui-case-manager']
    tokenSet.access_token = 'access_token'
    tokenSet.refresh_token = 'refresh_token'
    tokenSet.id_token = 'id_token'

    const userTokenSet = {
        accessToken: tokenSet.access_token,
        refreshToken: tokenSet.refresh_token,
        idToken: tokenSet.id_token,
    }

    const doneFunction = jest.fn((err, user, message) => {})

    oidc.verify(tokenSet, userinfo, doneFunction)

    expect(doneFunction).toBeCalledWith(null, { tokenset: userTokenSet, userinfo })
})

test('Should return an object from getClientFromIssuer()', async () => {
    const issuer = createMock<Issuer<Client>>()
    const options = createMock<OpenIDMetadata>()

    expect(oidc.getClientFromIssuer(issuer, options)).toBeDefined()
})

test('makeAuthorization() Should make an authorisation string', async () => {
    const passport = {
        user: {
            tokenset: {
                accessToken: 'accessToken',
            },
        },
    }

    const expectedAuthorisation = `Bearer ${passport.user.tokenset.accessToken}`

    expect(oidc.makeAuthorization(passport)).toEqual(expectedAuthorisation)
})

test('strategy logout', async () => {
    const session = createMock<Express.Session>()
    const mockRequest = createMock<Request>()
    session.passport = {
        user: {
            tokenset: {
                accessToken: 'access t',
                refreshToken: 'refresh34',
            },
        },
    }
    mockRequest.session = session
    const mockResponse = {} as Response
    mockResponse.redirect = jest.fn()
    const spyhttp = jest.spyOn(http, 'delete').mockImplementation(() => Promise.resolve({} as any))
    const spySessionDestroy = jest.spyOn(oidc, 'destroySession').mockImplementation(() => Promise.resolve({} as any))
    await oidc.logout(mockRequest, mockResponse)
    expect(spyhttp).toHaveBeenCalled()
    expect(spySessionDestroy).toHaveBeenCalled()
})

test('urlFromToken ', () => {
    const url = oidc.urlFromToken('http://localhost', 'token1')
    expect(url).toEqual('http://localhost/session/token1')
})

test('getAuthorization', () => {
    let auth = oidc.getAuthorization('clientID', 'secret', 'base64')
    let buffer = Buffer.from('clientID:secret').toString('base64')
    expect(auth).toEqual(`Basic ${buffer}`)

    auth = oidc.getAuthorization('clientID', 'secret')
    buffer = Buffer.from('clientID:secret').toString('base64')
    expect(auth).toEqual(`Basic ${buffer}`)
})

test('getEvents ', () => {
    const events = oidc.getEvents()
    expect(events).toEqual([
        'auth.authenticate.success',
        'auth.serializeUser',
        'auth.deserializeUser',
        'auth.authenticate.failure',
    ])
})

test('emitIfListenersExist with no listeners', () => {
    const done = jest.fn()
    const spy = jest.spyOn(oidc, 'listenerCount').mockReturnValue(0)
    oidc.emitIfListenersExist('eventName', 'id', done)
    expect(done).toBeCalledWith(null, 'id')
})

test('emitIfListenersExist with listeners', () => {
    const spy = jest.spyOn(oidc, 'listenerCount').mockReturnValue(1)
    const spyEmit = jest.spyOn(oidc, 'emit')
    const done = jest.fn()
    oidc.emitIfListenersExist('eventName', 'id', done)
    expect(spyEmit).toBeCalledWith('eventName', 'id', done)
})

test('configure with useRoutes', () => {
    const mockRouter = createMock<Router>()
    const options = createMock<AuthOptions>()
    const logger = createMock<typeof console>()
    const openId = new OpenID(mockRouter, logger)
    const spyOnValidateOptions = spyOn(openId, 'validateOptions')
    const spyOnSer = spyOn(openId, 'serializeUser')
    const spyOnDeSer = spyOn(openId, 'deserializeUser')
    const spyOnPass = spyOn(openId, 'initializePassport')
    const spyOnSes = spyOn(openId, 'initializeSession')
    spyOn(openId, 'initialiseStrategy')
    options.useRoutes = true
    openId.configure(options)
    expect(spyOnValidateOptions).toBeCalled()
    expect(spyOnSer).toBeCalled()
    expect(spyOnDeSer).toBeCalled()
    expect(spyOnPass).toBeCalled()
    expect(spyOnSes).toBeCalled()
    expect(mockRouter.get).toBeCalledTimes(5)
})

test('configure without useRoutes', () => {
    const mockRouter = createMock<Router>()
    const options = createMock<AuthOptions>()
    const logger = createMock<typeof console>()
    const openId = new OpenID(mockRouter, logger)
    const spyOnValidateOptions = spyOn(openId, 'validateOptions')
    const spyOnSer = spyOn(openId, 'serializeUser')
    const spyOnDeSer = spyOn(openId, 'deserializeUser')
    const spyOnPass = spyOn(openId, 'initializePassport')
    const spyOnSes = spyOn(openId, 'initializeSession')
    spyOn(openId, 'initialiseStrategy')

    options.useRoutes = false
    openId.configure(options)
    expect(spyOnValidateOptions).toBeCalled()
    expect(spyOnSer).toBeCalled()
    expect(spyOnDeSer).toBeCalled()
    expect(spyOnPass).toBeCalled()
    expect(spyOnSes).toBeCalled()
    expect(mockRouter.get).not.toBeCalled()
})

test('getClient', () => {
    const client = oidc.getClient()
    expect(client).toBeTruthy()
})

test('keepAliveHandler no session', async () => {
    const mockRequest = {
        body: {},
    } as Request
    const mockResponse = {} as Response
    const next = jest.fn()
    await oidc.keepAliveHandler(mockRequest, mockResponse, next)
    expect(next).toBeCalled()
})

test('keepAliveHandler session but not authenticated', async () => {
    const mockRequest = {
        body: {},
    } as Request
    const mockResponse = {} as Response
    const next = jest.fn()
    const session = createMock<Express.Session>()
    session.passport = {
        user: {
            tokenset: {
                accessToken: 'token-access',
            },
            userinfo: {
                roles: ['role1', 'role2'],
            },
        },
    }
    mockRequest.session = session
    const isAuth = jest.fn()
    isAuth.mockReturnValue(false)
    mockRequest.isAuthenticated = isAuth

    await oidc.keepAliveHandler(mockRequest, mockResponse, next)
    expect(next).toBeCalled()
})

test('keepAliveHandler session and isAuthenticated', async () => {
    oidc.addListener(AUTH.EVENT.AUTHENTICATE_SUCCESS, (req) => {
        expect(req.isRefresh).toBeFalsy()
    })
    const mockRequest = {
        body: {},
    } as Request
    const mockResponse = {} as Response
    const next = jest.fn()
    const session = createMock<Express.Session>()
    session.passport = {
        user: {
            tokenset: {
                accessToken: 'token-access',
            },
            userinfo: {
                roles: ['role1', 'role2'],
            },
        },
    }
    mockRequest.session = session
    const isAuth = jest.fn()
    isAuth.mockReturnValue(true)
    mockRequest.isAuthenticated = isAuth
    const spyOnClient = jest.spyOn(oidc, 'getClient')
    const client = createMock<Client>()
    spyOnClient.mockReturnValue(client)

    const tokenSet = createMock<TokenSet>()
    const spyOnRefresh = jest.fn().mockReturnValue(tokenSet)
    client.refresh = spyOnRefresh
    const spyConvertTokenSet = jest.spyOn(oidc, 'convertTokenSet')
    const convertedTokenSet = createMock<TokenSet>()
    spyConvertTokenSet.mockReturnValue(convertedTokenSet)

    const spyOnIsTokenExpired = jest.spyOn(oidc, 'isTokenExpired')
    spyOnIsTokenExpired.mockReturnValue(true)

    const spyAuthSuccEmit = jest.spyOn(oidc, 'emit').mockReturnValue(false)

    await oidc.keepAliveHandler(mockRequest, mockResponse, next)
    expect(spyOnClient).toBeCalledTimes(2)
    expect(spyOnRefresh).toBeCalled()
    expect(spyConvertTokenSet).toBeCalled()
    expect(mockRequest.session.passport.user.tokenset).toEqual(convertedTokenSet)
    expect(spyAuthSuccEmit).toHaveBeenCalledWith(AUTH.EVENT.AUTHENTICATE_SUCCESS, mockRequest, mockResponse, next)
    oidc.removeAllListeners()
})

test('getUrlFromOptions', () => {
    const mockRouter = createMock<Router>()
    const options = {
        authorizationURL: 'someAuthorizationURL',
        tokenURL: '1234',
        clientID: 'clientID12',
        clientSecret: 'secret123',
        discoveryEndpoint: 'someEndpoint',
        issuerURL: 'issuer_url',
        logoutURL: 'http://testUrl',
        callbackURL: 'http://localhost/callback',
        responseTypes: ['none'],
        scope: 'some scope',
        sessionKey: 'key',
        tokenEndpointAuthMethod: 'client_secret_basic',
        useRoutes: false,
        routeCredential: {
            userName: 'username@email.com',
            password: 'password123',
            routes: ['route1'],
            scope: 'scope1 scope2',
        },
    }
    const logger = createMock<typeof console>()
    const openId = new OpenID(mockRouter, logger)
    const url = openId.getUrlFromOptions(options)
    expect(url).toEqual('http://testUrl/o/token')
})

test('getRequestBody', () => {
    const mockRouter = createMock<Router>()
    const options = {
        authorizationURL: 'someAuthorizationURL',
        tokenURL: '1234',
        clientID: 'clientID12',
        clientSecret: 'secret123',
        discoveryEndpoint: 'someEndpoint',
        issuerURL: 'issuer_url',
        logoutURL: 'http://testUrl',
        callbackURL: 'http://localhost/callback',
        responseTypes: ['none'],
        scope: 'some scope',
        sessionKey: 'key',
        tokenEndpointAuthMethod: 'client_secret_basic',
        useRoutes: false,
        routeCredential: {
            userName: 'username@email.com',
            password: 'password123',
            routes: ['route1'],
            scope: 'scope1 scope2',
        },
    }
    const logger = createMock<typeof console>()
    const openId = new OpenID(mockRouter, logger)
    const reqBody = openId.getRequestBody(options)
    expect(reqBody).toEqual(
        'grant_type=password&password=password123&username=username@email.com&scope=scope1 scope2&client_id=clientID12&client_secret=secret123',
    )
})

test('getUrlFromOptions without routeCredential', () => {
    const mockRouter = createMock<Router>()
    const logger = createMock<typeof console>()
    const openId = new OpenID(mockRouter, logger)

    expect(() => openId.getUrlFromOptions({} as AuthOptions)).toThrowError('missing routeCredential in options')
})

test('getRequestBody without routeCredential', () => {
    const mockRouter = createMock<Router>()
    const logger = createMock<typeof console>()
    const openId = new OpenID(mockRouter, logger)

    expect(() => openId.getRequestBody({} as AuthOptions)).toThrowError('options.routeCredential missing values')
})

test('generateToken', async () => {
    const spyOnGetUrlFromOptions = jest.spyOn(oidc, 'getUrlFromOptions')
    const spyOnGetRequestBody = jest.spyOn(oidc, 'getRequestBody')
    spyOnGetUrlFromOptions.mockReturnValue('someUrl')
    spyOnGetRequestBody.mockReturnValue('somebody')
    const spyHttp = jest.spyOn(http, 'post').mockImplementation(async () => await Promise.resolve({} as any))
    oidc.generateToken()
    expect(spyOnGetUrlFromOptions).toBeCalled()
    const axiosConfig = {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
    }
    expect(spyHttp).toBeCalledWith('someUrl', 'somebody', axiosConfig)
})

test('setHeaders should use currently signed in user when no routeCredentialToken', () => {
    const mockRouter = createMock<Router>()
    const options = {
        authorizationURL: 'someAuthorizationURL',
        tokenURL: '1234',
        clientID: 'clientID12',
        clientSecret: 'secret123',
        discoveryEndpoint: 'someEndpoint',
        issuerURL: 'issuer_url',
        logoutURL: 'http://testUrl',
        callbackURL: 'http://localhost/callback',
        responseTypes: ['none'],
        scope: 'some scope',
        sessionKey: 'key',
        tokenEndpointAuthMethod: 'client_secret_basic',
        useRoutes: false,
        routeCredential: undefined,
    }
    const logger = createMock<typeof console>()
    const openId = new OpenID(mockRouter, logger)
    const request = createMock<Request>()
    const next = jest.fn()
    const session = createMock<Express.Session>()
    session.passport = {
        user: {
            tokenset: {
                accessToken: 'token-access',
            },
            userinfo: {
                roles: ['role1', 'role2'],
            },
        },
    }
    request.session = session
    openId.setHeaders(request, response, next)

    expect(request.headers['user-roles']).toEqual('role1,role2')
    expect(request.headers.Authorization).toEqual('Bearer token-access')
})

test('setCredentialToken not cached', async () => {
    const request = createMock<Request>()
    const spyOnGenerateToken = jest.spyOn(oidc, 'generateToken')
    const spyOnIsTokenExpired = jest.spyOn(oidc, 'isTokenExpired')
    spyOnIsTokenExpired.mockReturnValue(true)
    spyOnGenerateToken.mockReturnValue(Promise.resolve({ access_token: 'access_token' }))
    await oidc.setCredentialToken(request)
    expect(request.headers.Authorization).toEqual('Bearer access_token')
})

test('setCredentialToken cached', async () => {
    const request = createMock<Request>()
    const spyOnIsTokenExpired = jest.spyOn(oidc, 'isTokenExpired')
    spyOnIsTokenExpired.mockReturnValue(false)
    const app = express()
    app.set('routeCredentialToken', { access_token: 'access_token' })
    request.app = app
    await oidc.setCredentialToken(request)
    expect(spyOnIsTokenExpired).toBeCalled()
    expect(request.headers.Authorization).toEqual('Bearer access_token')
})

test('isRouteCredentialNeeded true', () => {
    const options = {
        authorizationURL: 'someAuthorizationURL',
        tokenURL: '1234',
        clientID: 'clientID12',
        clientSecret: 'secret123',
        discoveryEndpoint: 'someEndpoint',
        issuerURL: 'issuer_url',
        logoutURL: 'http://testUrl',
        callbackURL: 'http://localhost/callback',
        responseTypes: ['none'],
        scope: 'some scope',
        sessionKey: 'key',
        tokenEndpointAuthMethod: 'client_secret_basic',
        useRoutes: false,
        routeCredential: {
            userName: 'username@email.com',
            password: 'password123',
            routes: ['route1'],
            scope: 'scope1 scope2',
        },
    }
    const isRouteCredentialsNeeded = oidc.isRouteCredentialNeeded('route1', options)
    expect(isRouteCredentialsNeeded).toBeTruthy()
})

test('isRouteCredentialNeeded false', () => {
    const options = {
        authorizationURL: 'someAuthorizationURL',
        tokenURL: '1234',
        clientID: 'clientID12',
        clientSecret: 'secret123',
        discoveryEndpoint: 'someEndpoint',
        issuerURL: 'issuer_url',
        logoutURL: 'http://testUrl',
        callbackURL: 'http://localhost/callback',
        responseTypes: ['none'],
        scope: 'some scope',
        sessionKey: 'key',
        tokenEndpointAuthMethod: 'client_secret_basic',
        useRoutes: false,
        routeCredential: {
            userName: 'username@email.com',
            password: 'password123',
            routes: ['route2'],
            scope: 'scope1 scope2',
        },
    }
    const isRouteCredentialsNeeded = oidc.isRouteCredentialNeeded('route1', options)
    expect(isRouteCredentialsNeeded).toBeFalsy()
})
