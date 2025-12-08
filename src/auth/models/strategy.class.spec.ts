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

describe('Strategy.setCallbackURL', () => {
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
      expect.stringContaining('callbackURL was missing/invalid — set to:')
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
