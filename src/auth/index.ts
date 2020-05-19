import * as events from 'events'
import * as express from 'express'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import passport from 'passport'

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
