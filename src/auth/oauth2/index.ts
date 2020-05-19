import * as events from 'events'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import * as express from 'express'
import { OAuth2Metadata } from './OAuth2Metadata'
import passport from 'passport'
import { AUTH } from '../auth.constants'
import { OAUTH2 } from './oauth2.constants'
import OAuth2Strategy, { VerifyCallback } from 'passport-oauth2'
import { Authentication } from '..'

export class OAuth2 extends Authentication {
    protected options: OAuth2Metadata = {
        authorizationURL: '',
        tokenURL: '',
        clientID: '',
        clientSecret: '',
        scope: '',
        logoutUrl: '',
        sessionKey: '',
        useRoutes: true,
    }

    router = express.Router({ mergeParams: true })
    constructor() {
        super()
    }

    public loginHandler = (req: Request, res: Response, next: NextFunction): RequestHandler => {
        console.log('loginHandler Hit')
        return passport.authenticate(OAUTH2.STRATEGY_NAME)(req, res, next)
    }

    public callbackHandler = (req: Request, res: Response, next: NextFunction): void => {
        console.info('outside passport authenticate', req.query.code)
        passport.authenticate(OAUTH2.STRATEGY_NAME, (error, user, info) => {
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
                if (!this.listenerCount(OAUTH2.EVENT.AUTHENTICATE_SUCCESS)) {
                    console.log(`redirecting, no listener count: ${OAUTH2.EVENT.AUTHENTICATE_SUCCESS}`, req.session)
                    res.redirect(AUTH.ROUTE.DEFAULT_REDIRECT)
                } else {
                    this.emit(OAUTH2.EVENT.AUTHENTICATE_SUCCESS, req, res, next)
                }
            })
        })(req, res, next)
    }

    public configure = (options: OAuth2Metadata): RequestHandler => {
        console.log('configure start')
        this.options = options
        passport.serializeUser((user, done) => {
            if (!this.listenerCount(AUTH.EVENT.SERIALIZE_USER)) {
                done(null, user)
            } else {
                this.emit(AUTH.EVENT.SERIALIZE_USER, user, done)
            }
        })

        passport.deserializeUser((id, done) => {
            if (!this.listenerCount(AUTH.EVENT.DESERIALIZE_USER)) {
                done(null, id)
            } else {
                this.emit(AUTH.EVENT.DESERIALIZE_USER, id, done)
            }
        })
        console.log('before initialiseStrategy')
        this.initialiseStrategy(this.options)
        console.log('after initialiseStrategy')

        this.router.use(passport.initialize())
        this.router.use(passport.session())

        if (options.useRoutes) {
            this.router.get(AUTH.ROUTE.DEFAULT_AUTH_ROUTE, (req, res) => {
                res.send(req.isAuthenticated())
            })
            this.router.get(AUTH.ROUTE.LOGIN, this.loginHandler)
            this.router.get(AUTH.ROUTE.OAUTH_CALLBACK, this.callbackHandler)
            this.router.get(AUTH.ROUTE.LOGOUT, async (req, res) => {
                await this.logout(req, res)
            })
        }
        this.emit('outh2.bootstrap.success')
        console.log('configure end')
        return this.router
    }

    public logout = async (req: express.Request, res: express.Response): Promise<void> => {
        await console.log('logout')
    }

    public initialiseStrategy = (options: OAuth2Metadata): void => {
        passport.use(OAUTH2.STRATEGY_NAME, new OAuth2Strategy(options, this.verify))
        console.log('initialiseStrategy end')
    }

    public verify = (accessToken: string, refreshToken: string, results: any, profile: any, done: VerifyCallback) => {
        console.log('verify')
        done(null, profile)
    }
}

export default new OAuth2()
