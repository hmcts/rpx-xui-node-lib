import * as events from 'events'
import * as express from 'express'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import passport from 'passport'
import { AUTH } from '../auth.constants'
import { OAuth2Metadata } from '../oauth2'
import { OpenIDMetadata } from '../oidc'
import { SessionMetadata } from '../session/models/sessionMetadata.interface'

export abstract class Strategy extends events.EventEmitter {
    public readonly strategyName: string
    protected readonly router = express.Router({ mergeParams: true })
    constructor(strategyName: string) {
        super()
        this.strategyName = strategyName
    }

    public abstract configure(options: OAuth2Metadata | OpenIDMetadata | SessionMetadata): express.RequestHandler

    public abstract logout(req: express.Request, res: express.Response): Promise<void>

    public loginHandler = (req: Request, res: Response, next: NextFunction): RequestHandler => {
        console.log('loginHandler Hit')
        return passport.authenticate(this.strategyName)(req, res, next)
    }

    public callbackHandler = (req: Request, res: Response, next: NextFunction): void => {
        passport.authenticate(this.strategyName, (error, user, info) => {
            console.info('inside passport authenticate')
            console.error(error)
            if (error) {
                console.error(error)
                // return next(error);
            }
            if (info) {
                console.info(info)
                // return next(info);
            }
            if (!user) {
                console.info('No user found, redirecting')
                return res.redirect(AUTH.ROUTE.LOGIN)
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err)
                }
                if (!this.listenerCount(AUTH.EVENT.AUTHENTICATE_SUCCESS)) {
                    console.log(`redirecting, no listener count: ${AUTH.EVENT.AUTHENTICATE_SUCCESS}`, req.session)
                    res.redirect(AUTH.ROUTE.DEFAULT_REDIRECT)
                } else {
                    this.emit(AUTH.EVENT.AUTHENTICATE_SUCCESS, this, false, req, res, next)
                }
            })
        })(req, res, next)
    }

    public authenticate = (req: Request, res: Response, next: NextFunction): void => {
        if (req.isUnauthenticated()) {
            console.log('unauthenticated, redirecting')
            return res.redirect(AUTH.ROUTE.LOGIN)
        }
        next()
    }
}
