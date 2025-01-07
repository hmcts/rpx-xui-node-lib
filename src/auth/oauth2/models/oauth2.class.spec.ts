import { oauth2, OAuth2 } from './oauth2.class'
import passport from 'passport'
import { createMock } from 'ts-auto-mock'
import { Request, Response, Router } from 'express'
import { AuthOptions } from '../../models'
import { XuiLogger } from '../../../common'
import { AUTH } from '../../auth.constants'

describe('OAUTH2 Auth', () => {
    const mockRequestRequired = {
        authorizationURL: '',
        tokenURL: '',
        clientID: '',
        clientSecret: '',
        callbackURL: '',
    }

    const options = {
        authorizationURL: 'someAuthorizationURL',
        tokenURL: '1234',
        clientID: 'clientID12',
        clientSecret: 'secret123',
        discoveryEndpoint: 'http://localhost:/someEndpoint',
        issuerURL: 'issuer_url',
        logoutURL: 'http://testUrl',
        callbackURL: 'http://localhost/callback',
        responseTypes: ['none'],
        scope: 'some scope',
        sessionKey: 'key',
        tokenEndpointAuthMethod: 'client_secret_basic',
        useRoutes: true,
        routeCredential: {
            userName: 'username@email.com',
            password: 'password123',
            routes: ['route1'],
            scope: 'scope1 scope2',
        },
    }

    test('it should be defined', () => {
        expect(oauth2).toBeDefined()
    })

    test('initialiseStrategy', () => {
        const options = {
            authorizationURL: 'http://localhost/someauthurl',
            tokenURL: 'sometokenUrl',
            clientID: 'client',
            clientSecret: 'secret',
            callbackURL: 'callbackUrl',
            scope: 'scope',
            sessionKey: 'node-lib',
            useRoutes: false,
            logoutURL: 'logoutUrl',
            discoveryEndpoint: 'http://localhost/someEndpoint',
            issuerURL: 'string',
            responseTypes: [''],
            tokenEndpointAuthMethod: 'string',
        }
        oauth2.initialiseStrategy(options)
        expect(oauth2.isInitialised()).toBeTruthy()
    })
    test('it should be configurable', () => {
        const options = {
            authorizationURL: 'http://localhost/someauthurl',
            tokenURL: 'sometokenUrl',
            clientID: 'client',
            clientSecret: 'secret',
            callbackURL: 'callbackUrl',
            scope: 'scope',
            sessionKey: 'node-lib',
            useRoutes: false,
            logoutURL: 'logoutUrl',
            discoveryEndpoint: 'http://localhost/someEndpoint',
            issuerURL: 'string',
            responseTypes: [''],
            tokenEndpointAuthMethod: 'string',
        }
        const handler = oauth2.configure(options)
        expect(handler).toBeTruthy()
    })

    test('loginHandler with session and sessionKey', async () => {
        const mockRouter = createMock<Router>()
        const options = createMock<AuthOptions>()
        const logger = {
            log: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
        } as unknown as XuiLogger
        options.sessionKey = 'test'
        options.discoveryEndpoint = 'http://localhost/someEndpoint'
        options.authorizationURL = 'http://localhost/someAuthorizationURL'
        options.tokenURL = 'http://localhost/someTokenURL'
        options.clientID = 'clientID1234'
        const spy = jest.spyOn(passport, 'authenticate').mockImplementation(() => () => true)
        const oAuth2 = new OAuth2(mockRouter, logger)
        jest.spyOn(oAuth2, 'validateOptions')
        jest.spyOn(oAuth2, 'serializeUser')
        jest.spyOn(oAuth2, 'deserializeUser')
        jest.spyOn(oAuth2, 'initializePassport')
        jest.spyOn(oAuth2, 'initializeSession')
        jest.spyOn(oAuth2, 'initialiseStrategy')
        options.useRoutes = true
        jest.spyOn(oAuth2, 'validateOptions').mockReturnValue(true)
        jest.spyOn(oAuth2, 'initialiseCSRF')
        oAuth2.configure(options)

        const mockRequest = {
            ...mockRequestRequired,
            body: {},
            session: {
                save: (callback: any): void => callback(),
            },
        } as unknown as Request
        const mockResponse = {} as Response
        const next = jest.fn()

        await oAuth2.loginHandler(mockRequest, mockResponse, next)
        expect(spy).toHaveBeenCalled()
    })

    test('loginHandler with session and no sessionKey', async () => {
        const mockRouter = createMock<Router>()
        const options = createMock<AuthOptions>()
        options.sessionKey = 'test'
        options.discoveryEndpoint = 'http://localhost/someEndpoint'
        options.authorizationURL = 'http://localhost/someAuthorizationURL'
        options.tokenURL = 'http://localhost/someTokenURL'
        options.clientID = 'clientID1234'
        options.callbackURL = 'http://localhost/callback'
        options.clientSecret = 'secret123'
        options.issuerURL = 'http://localhost/someEndpoint'
        options.logoutURL = 'http://localhost/testUrl'
        options.tokenEndpointAuthMethod = 'string'
        options.scope = 'periscope'
        const logger = {
            log: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
        } as unknown as XuiLogger
        const spy = jest.spyOn(passport, 'authenticate').mockImplementation(() => () => true)
        const oAuth2 = new OAuth2(mockRouter, logger)
        jest.spyOn(oAuth2, 'validateOptions')
        jest.spyOn(oAuth2, 'serializeUser')
        jest.spyOn(oAuth2, 'deserializeUser')
        jest.spyOn(oAuth2, 'initializePassport')
        jest.spyOn(oAuth2, 'initializeSession')
        jest.spyOn(oAuth2, 'initialiseStrategy')
        oAuth2.configure(options)

        const mockRequest = {
            ...mockRequestRequired,
            body: {},
            session: {
                save: (callback: any): void => callback(),
            },
        } as unknown as Request
        const mockResponse = {} as Response
        const next = jest.fn()

        await oAuth2.loginHandler(mockRequest, mockResponse, next)
        expect(spy).toHaveBeenCalled()
    })

    test('setCallbackURL', () => {
        const mockRequest = {
            ...mockRequestRequired,
            body: {},
            session: {},
            app: {
                set: jest.fn(),
            },
            protocol: 'http',
            get: jest.fn().mockImplementation(() => 'localhost'),
        } as unknown as Request
        const mockResponse = {} as Response
        const next = jest.fn()
        oauth2.setCallbackURL(mockRequest, mockResponse, next)
        expect(mockRequest.app.set).toHaveBeenCalledWith('trust proxy', true)
        expect(mockRequest.get).toHaveBeenCalledWith('host')
        expect((mockRequest.session as any)?.callbackURL).toEqual('http://localhost/callbackUrl')
        expect(next).toHaveBeenCalled()
    })

    test('setHeaders should set auth headers', () => {
        const roles = ['test', 'test1']
        const authToken = 'Bearer abc123'
        const mockRequest = {
            ...mockRequestRequired,
            body: {},
            session: {
                passport: {
                    user: {
                        userinfo: {
                            roles,
                        },
                    },
                },
            },
            headers: {},
        } as unknown as Request
        const mockResponse = {} as Response
        const next = jest.fn()
        jest.spyOn(oauth2, 'makeAuthorization').mockImplementation(() => authToken)
        oauth2.setHeaders(mockRequest, mockResponse, next)
        expect(mockRequest.headers['user-roles']).toEqual(roles.join())
        expect(mockRequest.headers.Authorization).toEqual(authToken)
        expect(next).toHaveBeenCalled()
    })

    test('should handle INVALID_STATE_ERROR in info', () => {
        const info = { message: 'Invalid authorization request state.' }
        jest.spyOn(passport, 'authenticate').mockImplementation((strategy, options, callback) => {
            if (callback) {
                callback(null, null, info)
            }
            return jest.fn()
        })

        const mockRouter = createMock<Router>()
        const logger = {
            log: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
        } as unknown as XuiLogger
        const oAuth2 = new OAuth2(mockRouter, logger)
        const mockRequest = createMock<Request>()
        const mockResponse = createMock<Response>()
        const next = jest.fn()

        oAuth2.callbackHandler(mockRequest, mockResponse, next)

        expect(mockResponse.redirect).toHaveBeenCalledWith(AUTH.ROUTE.EXPIRED_LOGIN_LINK)
    })

    test('should handle MISMATCH_NONCE or MISMATCH_STATE in info', () => {
        const info = { message: 'nonce mismatch' }
        jest.spyOn(passport, 'authenticate').mockImplementation((strategy, options, callback) => {
            if (callback) {
                callback(null, null, info)
            }
            return jest.fn()
        })

        const mockRouter = createMock<Router>()
        const logger = {
            log: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
        } as unknown as XuiLogger
        const oAuth2 = new OAuth2(mockRouter, logger)
        const mockRequest = createMock<Request>()
        const mockResponse = createMock<Response>()
        const next = jest.fn()

        oAuth2.callbackHandler(mockRequest, mockResponse, next)

        expect(mockResponse.redirect).toHaveBeenCalledWith(AUTH.ROUTE.EXPIRED_LOGIN_LINK)
    })

    test('should handle no user returned', () => {
        const info = { message: 'Some other error' }
        jest.spyOn(passport, 'authenticate').mockImplementation((strategy, options, callback) => {
            if (callback) {
                callback(null, null, info)
            }
            return jest.fn()
        })

        const mockRouter = createMock<Router>()
        const logger = {
            log: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
        } as unknown as XuiLogger
        const oAuth2 = new OAuth2(mockRouter, logger)
        const mockRequest = createMock<Request>()
        const mockResponse = createMock<Response>()
        const next = jest.fn()

        oAuth2.callbackHandler(mockRequest, mockResponse, next)

        expect(logger.log).toHaveBeenCalledWith(
            'No user details returned by the authentication service, redirecting to login',
        )
        expect(mockResponse.redirect).toHaveBeenCalledWith(AUTH.ROUTE.LOGIN)
    })
})
