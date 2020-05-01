import { NextFunction, Request, Response } from 'express';
import { handleOpenIdConnect } from '../openIDConnect';
import { IAuthOptions, StrategyTypes } from './interfaces';
import { handleOAuth2 } from './oAuth2';

export function auth(options: IAuthOptions) {
    switch (options.strategyType) {
        case StrategyTypes.oauth2:
            handleOAuth2(options);
            break;
        case StrategyTypes.oidc:
            handleOpenIdConnect(options);
            break;
    }
    return function authMiddleware(req: Request, res: Response, next: NextFunction) {
        return next();
    };
}

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
