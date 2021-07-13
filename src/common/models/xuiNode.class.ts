import { EventEmitter } from 'events'
import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { XuiNodeOptions } from './xuiNodeOptions.interface'
import { hasKey, getLogger, XuiLogger } from '../util'
import { AUTH } from '../../auth/auth.constants' // NOTE: do not shorten this path, tests fail (circular import somewhere)
import { XuiNodeMiddlewareInterface } from './xuiNodeMiddleware.interface'

export class XuiNode extends EventEmitter {
    protected readonly router: Router
    protected readonly middlewares: Array<string>
    protected readonly logger: XuiLogger
    public authenticateMiddleware: any
    public constructor(
        router: Router = Router({ mergeParams: true }),
        // deliberately done it this way as we need session first
        middlewares: Array<string> = ['session', 'auth'],
        logger: XuiLogger = getLogger('common:XuiNode'),
    ) {
        super()
        this.router = router
        this.middlewares = middlewares
        this.logger = logger
    }

    public authenticate = (req: Request, res: Response, next: NextFunction): void => {
        const authMiddleware = this.authenticateMiddleware ? this.authenticateMiddleware : this.authenticateDefault
        authMiddleware(req, res, next)
    }

    /**
     * the proxied authenticate method which is publicly exposed
     * what constitutes a user being unauthenticated?
     * @see https://github.com/jaredhanson/passport/blob/597e289d6fa27a2c35d16dd411de284123e3817e/lib/http/request.js#L92
     * @param req
     * @param res
     * @param next
     */
    public authenticateDefault = (req: Request, res: Response, next: NextFunction): void => {
        if (req.isUnauthenticated()) {
            this.logger.log('unauthenticated')
        }
        next()
    }

    public configure = (options: XuiNodeOptions): RequestHandler => {
        this.middlewares.forEach(async (middleware) => await this.applyMiddleware(middleware, options))
        return this.router
    }

    /**
     * Import a middleware layer.
     *
     * @param {string} middleware - ie. 's2s'
     * @return {Promise<any>}
     */
    public importMiddleware = async (middleware: string) => {
        switch (middleware) {
            case 'auth':
                return await import(/* webpackChunkName: "xuiNodeAuth" */ '../../auth')
            case 'session':
                return await import(/* webpackChunkName: "xuiNodeSession" */ '../../session')
            default:
                throw new Error('unknown middleware')
        }
    }

    public applyMiddleware = async (middleware: string, options: XuiNodeOptions): Promise<void> => {
        if (hasKey(options, middleware)) {
            const middlewareLayerOptions = options[middleware]
            const middlewareLayer = await this.importMiddleware(middleware)
            this.applyMiddlewareLayer(middlewareLayer, middlewareLayerOptions)
        }
    }

    public applyMiddlewareLayer = (middlewareLayer: any, options: any): void => {
        for (const [key, value] of Object.entries(options)) {
            if (hasKey(middlewareLayer, key)) {
                const middleware = middlewareLayer[key]
                this.proxyEvents(middleware)
                if (hasKey(middleware, 'authenticate')) {
                    this.logger.log('using authenticate middleware from ', middleware.constructor.name)
                    this.authenticateMiddleware = middleware.authenticate
                }
                this.router.use(middleware.configure(value))
            }
        }
    }

    /**
     * helper method to proxy any listened events onto the correct middleware
     * @param middleware - any middleware layer e.g s2s, oidc, fileStore etc this typically extends EventEmitter
     */
    public proxyEvents = (middleware: XuiNodeMiddlewareInterface): void => {
        const events = middleware.getEvents()
        events.forEach((event: string) => {
            if (this.listenerCount(event)) {
                this.logger.log('proxying event ', event)
                middleware.on(event, (...args: any) => this.emit(event, ...args))
            }
        })
    }
}

export const xuiNode = new XuiNode()
