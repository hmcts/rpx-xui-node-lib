import { NextFunction, Request, RequestHandler, Response } from 'express'
import { Client, Issuer, Strategy, TokenSet, UserinfoResponse } from 'openid-client'
import * as express from 'express'
import * as events from 'events'
import passport from 'passport'
import { AUTH, OIDC } from './oidc.constants'
import { URL } from 'url'
import { http } from '../../http/http'
import { OpenIDMetadata } from './OpenIDMetadata'
import { ValidateOpenIdOptions } from './validation/openIdOptions.validation'

export class OpenID extends events.EventEmitter {
    router = express.Router({ mergeParams: true })

    protected issuer: Issuer<Client> | undefined
    protected client: Client | undefined

    protected initialised = false

    /* eslint-disable @typescript-eslint/camelcase */
    protected options: OpenIDMetadata = {
        client_id: '',
        discovery_endpoint: '',
        issuer_url: '',
        redirect_uri: '',
        scope: '',
        logout_url: '',
        useRoutes: true,
    }
    /* eslint-enable @typescript-eslint/camelcase */

    constructor() {
        super()
    }

    public verify = (tokenset: TokenSet, userinfo: UserinfoResponse, done: (err: any, user?: any) => void) => {
        /*if (!propsExist(userinfo, ['roles'])) {
            logger.warn('User does not have any access roles.')
            return done(null, false, {message: 'User does not have any access roles.'})
        }*/
        console.info('verify okay, user:', userinfo)
        return done(null, { tokenset, userinfo })
    }

    public initialiseStrategy = async (initialised: boolean, options: OpenIDMetadata): Promise<void> => {
        if (!initialised) {
            const redirectUri = new URL(AUTH.ROUTE.OAUTH_CALLBACK, options.redirect_uri)
            this.issuer = await this.discover()
            this.client = new this.issuer.Client(options)
            passport.use(
                OIDC.STRATEGY_NAME,
                new Strategy(
                    {
                        client: this.client,
                        params: {
                            prompt: OIDC.PROMPT,
                            // eslint-disable-next-line @typescript-eslint/camelcase
                            redirect_uri: redirectUri.toString(),
                            scope: options.scope,
                        },
                        sessionKey: options.sessionKey, // being explicit here so we can set manually on logout
                    },
                    this.verify,
                ),
            )
        }
    }

    public configure = (options: OpenIDMetadata): RequestHandler => {
        this.options = options
        // ValidateOpenIdOptions(options)
        passport.serializeUser((user, done) => {
            if (!this.listenerCount(AUTH.EVENT.SERIALIZE_USER)) {
                done(null, user)
            } else {
                this.emit(AUTH.EVENT.SERIALIZE_USER, user, done)
            }
        })

        passport.deserializeUser((id, done) => {
            if (!this.listenerCount(AUTH.EVENT.DESERIALIZE_USER)) {
                done(null, id)
            } else {
                this.emit(AUTH.EVENT.DESERIALIZE_USER, id, done)
            }
        })
        ;(async () => {
            try {
                await this.initialiseStrategy(this.initialised, this.options)
                this.initialised = true
            } catch (err) {
                // next(err)
                this.emit('oidc.configure.error', err)
            }
        })()

        this.router.use(passport.initialize())
        this.router.use(passport.session())

        if (options.useRoutes) {
            this.router.get(AUTH.ROUTE.DEFAULT_AUTH_ROUTE, (req, res) => {
                res.send(req.isAuthenticated())
            })
            this.router.get(AUTH.ROUTE.LOGIN, this.loginHandler)
            this.router.get(AUTH.ROUTE.OAUTH_CALLBACK, this.callbackHandler)
            this.router.get(AUTH.ROUTE.LOGOUT, async (req, res) => {
                await this.logout(req, res)
            })
        }
        this.emit('oidc.bootstrap.success')

        return this.router
    }

    public logout = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            console.log('logout start')
            const accessToken = req.session?.passport.user.tokenset.access_token
            const refreshToken = req.session?.passport.user.tokenset.refresh_token

            const auth = `Basic ${Buffer.from(`${this.options.client_id}:${this.options.client_secret}`).toString(
                'base64',
            )}`

            await http.delete(`${this.options.logout_url}/session/${accessToken}`, {
                headers: {
                    Authorization: auth,
                },
            })
            await http.delete(`${this.options.logout_url}/session/${refreshToken}`, {
                headers: {
                    Authorization: auth,
                },
            })

            //passport provides this method on request object
            req.logout()

            if (!req.query.noredirect && req.query.redirect) {
                // 401 is when no accessToken
                res.redirect(401, AUTH.ROUTE.DEFAULT_REDIRECT)
            } else {
                res.redirect(AUTH.ROUTE.DEFAULT_REDIRECT)
            }
        } catch (e) {
            res.redirect(401, AUTH.ROUTE.DEFAULT_REDIRECT)
        }
        console.log('logout end')
    }

    public callbackHandler = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
        passport.authenticate(OIDC.STRATEGY_NAME, (error, user, info) => {
            // TODO: give a more meaningful error to user rather than redirect back to idam
            // return next(error) would pass off to error.handler.ts to show users a proper error page etc
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
                if (!this.listenerCount(OIDC.EVENT.AUTHENTICATE_SUCCESS)) {
                    console.log(`redirecting, no listener count: ${OIDC.EVENT.AUTHENTICATE_SUCCESS}`, req.session)
                    res.redirect(AUTH.ROUTE.DEFAULT_REDIRECT)
                } else {
                    this.emit(OIDC.EVENT.AUTHENTICATE_SUCCESS, req, res, next)
                }
            })
        })(req, res, next)
    }

    public discover = async (): Promise<Issuer<Client>> => {
        console.log(`discovering endpoint: ${this.options.discovery_endpoint}`)
        const issuer = await Issuer.discover(`${this.options.discovery_endpoint}`)

        const metadata = issuer.metadata
        metadata.issuer = this.options.issuer_url

        console.log('metadata', metadata)

        return new Issuer(metadata)
    }

    public loginHandler = (req: Request, res: Response, next: NextFunction): RequestHandler => {
        console.log('loginHandler Hit')
        return passport.authenticate(OIDC.STRATEGY_NAME)(req, res, next)
    }

    public authenticate = (req: Request, res: Response, next: NextFunction): void => {
        if (req.isAuthenticated()) {
            console.log('req is authenticated')
            return next()
        }
        console.log('unauthed,redirecting')
        res.redirect(AUTH.ROUTE.LOGIN)
    }
}

export default new OpenID()
