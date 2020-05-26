import * as events from 'events'
import * as express from 'express'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import passport from 'passport'
import { AUTH } from '../auth.constants'

export class Authentication extends events.EventEmitter {
    protected readonly strategyName: string
    protected readonly router = express.Router({ mergeParams: true })
    constructor(strategyName: string) {
        super()
        this.strategyName = strategyName
    }

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
                    this.emit(AUTH.EVENT.AUTHENTICATE_SUCCESS, false, req, res, next)
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

// import { NextFunction, Request, RequestHandler, Response } from 'express'
// import { ClientMetadata } from 'openid-client'

// export function auth(options: ClientMetadata): RequestHandler {
//     console.log(options)
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
    console.log("auth middleware: ", options, strategy);
  };
}
*/
