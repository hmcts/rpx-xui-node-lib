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
