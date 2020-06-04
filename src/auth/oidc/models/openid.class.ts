import { NextFunction, Request, Response } from 'express'
import { Client, ClientAuthMethod, Issuer, ResponseType, Strategy, TokenSet, UserinfoResponse } from 'openid-client'
import passport from 'passport'
import { OIDC } from '../oidc.constants'
import { URL } from 'url'
import { OpenIDMetadata } from './OpenIDMetadata.interface'
import { AUTH } from '../../auth.constants'
import { Strategy as AuthStrategy } from '../../models'
import Joi from '@hapi/joi'
import { AuthOptions } from '../../models/authOptions.interface'

export class OpenID extends AuthStrategy {
    protected issuer: Issuer<Client> | undefined
    protected client: Client | undefined

    constructor() {
        super(OIDC.STRATEGY_NAME)
    }

    public getOpenIDOptions(authOptions: AuthOptions): OpenIDMetadata {
        return {
            /* eslint-disable @typescript-eslint/camelcase */
            client_id: authOptions.clientID,
            client_secret: authOptions.clientSecret,
            discovery_endpoint: authOptions.discoveryEndpoint,
            issuer_url: authOptions.issuerUrl,
            logout_url: authOptions.logoutUrl,
            redirect_uri: authOptions.callbackURL,
            response_types: authOptions.responseTypes as ResponseType[],
            scope: authOptions.scope,
            sessionKey: authOptions.sessionKey,
            token_endpoint_auth_method: authOptions.tokenEndpointAuthMethod as ClientAuthMethod,
            useRoutes: authOptions.useRoutes,
            /* eslint-enable @typescript-eslint/camelcase */
        }
    }

    public authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (req.isUnauthenticated()) {
            this.logger.log('unauthenticated, redirecting')
            return res.redirect(AUTH.ROUTE.LOGIN)
        }

        if (req.session && this.client) {
            const userDetails = req.session.passport.user
            const currentAccessToken = userDetails.tokenset.accessToken

            req.headers['user-roles'] = userDetails.userinfo.roles.join()

            if (currentAccessToken) {
                try {
                    // TODO: ideally we need to introspect the tokens but currently unsupported in IDAM
                    if (this.isTokenExpired(currentAccessToken)) {
                        this.logger.log('token expired')
                        req.session.passport.user.tokenset = await this.client.refresh(
                            req.session.passport.user.tokenset,
                        )
                        req.headers.Authorization = `Bearer ${req.session.passport.user.tokenset.accessToken}`
                        if (!this.listenerCount(AUTH.EVENT.AUTHENTICATE_SUCCESS)) {
                            this.logger.log(`refresh: no listener count: ${AUTH.EVENT.AUTHENTICATE_SUCCESS}`)
                            return next()
                        } else {
                            this.emit(AUTH.EVENT.AUTHENTICATE_SUCCESS, true, req, res, next)
                            return
                        }
                    } else {
                        logger.info('Adding req.headers.Authorization')
                        req.headers.Authorization = `Bearer ${req.session.passport.user.tokenset.accessToken}`
                        return next()
                    }
                } catch (e) {
                    this.logger.error('refresh error =>', e)
                    next(e)
                }
            }
        }
        return res.redirect(AUTH.ROUTE.LOGIN)
    }

    public discover = async (): Promise<Issuer<Client>> => {
        this.logger.log(`discovering endpoint: ${this.options.discoveryEndpoint}`)
        const issuer = await Issuer.discover(`${this.options.discoveryEndpoint}`)

        const metadata = issuer.metadata
        metadata.issuer = this.options.issuerUrl

        this.logger.log('metadata', metadata)

        return new Issuer(metadata)
    }

    public initialiseStrategy = async (authOptions: AuthOptions): Promise<void> => {
        const options = this.getOpenIDOptions(authOptions)
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

    public validateOptions(options: OpenIDMetadata): void {
        /* eslint-disable @typescript-eslint/camelcase */
        const schema = Joi.object({
            client_id: Joi.string().required(),
            client_secret: Joi.string().required(),
            discovery_endpoint: Joi.string().required(),
            issuer_url: Joi.string().required(),
            logout_url: Joi.string().required(),
            redirect_uri: Joi.string().required(),
            response_types: Joi.array().required().min(1),
            scope: Joi.string().required(),
            sessionKey: Joi.string().required(),
            token_endpoint_auth_method: Joi.string().required(),
            useRoutes: Joi.bool().optional(),
        })
        /* eslint-enable @typescript-eslint/camelcase */
        const { error } = schema.validate(options)
        if (error) {
            throw error
        }
    }

    public verify = (tokenset: TokenSet, userinfo: UserinfoResponse, done: (err: any, user?: any) => void): void => {
        /*if (!propsExist(userinfo, ['roles'])) {
            this.logger.warn('User does not have any access roles.')
            return done(null, false, {message: 'User does not have any access roles.'})
        }*/
        this.logger.info('verify okay, user:', userinfo)

        const userTokenSet = {
            accessToken: tokenset.accessToken,
            refreshToken: tokenset.refresh_token,
            idToken: tokenset.id_token,
        }
        return done(null, { tokenset: { ...tokenset, ...userTokenSet }, userinfo })
    }
}

export default new OpenID()
