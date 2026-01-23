/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import express, { Request, Response, NextFunction, Router } from 'express'
import { Strategy } from './strategy.class'

// Minimal logger stub
const loggerStub = {
  log: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
} as any;

// Create a concrete subclass to instantiate the abstract Strategy
class TestStrategy extends Strategy {
  // Expose protected constructor
  constructor(router: Router) {
    super('test-strategy', router, loggerStub)
  }
}

describe('Strategy.saveStateInSession', () => {
  let router: Router
  let strategy: TestStrategy

  beforeEach(() => {
    jest.clearAllMocks()
    router = express.Router()
    strategy = new TestStrategy(router)
    ;(strategy as any).options = {
      sessionKey: 'idam',
    }
  })

  const makeReq = (overrides: Partial<Request> = {}): Request => {
    const session: any = {
      save: (cb?: (err?: any) => void) => cb && cb(),
    }
    return {
      protocol: 'https',
      get: (h: string) => (h === 'host' ? 'example.com' : ''),
      originalUrl: '/auth/login',
      app: { set: jest.fn(), get: jest.fn() },
      session,
      ...overrides,
    } as unknown as Request
  }

  test('generates a new state when none provided and saves it under sessionKey', async () => {
    const req = makeReq()
    const reqSession = req.session as any

    const { promise, state } = (strategy as any).saveStateInSession(reqSession, undefined)

    expect(typeof state).toBe('string')
    await expect(promise).resolves.toBe(true)

    expect(reqSession.idam).toBeDefined()
    expect(reqSession.idam.state).toBe(state)
    expect(loggerStub.log).toHaveBeenCalledWith(expect.stringMatching(/saving state .* in session/))
    expect(loggerStub.log).toHaveBeenCalledWith(expect.stringMatching(/state .* saved in session/))
  })

  test('uses provided state and saves it', async () => {
    const req = makeReq()
    const reqSession = req.session as any
    const providedState = 'provided-state-123'

    const { promise, state } = (strategy as any).saveStateInSession(reqSession, providedState)

    expect(state).toBe(providedState)
    await expect(promise).resolves.toBe(true)
    expect(reqSession.idam.state).toBe(providedState)
  })

  test('does not save when sessionKey is missing and resolves false', async () => {
    (strategy as any).options.sessionKey = '' // simulate missing
    const req = makeReq()
    const reqSession = req.session as any

    const { promise, state } = (strategy as any).saveStateInSession(reqSession, undefined)

    expect(typeof state).toBe('string')
    await expect(promise).resolves.toBe(false)
    expect(reqSession.idam).toBeUndefined()
    expect(loggerStub.log).toHaveBeenCalledWith('sessionKey not available state not saved')
  })
})

describe('Strategy.setCallbackURL ', () => {
  let router: Router
  let strategy: TestStrategy

  beforeEach(() => {
    jest.clearAllMocks()
    router = express.Router()
    strategy = new TestStrategy(router)
    // Default options
    ;(strategy as any).options = {
      callbackURL: '/oauth2/callback',
      sessionKey: 'idam',
    }
  })

  function mockReq(overrides: Partial<Request> = {}): Request {
    const session: any = {
      save: (fn: Function) => fn(),
    }
    const req = {
      protocol: 'https',
      get: (h: string) => (h === 'host' ? 'example.com' : ''),
      originalUrl: '/auth/login',
      app: { set: jest.fn() },
      session,
      ...overrides,
    } as unknown as Request
    return req
  }

  test('sets session.callbackURL when missing/invalid, using options.callbackURL', () => {
    const req = mockReq({ session: { callbackURL: '', save: (fn: Function) => fn() } as any })
    const res = {} as Response
    const next = jest.fn() as NextFunction

    strategy.setCallbackURL(req, res, next)

    expect(req.app.set).toHaveBeenCalledWith('trust proxy', true)
    expect((req.session as any).callbackURL).toBe('https://example.com/oauth2/callback')
    expect(loggerStub.log).toHaveBeenCalledWith(
      expect.stringContaining('setCallbackURL, options.callbackurl:')
    )
    expect(next).toHaveBeenCalled()
  })

  test('does not change session.callbackURL when it is already a non-empty string', () => {
    const req = mockReq({
      session: { callbackURL: 'https://example.com/already-set', save: (fn: Function) => fn() } as any,
    })
    const res = {} as Response
    const next = jest.fn() as NextFunction

    strategy.setCallbackURL(req, res, next)

    expect(req.app.set).not.toHaveBeenCalled()
    expect((req.session as any).callbackURL).toBe('https://example.com/already-set')
    expect(next).toHaveBeenCalled()
  })

  test('falls back to req.originalUrl when options.callbackURL is missing/invalid', () => {
    (strategy as any).options.callbackURL = '' // invalid option
    const req = mockReq({ session: { callbackURL: undefined, save: (fn: Function) => fn() } as any })
    const res = {} as Response
    const next = jest.fn() as NextFunction

    strategy.setCallbackURL(req, res, next)

    expect(req.app.set).toHaveBeenCalledWith('trust proxy', true)
    expect((req.session as any).callbackURL).toBe('https://example.com/auth/login')
    expect(next).toHaveBeenCalled()
  })
})

describe('Strategy.validateOptions', () => {
  let router: Router
  let strategy: TestStrategy

  beforeEach(() => {
    jest.clearAllMocks()
    router = express.Router()
    strategy = new TestStrategy(router)
  })

  const validOptions = {
    authorizationURL: 'https://idam.example.com/oauth2/authorize',
    tokenURL: 'https://idam.example.com/oauth2/token',
    clientID: 'client-id',
    clientSecret: 'client-secret',
    callbackURL: '/oauth2/callback',
    logoutURL: 'https://idam.example.com',
    scope: 'openid profile roles',
    // optional fields
    discoveryEndpoint: 'https://idam.example.com/.well-known/openid-configuration',
    issuerURL: 'https://idam.example.com',
    useRoutes: true,
    responseTypes: ['code'],
    tokenEndpointAuthMethod: 'client_secret_basic',
    allowRolesRegex: '.*',
    useCSRF: true,
    serviceOverride: false,
     routeCredential: undefined,
    sessionKey: 'idam',
    ssoLogoutURL: 'https://idam.example.com/logout',
  }

  test('returns true for valid options', () => {
    expect(strategy.validateOptions(validOptions)).toBe(true)
  })

  test('throws when required fields are missing', () => {
    const invalid = {
      // missing authorizationURL, tokenURL, clientID, clientSecret, callbackURL, logoutURL, scope
    } as any

    expect(() => strategy.validateOptions(invalid)).toThrow()
  })

  test('throws when callbackURL is not a string', () => {
    const invalid = { ...validOptions, callbackURL: 123 as unknown as string }
    expect(() => strategy.validateOptions(invalid)).toThrow()
  })

  test('throws when scope is empty', () => {
    const invalid = { ...validOptions, scope: '' }
    expect(() => strategy.validateOptions(invalid)).toThrow()
  })
});
