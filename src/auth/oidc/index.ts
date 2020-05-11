import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Client, ClientMetadata, Issuer } from 'openid-client';
import * as express from 'express';
import * as events from 'events';
import passport from 'passport';

const loginRoute = 'login';
const callbackRoute = '/oauth2';
/*const logoutRoute = 'logout';
const heartbeatRoute = 'keepalive';*/

export interface OpenIDMetadata extends ClientMetadata {
    discovery_endpoint: string;
    issuer: string;
    prompt?: 'login';
    redirect_uri: string;
    scope: string;
    sessionKey?: string;
}

export class OpenID extends events.EventEmitter {
    router = express.Router({ mergeParams: true });

    protected issuer: Issuer<Client> | undefined;
    protected client: Client | undefined;

    /* eslint-disable @typescript-eslint/camelcase */
    protected options: OpenIDMetadata = {
        client_id: '',
        discovery_endpoint: '',
        issuer: '',
        redirect_uri: '',
        scope: '',
    };
    /* eslint-enable @typescript-eslint/camelcase */

    constructor() {
        super();
        this.initialiseRoutes();
    }

    setOptions(options: OpenIDMetadata): void {
        this.options = options;
    }

    async configure(): Promise<void> {
        if (!this.issuer) {
            this.issuer = await this.discover();
        }

        if (!this.client) {
            this.client = new this.issuer.Client(this.options);
        }
    }

    initialiseRoutes(): void {
        this.router.get(loginRoute, this.loginHandler);
        this.router.post('callback', this.callbackHandler);
        console.log('initialiseRoutes', loginRoute, 'callback');
    }

    callbackHandler(req: express.Request, res: express.Response, next: express.NextFunction): void {
        passport.authenticate('oidc', (error, user, info) => {
            // TODO: give a more meaningful error to user rather than redirect back to idam
            // return next(error) would pass off to error.handler.ts to show users a proper error page etc
            if (error) {
                console.error(error);
                return next(error);
            }
            if (info) {
                console.info(info);
                return next(info);
            }
            if (!user) {
                console.info('No user found, redirecting');
                return res.redirect('/auth/login');
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                this.emit('oidc.authenticate.success', req, res, next);
                if (!this.listenerCount('oidc.authenticate.success')) {
                    console.log('redirecting, no listener count: oidc.authenticate.success');
                    res.redirect('/');
                    return next();
                }
            });
        })(req, res, next);
    }

    async discover(): Promise<Issuer<Client>> {
        console.log(`discovering endpoint: ${this.options.discovery_endpoint}`);
        const issuer = await Issuer.discover(`${this.options.discovery_endpoint}/o`);

        const metadata = issuer.metadata;
        metadata.issuer = this.options.issuer;

        console.log('metadata', metadata);

        return new Issuer(metadata);
    }

    loginHandler(req: Request, res: Response, next: NextFunction): RequestHandler {
        console.log('loginHandler Hit');
        return passport.authenticate('oidc')(req, res, next);
    }

    async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
        await this.configure();
        console.log('authenticate');
        req.app.use(passport.initialize());
        req.app.use(passport.session());

        req.app.use('auth', this.router);
        req.app.use(callbackRoute, this.router);
        if (req.isAuthenticated()) {
            console.log('req is authenticated');
            this.emit('oidc.bootstrap.success');
            return next();
        }
        console.log('unauthed, redirecting');
        res.redirect(loginRoute);
    }
}

/*export function oidc(options: OpenIDMetadata): OpenID {
    return new OpenID(options);
}*/

export default new OpenID();

/*app.use(oidc.configure({
    redirect_uri: 'https://idam-web.hmcts.net/authorize?callback_url=http://localhost:3000/auth/login'
    discovery: 'https://idam-web.hmcts.net/o',
}));

oidc.on('')*/
