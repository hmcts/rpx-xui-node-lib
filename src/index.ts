import { NextFunction, Request, Response } from 'express';
import { auth } from './auth';

const DEFAULT_MIDDLEWARE = ['auth'];

export function xuiNodeLib(options: any) {
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

    return function xuiNodeLibMiddleware(req: Request, res: Response, next: NextFunction) {
        let index = 0;

        function internalNext() {
            if (arguments.length > 0) {
                // @ts-ignore
                return next.apply(null, arguments);
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
