import { xuiNode, XuiNode } from './xuiNode.class'
import { Router, Request, Response } from 'express'
import { XuiNodeOptions } from './xuiNodeOptions.interface'
import { XuiNodeMiddlewareInterface } from './xuiNodeMiddleware.interface'
import { createMock } from '@golevelup/ts-jest';
import { createMockPassportRequest } from './test/passportRequest.mock'

jest.mock('../../auth', () => ({
    oidc: {},
    OIDC: {},
    oauth2: {},
    XUIOAuth2Strategy: {},
    OAUTH2: {},
    s2s: {},
    S2S: {},
}))

test('xuiNode isTruthy', () => {
    expect(xuiNode).toBeTruthy()
})

test('xuiNode configure waits for middleware setup in order before handling requests', async () => {
    const mockRouter = jest.fn() as unknown as Router
    const logger = createMock<typeof console>()
    const middlewares: Array<string> = ['session', 'auth']
    const xuinode = new XuiNode(mockRouter, middlewares, logger)
    const options = { authorizationURL: 'http://localhost/someauthurl' } as XuiNodeOptions
    const configured: string[] = []
    let releaseSession: () => void = () => {}
    let releaseAuth: () => void = () => {}
    const sessionReady = new Promise<void>((resolve) => { releaseSession = resolve })
    const authReady = new Promise<void>((resolve) => { releaseAuth = resolve })
    const spy = jest.spyOn(xuinode, 'applyMiddleware')
        .mockImplementation(async (middleware, middlewareOptions) => {
            configured.push(middleware)
            if (middleware === 'session') await sessionReady
            if (middleware === 'auth') await authReady
            expect(middlewareOptions).toBe(options)
        })
    const handler = xuinode.configure(options)
    const req = createMockPassportRequest(null)
    const resp = createMock<Response>()
    const next = jest.fn()
    handler(req, resp, next)

    await new Promise<void>((resolve) => setImmediate(resolve))
    expect(configured).toEqual(['session'])
    expect(mockRouter).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()

    releaseSession()
    await new Promise<void>((resolve) => setImmediate(resolve))
    expect(configured).toEqual(['session', 'auth'])
    expect(mockRouter).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()

    releaseAuth()
    await new Promise<void>((resolve) => setImmediate(resolve))
    expect(mockRouter).toHaveBeenCalledWith(req, resp, next)
    expect(spy).toHaveBeenCalledTimes(2)
})

test('xuiNode configure forwards an earlier setup failure without entering the router', async () => {
    const mockRouter = jest.fn() as unknown as Router
    const logger = createMock<typeof console>()
    const xuinode = new XuiNode(mockRouter, ['session', 'auth'], logger)
    const error = new Error('session setup failed')
    jest.spyOn(xuinode, 'applyMiddleware').mockRejectedValue(error)
    const handler = xuinode.configure({ session: {} } as XuiNodeOptions)
    const req = createMockPassportRequest(null)
    const resp = createMock<Response>()
    const next = jest.fn()
    await new Promise<void>((resolve) => setImmediate(resolve))
    handler(req, resp, next)
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(mockRouter).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith(error)
})

test('applyMiddlewareLayer() should call importMiddleware with the baseDir and middleware', () => {
    const xuiNodeOptions = { session1: 'someValue' }
    const middleware = 'session1'

    const spyOnImportMiddleware = jest.spyOn(xuiNode, 'importMiddleware').mockReturnValue(Promise.resolve({} as any))

    xuiNode.applyMiddleware(middleware, xuiNodeOptions)

    expect(spyOnImportMiddleware).toHaveBeenCalledWith(middleware)
})

test('importMiddleware should throw error', async () => {
    await xuiNode.importMiddleware('invalidMiddleware').catch((error) => {
        expect(error.message).toEqual('unknown middleware')
    })
})

test('importMiddleware should return auth', async () => {
    const auth = (await xuiNode.importMiddleware('auth')) as any
    expect(auth.oidc).toBeTruthy()
    expect(auth.OIDC).toBeTruthy()
    expect(auth.oauth2).toBeTruthy()
    expect(auth.XUIOAuth2Strategy).toBeTruthy()
    expect(auth.OAUTH2).toBeTruthy()
    expect(auth.s2s).toBeTruthy()
    expect(auth.S2S).toBeTruthy()
})

test('importMiddleware should return session', async () => {
    const session = (await xuiNode.importMiddleware('session')) as any
    expect(session.redisStore).toBeTruthy()
    expect(session.fileStore).toBeTruthy()
    expect(session.SESSION).toBeTruthy()
})

test('proxyEvents ', () => {
    const middleWare = createMock<XuiNodeMiddlewareInterface>()
    const spyOnMiddleware = jest.spyOn(middleWare, 'getEvents').mockReturnValue(['event1', 'event2'])
    const spyOnXuinode = jest.spyOn(xuiNode, 'listenerCount').mockReturnValue(0)
    xuiNode.proxyEvents(middleWare)
    expect(spyOnMiddleware).toHaveBeenCalledWith()
    expect(spyOnXuinode).toHaveBeenCalledWith('event1')
    expect(spyOnXuinode).toHaveBeenCalledWith('event2')
})

test('defaultAuthenticate, fake authenticated', () => {
    const mockRouter = {} as Router
    const logger = createMock<typeof console>()
    const middlewares: Array<string> = []
    const xuinode = new XuiNode(mockRouter, middlewares, logger)
    const options = { authorizationURL: 'http://localhost/someauthurl' } as XuiNodeOptions
    xuinode.configure(options)
    const req = createMockPassportRequest('user')
    const resp = createMock<Response>()
    resp.statusCode = 0
    const next = jest.fn()
    xuinode.authenticate(req, resp, next)
    expect(resp.statusCode).toEqual(0)
    expect(next).toHaveBeenCalledTimes(1)
})

test('defaultAuthenticate, unauthenticated', () => {
    const mockRouter = {} as Router
    const logger = createMock<typeof console>()
    const middlewares: Array<string> = []
    const xuinode = new XuiNode(mockRouter, middlewares, logger)
    const options = { authorizationURL: 'http://localhost/someauthurl' } as XuiNodeOptions
    xuinode.configure(options)
    const req = createMockPassportRequest(null)
    const resp = createMock<Response>()
    jest.spyOn(resp, 'status').mockReturnValue(resp)
    resp.statusCode = 0
    const next = jest.fn()

    xuinode.authenticate(req, resp, next)
    expect(resp.statusCode).toEqual(401)
    expect(resp.status).toHaveBeenCalledWith(401)
    expect(resp.send).toHaveBeenCalledWith({ message: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
})
