import { EventEmitter } from 'events'
import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { XuiNodeOptions } from './xuiNodeOptions.interface'
import * as path from 'path'
import { hasKey } from '../util'
import { AUTH } from '../../auth'

export class XuiNode extends EventEmitter {
    protected readonly router = Router({ mergeParams: true })
    // deliberately done it this way as we need session first
    protected readonly middlewares = ['session', 'auth']

    /**
     * the proxied authenticate method which is publicly exposed
     * @param req
     * @param res
     * @param next
     */
    public authenticate = (req: Request, res: Response, next: NextFunction): void => {
        if (req.isUnauthenticated()) {
            console.log('unauthenticated, redirecting')
            return res.redirect(AUTH.ROUTE.LOGIN)
        }
        next()
    }

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
                this.proxyEvents(middleware)
                if (hasKey(middleware, 'authenticate')) {
                    this.authenticate = middleware.authenticate
                }
                this.router.use(middleware.configure(value))
            }
        }
    }

    /**
     * helper method to proxy any listened events onto the correct middleware
     * @param middleware
     */
    public proxyEvents = (middleware: any): void => {
        const events = middleware.getEvents()
        events.forEach((event: string) => {
            if (this.listenerCount(event)) {
                middleware.on(event, (...args: any) => this.emit(event, ...args))
            }
        })
    }
}

export default new XuiNode()
