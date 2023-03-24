import { oauth2, OAuth2 } from './oauth2.class'
import passport from 'passport'
import { createMock } from 'ts-auto-mock'
import { Request, Response, Router } from 'express'
import { AuthOptions } from '../../models'
import { XuiLogger } from '../../../common'

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
        discoveryEndpoint: 'someEndpoint',
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

    test('it should be configurable', () => {
        const options = {
            authorizationURL: 'someauthurl',
            tokenURL: 'sometokenUrl',
            clientID: 'client',
            clientSecret: 'secret',
            callbackURL: 'callbackUrl',
            scope: 'scope',
            sessionKey: 'node-lib',
            useRoutes: false,
            logoutURL: 'logoutUrl',
            discoveryEndpoint: 'string',
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
        const logger = ({
            log: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
        } as unknown) as XuiLogger
        options.sessionKey = 'test'
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

        const mockRequest = ({
            ...mockRequestRequired,
            body: {},
            session: {
                save: (callback: any): void => callback(),
            },
        } as unknown) as Request
        const mockResponse = {} as Response
        const next = jest.fn()

        await oAuth2.loginHandler(mockRequest, mockResponse, next)
        expect(spy).toBeCalled()
    })

    test('loginHandler with session and no sessionKey', async () => {
        const mockRouter = createMock<Router>()
        const logger = ({
            log: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
        } as unknown) as XuiLogger
        const spy = jest.spyOn(passport, 'authenticate').mockImplementation(() => () => true)
        const oAuth2 = new OAuth2(mockRouter, logger)
        jest.spyOn(oAuth2, 'validateOptions')
        jest.spyOn(oAuth2, 'serializeUser')
        jest.spyOn(oAuth2, 'deserializeUser')
        jest.spyOn(oAuth2, 'initializePassport')
        jest.spyOn(oAuth2, 'initializeSession')
        jest.spyOn(oAuth2, 'initialiseStrategy')
        oAuth2.configure(options)

        const mockRequest = ({
            ...mockRequestRequired,
            body: {},
            session: {
                save: (callback: any): void => callback(),
            },
        } as unknown) as Request
        const mockResponse = {} as Response
        const next = jest.fn()

        await oAuth2.loginHandler(mockRequest, mockResponse, next)
        expect(spy).toBeCalled()
    })

    test('setCallbackURL', () => {
        const mockRequest = ({
            ...mockRequestRequired,
            body: {},
            session: {},
            app: {
                set: jest.fn(),
            },
            protocol: 'http',
            get: jest.fn().mockImplementation(() => 'localhost'),
        } as unknown) as Request
        const mockResponse = {} as Response
        const next = jest.fn()
        oauth2.setCallbackURL(mockRequest, mockResponse, next)
        expect(mockRequest.app.set).toBeCalledWith('trust proxy', true)
        expect(mockRequest.get).toBeCalledWith('host')
        expect(mockRequest.session?.callbackURL).toEqual('http://localhost/callbackUrl')
        expect(next).toBeCalled()
    })

    test('setHeaders should set auth headers', () => {
        const roles = ['test', 'test1']
        const authToken = 'Bearer abc123'
        const mockRequest = ({
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
        } as unknown) as Request
        const mockResponse = {} as Response
        const next = jest.fn()
        jest.spyOn(oauth2, 'makeAuthorization').mockImplementation(() => authToken)
        oauth2.setHeaders(mockRequest, mockResponse, next)
        expect(mockRequest.headers['user-roles']).toEqual(roles.join())
        expect(mockRequest.headers.Authorization).toEqual(authToken)
        expect(next).toBeCalled()
    })
})
