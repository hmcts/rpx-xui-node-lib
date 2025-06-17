import { Strategy } from './strategy.class'
import { Router, Request, Response, NextFunction } from 'express'
import { XuiLogger } from '../../common'

describe('Strategy CSRF Middleware', () => {
    let strategy: Strategy
    let mockRouter: Router
    let logger: XuiLogger

    // Dummy subclass for abstract Strategy
    class TestStrategy extends Strategy {
        constructor(router: Router, logger: XuiLogger) {
            super('test-strategy', router, logger)
        }
    }

    beforeEach(() => {
        mockRouter = Router()
        logger = {
            log: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
        } as unknown as XuiLogger
        strategy = new TestStrategy(mockRouter, logger)
    })

    function runMiddleware(req: Partial<Request>, res: Partial<Response>, next = jest.fn()) {
        // Find the CSRF middleware added to the router stack
        const layer = (strategy as any).router.stack.find(
            (l: any) => l.handle && l.handle.length === 3 && l.handle.toString().includes('CSRF')
        )
        if (!layer) throw new Error('CSRF middleware not found')
        return layer.handle(req as Request, res as Response, next)
    }

    test('should call next() for safe methods with existing token', () => {
        strategy.initialiseCSRF()
        const req = { method: 'GET', cookies: { 'XSRF-TOKEN': 'abc' } }
        const res = {}
        const next = jest.fn()
        runMiddleware(req, res, next)
        expect(next).toHaveBeenCalled()
    })

    test('should call next() for safe methods and set token if missing', () => {
        strategy.initialiseCSRF()
        const req = { method: 'GET', cookies: {} }
        const res = { cookie: jest.fn() }
        const next = jest.fn()
        runMiddleware(req, res, next)
        expect(next).toHaveBeenCalled()
        expect(res.cookie).toHaveBeenCalledWith(
            'XSRF-TOKEN',
            expect.any(String),
            expect.objectContaining({ sameSite: 'none', secure: true, httpOnly: false })
        )
    })

    test('should call next() for valid CSRF token on unsafe method', () => {
        strategy.initialiseCSRF()
        const req = {
            method: 'POST',
            cookies: { 'XSRF-TOKEN': 'abc' },
            headers: { 'x-xsrf-token': 'abc' }
        }
        const res = {}
        const next = jest.fn()
        runMiddleware(req, res, next)
        expect(next).toHaveBeenCalled()
    })

    test('should return 403 for missing CSRF token on unsafe method', () => {
        strategy.initialiseCSRF()
        const req = {
            method: 'POST',
            cookies: {},
            headers: {}
        }
        const send = jest.fn()
        const res = { status: jest.fn(() => ({ send })) }
        const next = jest.fn()
        runMiddleware(req, res as any, next)
        expect(res.status).toHaveBeenCalledWith(403)
        expect(send).toHaveBeenCalledWith('Invalid or missing CSRF token')
    })

    test('should return 403 for mismatched CSRF token on unsafe method', () => {
        strategy.initialiseCSRF()
        const req = {
            method: 'POST',
            cookies: { 'XSRF-TOKEN': 'abc' },
            headers: { 'x-xsrf-token': 'def' }
        }
        const send = jest.fn()
        const res = { status: jest.fn(() => ({ send })) }
        const next = jest.fn()
        runMiddleware(req, res as any, next)
        expect(res.status).toHaveBeenCalledWith(403)
        expect(send).toHaveBeenCalledWith('Invalid or missing CSRF token')
    })
})