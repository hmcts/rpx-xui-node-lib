import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Client, ClientMetadata, Issuer, Strategy, TokenSet, UserinfoResponse } from 'openid-client';
import * as express from 'express';
import * as events from 'events';
import passport from 'passport';

const loginRoute = '/login';
const callbackRoute = '/oauth2';
/*const logoutRoute = 'logout';
const heartbeatRoute = 'keepalive';*/

export interface OpenIDMetadata extends ClientMetadata {
    discovery_endpoint: string;
    issuer_url: string;
    prompt?: 'login';
    redirect_uri: string;
    scope: string;
    sessionKey?: string;
}

export class OpenID extends events.EventEmitter {
    router = express.Router({ mergeParams: true });

    protected issuer: Issuer<Client> | undefined;
    protected client: Client | undefined;

    protected initialised = false;

    /* eslint-disable @typescript-eslint/camelcase */
    protected options: OpenIDMetadata = {
        client_id: '',
        discovery_endpoint: '',
        issuer_url: '',
        redirect_uri: '',
        scope: '',
    };
    /* eslint-enable @typescript-eslint/camelcase */

    constructor() {
        super();
    }

    public verify = (tokenset: TokenSet, userinfo: UserinfoResponse, done: (err: any, user?: any) => void) => {
        /*if (!propsExist(userinfo, ['roles'])) {
            logger.warn('User does not have any access roles.')
            return done(null, false, {message: 'User does not have any access roles.'})
        }*/
        console.info('verify okay, user:', userinfo);
        return done(null, { tokenset, userinfo });
    };

    public configure = (options: OpenIDMetadata): RequestHandler => {
        this.options = options;

        this.router.use(async (req, res, next) => {
            try {
                if (!this.initialised) {
                    this.issuer = await this.discover();
                    this.client = new this.issuer.Client(this.options);
                    this.initialised = true;
                    passport.use(
                        'oidc',
                        new Strategy(
                            {
                                client: this.client,
                                params: {
                                    prompt: 'login',
                                    // eslint-disable-next-line @typescript-eslint/camelcase
                                    redirect_uri: 'http://localhost:3000/oauth2/callback',
                                    scope: 'profile openid roles manage-user create-user',
                                },
                                sessionKey: 'xui_webapp', // being explicit here so we can set manually on logout
                            },
                            this.verify,
                        ),
                    );
                }
            } catch (err) {
                next(err);
            }
            next();
        });
        this.initialiseRoutes();
        return (req: Request, res: Response, next: NextFunction): void => {
            req.app.use(passport.initialize());
            req.app.use(passport.session());
            passport.serializeUser((user, done) => {
                done(null, user);
            });

            passport.deserializeUser((id, done) => {
                done(null, id);
            });
            req.app.use('/auth', this.router);
            req.app.get('/oauth2/callback', this.callbackHandler);
            next();
        };
    };

    public initialiseRoutes = (): void => {
        this.router.get(loginRoute, this.loginHandler);
        // this.router.get('callback', this.callbackHandler);
    };

    public callbackHandler = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
        passport.authenticate('oidc', (error, user, info) => {
            // TODO: give a more meaningful error to user rather than redirect back to idam
            // return next(error) would pass off to error.handler.ts to show users a proper error page etc
            if (error) {
                console.error(error);
                // return next(error);
            }
            if (info) {
                console.info(info);
                // return next(info);
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
                    console.log('redirecting, no listener count: oidc.authenticate.success', req.session);
                    res.redirect('/');
                    // return next();
                }
            });
        })(req, res, next);
    };

    public discover = async (): Promise<Issuer<Client>> => {
        console.log(`discovering endpoint: ${this.options.discovery_endpoint}`);
        const issuer = await Issuer.discover(`${this.options.discovery_endpoint}`);

        const metadata = issuer.metadata;
        metadata.issuer = this.options.issuer_url;

        console.log('metadata', metadata);

        return new Issuer(metadata);
    };

    public loginHandler = (req: Request, res: Response, next: NextFunction): RequestHandler => {
        console.log('loginHandler Hit');
        return passport.authenticate('oidc')(req, res, next);
    };

    public authenticate = (req: Request, res: Response, next: NextFunction): void => {
        if (req.isAuthenticated()) {
            console.log('req is authenticated');
            this.emit('oidc.bootstrap.success');
            return next();
        }
        console.log('unauthed, redirecting');
        res.redirect(loginRoute);
    };
}

export default new OpenID();
