import * as express from 'express'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import { Client, Issuer, Strategy, TokenSet, UserinfoResponse } from 'openid-client'
import passport from 'passport'
import { OIDC } from '../oidc.constants'
import { URL } from 'url'
import { http } from '../../../http'
import { OpenIDMetadata } from './OpenIDMetadata.interface'
import { ValidateOpenIdOptions } from '../validation'
import { AUTH } from '../../auth.constants'
import { Strategy as AuthStrategy } from '../../models'
import jwtDecode from 'jwt-decode'

//TODO: move this as an option and proper logger
const logger = console

export class OpenID extends AuthStrategy {
    protected issuer: Issuer<Client> | undefined
    protected client: Client | undefined

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
        super(OIDC.STRATEGY_NAME)
    }

    public verify = (tokenset: TokenSet, userinfo: UserinfoResponse, done: (err: any, user?: any) => void) => {
        /*if (!propsExist(userinfo, ['roles'])) {
            logger.warn('User does not have any access roles.')
            return done(null, false, {message: 'User does not have any access roles.'})
        }*/
        logger.info('verify okay, user:', userinfo)
        return done(null, { tokenset, userinfo })
    }

    public initialiseStrategy = async (options: OpenIDMetadata): Promise<void> => {
        const redirectUri = new URL(AUTH.ROUTE.OAUTH_CALLBACK, options.redirect_uri)
        this.issuer = await this.discover()
        this.client = new this.issuer.Client(options)
        passport.use(
            this.strategyName,
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

    public configure = (options: OpenIDMetadata): RequestHandler => {
        this.options = options
        ValidateOpenIdOptions(options)
        this.serializeUser()
        this.deserializeUser()
        ;(async () => {
            try {
                await this.initialiseStrategy(this.options)
            } catch (err) {
                // next(err)
                logger.error(err)
                this.emit('oidc.configure.error', err)
            }
        })()

        this.initializePassport()
        this.initializeSession()

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
            logger.log('logout start')
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
        logger.log('logout end')
    }

    public discover = async (): Promise<Issuer<Client>> => {
        logger.log(`discovering endpoint: ${this.options.discovery_endpoint}`)
        const issuer = await Issuer.discover(`${this.options.discovery_endpoint}`)

        const metadata = issuer.metadata
        metadata.issuer = this.options.issuer_url

        logger.log('metadata', metadata)

        return new Issuer(metadata)
    }

    public isTokenExpired = (token: string): boolean => {
        const jwtData = jwtDecode<any>(token)
        const expires = new Date(jwtData.exp * 1000).getTime()
        const now = new Date().getTime()
        return expires < now
    }

    public authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (req.isUnauthenticated()) {
            logger.log('unauthenticated, redirecting')
            return res.redirect(AUTH.ROUTE.LOGIN)
        }

        if (req.session && this.client) {
            logger.info('req.session and this.client')
            const userDetails = req.session.passport.user
            const currentAccessToken = userDetails.tokenset.access_token

            req.headers['user-roles'] = userDetails.userinfo.roles.join()

            if (currentAccessToken) {
                try {
                    logger.info('found currentAccessToken')
                    // TODO: ideally we need to introspect the tokens but currently unsupported in IDAM
                    if (this.isTokenExpired(currentAccessToken)) {
                        logger.log('token expired')
                        req.session.passport.user.tokenset = await this.client.refresh(
                            req.session.passport.user.tokenset.refresh_token,
                            req.session.passport.user.tokenset,
                        )
                        req.headers.Authorization = `Bearer ${req.session.passport.user.tokenset.access_token}`
                        if (!this.listenerCount(AUTH.EVENT.AUTHENTICATE_SUCCESS)) {
                            logger.log(`refresh: no listener count: ${AUTH.EVENT.AUTHENTICATE_SUCCESS}`)
                            return next()
                        } else {
                            this.emit(AUTH.EVENT.AUTHENTICATE_SUCCESS, true, req, res, next)
                            return
                        }
                    } else {
                        logger.info('Adding req.headers.Authorization')
                        req.headers.Authorization = `Bearer ${req.session.passport.user.tokenset.access_token}`
                        return next()
                    }
                } catch (e) {
                    logger.log('refresh error =>', e)
                    next(e)
                }
            }
        }
        return res.redirect(AUTH.ROUTE.LOGIN)
    }

    public initializePassport() {
        this.router.use(passport.initialize())
    }

    public initializeSession() {
        this.router.use(passport.session())
    }

    public deserializeUser() {
        passport.deserializeUser((id, done) => {
            logger.info('oidc de-serializeUser', id)
            if (!this.listenerCount(AUTH.EVENT.DESERIALIZE_USER)) {
                done(null, id)
            } else {
                this.emit(AUTH.EVENT.DESERIALIZE_USER, id, done)
            }
        })
    }

    public serializeUser() {
        passport.serializeUser((user, done) => {
            logger.info('oidc serializeUser', user)
            if (!this.listenerCount(AUTH.EVENT.SERIALIZE_USER)) {
                done(null, user)
            } else {
                this.emit(AUTH.EVENT.SERIALIZE_USER, user, done)
            }
        })
    }
}

export default new OpenID()
