import xuiNode, { XuiNode } from './xuiNode.class'
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

    expect(spyOnImportMiddleware).toHaveBeenCalledWith(expect.any(String), middleware)
})
