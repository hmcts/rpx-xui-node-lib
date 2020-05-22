import * as events from 'events'
export * from 'openid-client'
import { ClientMetadata } from 'openid-client'

interface LibOptions {
    oidc?: ClientMetadata
}

export class XuiNodeLib extends events.EventEmitter {
    constructor(options: LibOptions) {
        super()
    }
}

const xuiNodeLib = new XuiNodeLib({})

const verifyCallback = (done: any, session: any, user: any) => {
    console.log(session, user)
    console.log('VerifyCallback')
    done()
}

xuiNodeLib.on('oidc.verify', verifyCallback)

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
