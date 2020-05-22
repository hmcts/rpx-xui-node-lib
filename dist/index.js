"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var events = __importStar(require("events"));
__export(require("openid-client"));
var XuiNodeLib = /** @class */ (function (_super) {
    __extends(XuiNodeLib, _super);
    function XuiNodeLib(options) {
        return _super.call(this) || this;
    }
    return XuiNodeLib;
}(events.EventEmitter));
exports.XuiNodeLib = XuiNodeLib;
var xuiNodeLib = new XuiNodeLib({});
var verifyCallback = function (done, session, user) {
    console.log(session, user);
    done();
};
xuiNodeLib.on('oidc.verify', verifyCallback);
/*
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { auth } from './auth';

const DEFAULT_MIDDLEWARE = ['auth'];

export function xuiNodeLib(options: any): RequestHandler {
    options = options || {};

    if (options.constructor.name === 'IncomingMessage') {
        throw new Error(
            'It appears you have done something like `app.use(xuiNodeLib)`, but it should be `app.use(xuiNodeLib())`.',
        );
    }

    const stack = middlewares.reduce((result, middlewareName: string) => {
        // @ts-ignore
        const middleware = xuiNodeLib[middlewareName];
        let middlewareOptions = options[middlewareName];
        const isDefault = DEFAULT_MIDDLEWARE.indexOf(middlewareName) !== -1;

        if (middlewareOptions === false) {
            return result;
        } else if (middlewareOptions === true) {
            middlewareOptions = {};
        }

        if (middlewareOptions != null) {
            return result.concat(middleware(middlewareOptions));
        } else if (isDefault) {
            return result.concat(middleware({}));
        }
        return result;
    }, []);

    return function xuiNodeLibMiddleware(req: Request, res: Response, next: NextFunction): void {
        let index = 0;

        function internalNext(...params: any[]): void {
            if (params.length > 0) {
                return next(params);
            }

            const middleware = stack[index];
            if (!middleware) {
                return next();
            }

            index++;

            middleware(req, res, internalNext);
        }

        internalNext();
    };
}

xuiNodeLib.auth = auth;

const middlewares: any[] = Object.keys(xuiNodeLib);
*/
