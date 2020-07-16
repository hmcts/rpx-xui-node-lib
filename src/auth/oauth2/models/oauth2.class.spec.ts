import { oauth2, OAuth2 } from './oauth2.class'
import passport from 'passport'
import { createMock } from 'ts-auto-mock'
import { Request, Response, Router } from 'express'
import { AuthOptions } from '../../models'

describe('OAUTH2 Auth', () => {
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
        const logger = createMock<typeof console>()
        options.sessionKey = 'test'
        const spy = jest.spyOn(passport, 'authenticate').mockImplementation(() => () => true)
        const oAuth2 = new OAuth2(mockRouter, logger)
        spyOn(oAuth2, 'validateOptions')
        spyOn(oAuth2, 'serializeUser')
        spyOn(oAuth2, 'deserializeUser')
        spyOn(oAuth2, 'initializePassport')
        spyOn(oAuth2, 'initializeSession')
        spyOn(oAuth2, 'initialiseStrategy')
        options.useRoutes = true
        oAuth2.configure(options)

        const mockRequest = ({
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
        const options = createMock<AuthOptions>()
        const logger = createMock<typeof console>()
        const spy = jest.spyOn(passport, 'authenticate').mockImplementation(() => () => true)
        const oAuth2 = new OAuth2(mockRouter, logger)
        spyOn(oAuth2, 'validateOptions')
        spyOn(oAuth2, 'serializeUser')
        spyOn(oAuth2, 'deserializeUser')
        spyOn(oAuth2, 'initializePassport')
        spyOn(oAuth2, 'initializeSession')
        spyOn(oAuth2, 'initialiseStrategy')
        options.useRoutes = true
        oAuth2.configure(options)

        const mockRequest = ({
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
