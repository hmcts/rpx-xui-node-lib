"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function auth(options) {
    console.log(options);
    return function authMiddleware(req, res, next) {
        return next();
    };
}
exports.auth = auth;
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