import * as events from 'events'
import * as express from 'express'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import passport from 'passport'
import { AUTH } from '../auth.constants'
import { OpenIDMetadata } from '../oidc/models'
import { OAuth2Metadata } from '../oauth2/models'
import jwtDecode from 'jwt-decode'
import { http } from '../../http'

export abstract class Authentication extends events.EventEmitter {
    protected readonly strategyName: string

    protected readonly router = express.Router({ mergeParams: true })

    protected readonly logger = console

    protected options: any

    protected constructor(strategyName: string) {
        super()
        this.strategyName = strategyName
    }

    public abstract validateOptions(options: any): void
    public initialiseStrategy = async (options: any): Promise<void> => {
        this.options = options
    }

    public loginHandler = (req: Request, res: Response, next: NextFunction): RequestHandler => {
        this.logger.log('loginHandler Hit')
        return passport.authenticate(this.strategyName)(req, res, next)
    }

    public logout = async (req: Request, res: Response): Promise<void> => {
        try {
            this.logger.log('logout start')
            const accessToken = req.session?.passport.user.tokenset.accessToken
            const refreshToken = req.session?.passport.user.tokenset.refreshToken

            const auth = `Basic ${Buffer.from(`${this.options.clientID}:${this.options.clientSecret}`).toString(
                'base64',
            )}`

            await http.delete(`${this.options.logout_url}/session/${accessToken}`, {
                headers: {
                    Authorization: auth,
                },
            })
            await http.delete(`${this.options.logout_url}/session/${refreshToken}`, {
                headers: {
                    Authorization: auth,
                },
            })

            //passport provides this method on request object
            req.logout()

            if (!req.query.noredirect && req.query.redirect) {
                // 401 is when no accessToken
                res.redirect(401, AUTH.ROUTE.DEFAULT_REDIRECT)
            } else {
                res.redirect(AUTH.ROUTE.DEFAULT_REDIRECT)
            }
        } catch (e) {
            res.redirect(401, AUTH.ROUTE.DEFAULT_REDIRECT)
        }
        this.logger.log('logout end')
    }

    public configure = (options: OpenIDMetadata | OAuth2Metadata): RequestHandler => {
        this.validateOptions(options)
        this.options = options
        passport.serializeUser((user, done) => {
            this.logger.log(`${this.strategyName} serializeUser`, user)
            if (!this.listenerCount(AUTH.EVENT.SERIALIZE_USER)) {
                done(null, user)
            } else {
                this.emit(AUTH.EVENT.SERIALIZE_USER, user, done)
            }
        })

        passport.deserializeUser((id, done) => {
            this.logger.log(`${this.strategyName} deserializeUser`, id)
            if (!this.listenerCount(AUTH.EVENT.DESERIALIZE_USER)) {
                done(null, id)
            } else {
                this.emit(AUTH.EVENT.DESERIALIZE_USER, id, done)
            }
        })
        ;(async () => {
            await this.initialiseStrategy(this.options)
        })()

        this.router.use(passport.initialize())
        this.router.use(passport.session())

        if (options.useRoutes) {
            this.router.get(AUTH.ROUTE.DEFAULT_AUTH_ROUTE, (req, res) => {
                res.send(req.isAuthenticated())
            })
            this.router.get(AUTH.ROUTE.LOGIN, this.loginHandler)
            this.router.get(AUTH.ROUTE.OAUTH_CALLBACK, this.callbackHandler)
            this.router.get(AUTH.ROUTE.LOGOUT, async (req: Request, res: Response) => {
                await this.logout(req, res)
            })
        }
        this.emit(`${this.strategyName}.bootstrap.success`)
        return this.router
    }

    public callbackHandler = (req: Request, res: Response, next: NextFunction): void => {
        passport.authenticate(this.strategyName, (error, user, info) => {
            this.logger.info('inside passport authenticate')
            this.logger.error(error)
            if (error) {
                this.logger.error(error)
                // return next(error);
            }
            if (info) {
                this.logger.info(info)
                // return next(info);
            }
            if (!user) {
                this.logger.info('No user found, redirecting')
                return res.redirect(AUTH.ROUTE.LOGIN)
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err)
                }
                if (!this.listenerCount(AUTH.EVENT.AUTHENTICATE_SUCCESS)) {
                    this.logger.log(`redirecting, no listener count: ${AUTH.EVENT.AUTHENTICATE_SUCCESS}`, req.session)
                    res.redirect(AUTH.ROUTE.DEFAULT_REDIRECT)
                } else {
                    this.emit(AUTH.EVENT.AUTHENTICATE_SUCCESS, false, req, res, next)
                }
            })
        })(req, res, next)
    }

    public isTokenExpired = (token: string): boolean => {
        const jwtData = jwtDecode<any>(token)
        const expires = new Date(jwtData.exp * 1000).getTime()
        const now = new Date().getTime()
        return expires < now
    }

    public authenticate = (req: Request, res: Response, next: NextFunction): void => {
        if (req.isUnauthenticated()) {
            this.logger.log('unauthenticated, redirecting')
            return res.redirect(AUTH.ROUTE.LOGIN)
        }
        next()
    }
}

// import { NextFunction, Request, RequestHandler, Response } from 'express'
// import { ClientMetadata } from 'openid-client'

// export function auth(options: ClientMetadata): RequestHandler {
//     this.logger.log(options)
//     return function authMiddleware(req: Request, res: Response, next: NextFunction): void {
//         return next()
//     }
// }

/*
import * as express from "express";
import session from "express-session";
import sessionFileStore from "session-file-store";
import * as passport from 'passport';

const FileStore = sessionFileStore(session);

// @ts-ignore
import strategy from "./oidc.strategy";

export function auth(options: any) {

  const sessionOptions = {
    cookie: {
      httpOnly: true,
      maxAge: 1800000,
      secure: false
    },
    name: "xui-webapp",
    resave: true,
    saveUninitialized: true,
    secret: "secretSauce",
    store: new FileStore({
      path: process.env.NOW ? "/tmp/sessions" : ".sessions"
    })
  };

  return function(req: express.Request, res: express.Response, next: express.NextFunction) {

    // const passport = options.passport;
    const app = options.app;

    app.use(session(sessionOptions));
    app.use(passport.initialize());
    app.use(passport.session());

    // @ts-ignore
    passport.use('oidc', strategy);

    // @ts-ignore
    this.logger.log("auth middleware: ", options, strategy);
  };
}
*/
