import { EventEmitter } from 'events'
import { RequestHandler, Router } from 'express'
import { XuiNodeOptions } from './xuiNodeOptions.interface'
import * as path from 'path'
import { hasKey } from '../util'

export class XuiNode extends EventEmitter {
    protected readonly router: Router
    protected readonly middlewares: Array<string>
    public constructor(
        router: Router = Router({ mergeParams: true }),
        // deliberately done it this way as we need session first
        middlewares: Array<string> = ['session', 'auth'],
    ) {
        super()
        this.router = router
        this.middlewares = middlewares
    }

    public configure = (options: XuiNodeOptions): RequestHandler => {
        this.middlewares.forEach(async (middleware) => await this.applyMiddleware(middleware, options))
        return this.router
    }

    /**
     * Import a middleware layer.
     *
     * @param {string} baseDir - ie. /Users/username/projects/rpx-xui-node-lib/src/
     * @param {string} middleware - ie. 's2s'
     * @return {Promise<any>}
     */
    public importMiddleware = async (baseDir: string, middleware: string) =>
        await import(path.join(baseDir, middleware))

    public applyMiddleware = async (middleware: string, options: XuiNodeOptions): Promise<void> => {
        if (hasKey(options, middleware)) {
            const baseDir = path.join(__dirname, '../../')
            const middlewareLayerOptions = options[middleware]
            const middlewareLayer = await this.importMiddleware(baseDir, middleware)
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
