import { EventEmitter } from 'events'
import { RequestHandler, Router } from 'express'
import { XuiNodeOptions } from './xuiNodeOptions.interface'
import * as path from 'path'
import { hasKey } from '../util'

export class XuiNode extends EventEmitter {
    protected readonly router = Router({ mergeParams: true })
    // deliberately done it this way as we need session first
    protected readonly middlewares = ['session', 'auth']

    public configure = (options: XuiNodeOptions): RequestHandler => {
        this.middlewares.forEach((middleware) => this.applyMiddleware(middleware, options))
        return this.router
    }

    public applyMiddleware = async (middleware: string, options: XuiNodeOptions) => {
        if (hasKey(options, middleware)) {
            const baseDir = path.join(__dirname, '../../')
            const middlewareLayerOptions = options[middleware]
            const middlewareLayer = await import(path.join(baseDir, middleware))
            this.applyMiddlewareLayer(middlewareLayer, middlewareLayerOptions)
        }
    }

    public applyMiddlewareLayer = (middlewareLayer: any, options: any): void => {
        for (const [key, value] of Object.entries(options)) {
            if (hasKey(middlewareLayer, key)) {
                const middleware = middlewareLayer[key]
                this.router.use(middleware.configure(value))
            }
        }
    }
}

export default new XuiNode()
