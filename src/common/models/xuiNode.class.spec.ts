import { xuiNode, XuiNode } from './xuiNode.class'
import { Router } from 'express'
import { XuiNodeOptions } from './xuiNodeOptions.interface'
import { XuiNodeMiddlewareInterface } from './xuiNodeMiddleware.interface'
import { createMock } from 'ts-auto-mock'

test('xuiNode isTruthy', () => {
    expect(xuiNode).toBeTruthy()
})

test('xuiNode configure', () => {
    const mockRouter = {} as Router
    const logger = createMock<typeof console>()
    const middlewares: Array<string> = ['session1', 'auth1']
    const xuinode = new XuiNode(mockRouter, middlewares, logger)
    const options = {} as XuiNodeOptions
    const spy = jest.spyOn(xuinode, 'applyMiddleware')
    xuinode.configure(options)
    expect(spy).toHaveBeenCalledWith('session1', options)
    expect(spy).toHaveBeenCalledWith('auth1', options)
})

test('applyMiddlewareLayer() should call importMiddleware with the baseDir and middleware', () => {
    const xuiNodeOptions = { session1: 'someValue' }
    const middleware = 'session1'

    const spyOnImportMiddleware = jest.spyOn(xuiNode, 'importMiddleware').mockReturnValue(Promise.resolve({} as any))

    xuiNode.applyMiddleware(middleware, xuiNodeOptions)

    expect(spyOnImportMiddleware).toHaveBeenCalledWith(middleware)
})

test('importMiddleware should throw error', async () => {
    await xuiNode.importMiddleware('some').catch((error) => {
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
