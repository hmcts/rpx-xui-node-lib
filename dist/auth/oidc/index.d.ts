/// <reference types="qs" />
/// <reference types="node" />
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Client, Issuer, TokenSet, UserinfoResponse } from 'openid-client';
import * as events from 'events';
import { OpenIDMetadata } from './OpenIDMetadata';
export declare class OpenID extends events.EventEmitter {
    router: import("express-serve-static-core").Router;
    protected issuer: Issuer<Client> | undefined;
    protected client: Client | undefined;
    protected options: OpenIDMetadata;
    constructor();
    verify: (tokenset: TokenSet, userinfo: UserinfoResponse, done: (err: any, user?: any) => void) => void;
    initialiseStrategy: (options: OpenIDMetadata) => Promise<void>;
    configure: (options: OpenIDMetadata) => RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs>;
    logout: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs>, res: Response<any>) => Promise<void>;
    callbackHandler: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs>, res: Response<any>, next: NextFunction) => void;
    discover: () => Promise<Issuer<Client>>;
    loginHandler: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs>, res: Response<any>, next: NextFunction) => RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs>;
    isTokenExpired: (token: string) => boolean;
    authenticate: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs>, res: Response<any>, next: NextFunction) => Promise<void>;
}
declare const _default: OpenID;
export default _default;
