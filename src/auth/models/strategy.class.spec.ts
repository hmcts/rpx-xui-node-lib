import express, { Router } from 'express'
import session from 'express-session'
import { Passport } from 'passport'
import { Server } from 'http'
import { AddressInfo } from 'net'
import { AUTH } from '../auth.constants'
import { XuiLogger } from '../../common'
import { Strategy } from './strategy.class'

class TestStrategy extends Strategy {
    constructor(logger: XuiLogger) {
        super('test', Router({ mergeParams: true }), logger)
    }
}

const getMockLogger = (): XuiLogger => {
    return {
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    }
}

test('initialiseStrategy should not log authentication secrets', async () => {
    const logger = getMockLogger()
    const strategy = new TestStrategy(logger)
    const options = {
        clientID: 'client-id',
        clientSecret: 'very-secret',
        routeCredential: {
            userName: 'user@xui',
            password: 'super-secret-password',
        },
    }

    await strategy.initialiseStrategy(options)

    expect(logger.log).toHaveBeenCalledTimes(2)
    const loggedOptions = (logger.log as jest.Mock).mock.calls[1][0]
    expect(loggedOptions).toContain('[REDACTED]')
    expect(loggedOptions).not.toContain('very-secret')
    expect(loggedOptions).not.toContain('super-secret-password')
})

test('redactingLogReplacer should redact nested sensitive keys and retain non-sensitive values', () => {
    const logger = getMockLogger()
    const strategy = new TestStrategy(logger)
    const options = {
        clientSecret: 'very-secret',
        tokenURL: 'http://idam/token',
        nested: {
            client_secret: 'another-secret',
            refreshToken: 'refresh-token-value',
            list: [{ serviceAuthorization: 's2s-token' }],
        },
    }

    const serialized = JSON.stringify(options, (strategy as any).redactingLogReplacer)

    expect(serialized).toContain('"clientSecret":"[REDACTED]"')
    expect(serialized).toContain('"client_secret":"[REDACTED]"')
    expect(serialized).toContain('"refreshToken":"[REDACTED]"')
    expect(serialized).toContain('"serviceAuthorization":"[REDACTED]"')
    expect(serialized).toContain('"tokenURL":"[REDACTED]"')
})

test('getSSOLogoutUrl should include required end session parameters using the id token', async () => {
    const logger = getMockLogger()
    const strategy = new TestStrategy(logger)
    await strategy.initialiseStrategy({
        ssoLogoutURL: 'http://idam.test/o/endSession',
    })

    const ssoLogoutUrl = strategy.getSSOLogoutUrl('http://service.test', 'id-token-value') as string
    const parsedUrl = new URL(ssoLogoutUrl)

    expect(`${parsedUrl.origin}${parsedUrl.pathname}`).toEqual('http://idam.test/o/endSession')
    expect(parsedUrl.searchParams.get('post_logout_redirect_uri')).toEqual('http://service.test')
    expect(parsedUrl.searchParams.get('id_token_hint')).toEqual('id-token-value')
    expect(parsedUrl.searchParams.get('id_token_hint')).not.toEqual('access-token-value')
})

test('getSSOLogoutUrl should not build an end session URL without an id token', async () => {
    const logger = getMockLogger()
    const strategy = new TestStrategy(logger)
    await strategy.initialiseStrategy({
        ssoLogoutURL: 'http://idam.test/o/endSession',
    })

    expect(strategy.getSSOLogoutUrl('http://service.test')).toBeUndefined()
})

describe('login session fixation protection', () => {
    let server: Server
    let baseUrl: string
    let store: session.MemoryStore

    beforeEach(async () => {
        const app = express()
        const passport = new Passport()
        const strategy = new TestStrategy(getMockLogger())
        const user = { userinfo: { uid: 'test-user', roles: ['caseworker'] } }
        store = new session.MemoryStore()

        passport.serializeUser((authenticatedUser, done) => done(null, authenticatedUser))
        passport.deserializeUser((authenticatedUser: Express.User, done) => done(null, authenticatedUser))
        app.use(session({ secret: 'session-fixation-regression-test', resave: false, saveUninitialized: false, store }))
        app.use(passport.initialize())
        app.use(passport.session())
        app.get('/anonymous', (req, res) => {
            Object.assign(req.session, { anonymousMarker: 'untrusted-session-data' })
            res.json({ sessionID: req.sessionID })
        })
        strategy.on(AUTH.EVENT.AUTHENTICATE_SUCCESS, (req, res) => {
            res.json({ sessionID: req.sessionID, anonymousMarker: req.session.anonymousMarker })
        })
        app.get('/login', (req, res, next) => strategy.verifyLogin(req, user, next, res))
        app.get('/private', (req, res) => {
            res.sendStatus(req.isAuthenticated() ? 200 : 401)
        })

        await new Promise<void>((resolve, reject) => {
            server = app.listen(0, '127.0.0.1', (error?: Error) => error ? reject(error) : resolve())
        })
        baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    afterEach(async () => {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve())
            server.closeAllConnections()
        })
    })

    test.each([false, true])('rotates the session and rejects the old cookie on login (reauthentication: %s)', async (reauthenticate) => {
        const anonymousResponse = await fetch(`${baseUrl}/anonymous`)
        let previousSession = await anonymousResponse.json() as { sessionID: string }
        let previousCookie = anonymousResponse.headers.get('set-cookie')!.split(';')[0]

        if (reauthenticate) {
            const firstLogin = await fetch(`${baseUrl}/login`, { headers: { cookie: previousCookie } })
            expect(firstLogin.status).toBe(200)
            previousSession = await firstLogin.json() as { sessionID: string }
            previousCookie = firstLogin.headers.get('set-cookie')!.split(';')[0]
            const authenticatedResponse = await fetch(`${baseUrl}/private`, { headers: { cookie: previousCookie } })
            expect(authenticatedResponse.status).toBe(200)
        }

        const loginResponse = await fetch(`${baseUrl}/login`, { headers: { cookie: previousCookie } })
        expect(loginResponse.status).toBe(200)
        const authenticatedSession = await loginResponse.json() as { sessionID: string, anonymousMarker?: string }
        const authenticatedCookie = loginResponse.headers.get('set-cookie')!.split(';')[0]

        expect(authenticatedSession.sessionID).not.toBe(previousSession.sessionID)
        expect(authenticatedCookie).not.toBe(previousCookie)
        expect(authenticatedSession.anonymousMarker).toBeUndefined()
        const previousStoredSession = await new Promise<session.SessionData | null | undefined>((resolve, reject) => {
            store.get(previousSession.sessionID, (error, storedSession) => error ? reject(error) : resolve(storedSession))
        })
        expect(previousStoredSession).toBeFalsy()

        const replayResponse = await fetch(`${baseUrl}/private`, { headers: { cookie: previousCookie } })
        expect(replayResponse.status).toBe(401)
        const authenticatedResponse = await fetch(`${baseUrl}/private`, { headers: { cookie: authenticatedCookie } })
        expect(authenticatedResponse.status).toBe(200)
    })
})
