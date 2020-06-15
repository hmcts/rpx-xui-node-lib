import { xuiNode, XuiNode } from './xuiNode.class'
import { Router } from 'express'
import { XuiNodeOptions } from './xuiNodeOptions.interface'

test('xuiNode isTruthy', () => {
    expect(xuiNode).toBeTruthy()
})

test('xuiNode configure', () => {
    const mockRouter = {} as Router
    const middlewares: Array<string> = ['session1', 'auth1']
    const xuinode = new XuiNode(mockRouter, middlewares)
    const options = {} as XuiNodeOptions
    const spy = jest.spyOn(xuinode, 'applyMiddleware')
    xuinode.configure(options)
    expect(spy).toBeCalledWith('session1', options)
    expect(spy).toBeCalledWith('auth1', options)
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
