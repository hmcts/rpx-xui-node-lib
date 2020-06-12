import { NextFunction, Request, Response, Router } from 'express'
import { Client, ClientAuthMethod, Issuer, ResponseType, Strategy, TokenSet, UserinfoResponse } from 'openid-client'
import passport from 'passport'
import { OIDC } from '../oidc.constants'
import { URL } from 'url'
import { OpenIDMetadata } from './OpenIDMetadata.interface'
import { AUTH } from '../../auth.constants'
import { Strategy as AuthStrategy } from '../../models'
import { AuthOptions } from '../../models/authOptions.interface'
import { VERIFY_ERROR_MESSAGE_NO_ACCESS_ROLES } from '../../messaging.constants'

export class OpenID extends AuthStrategy {
    protected issuer: Issuer<Client> | undefined
    protected client: Client | undefined

    constructor(router = Router({ mergeParams: true })) {
        super(OIDC.STRATEGY_NAME, router)
    }

    public getOpenIDOptions = (authOptions: AuthOptions): OpenIDMetadata => {
        return {
            /* eslint-disable @typescript-eslint/camelcase */
            client_id: authOptions.clientID,
            client_secret: authOptions.clientSecret,
            discovery_endpoint: authOptions.discoveryEndpoint,
            issuer_url: authOptions.issuerURL,
            logout_url: authOptions.logoutURL,
            redirect_uri: authOptions.callbackURL,
            response_types: authOptions.responseTypes as ResponseType[],
            scope: authOptions.scope,
            sessionKey: authOptions.sessionKey,
            token_endpoint_auth_method: authOptions.tokenEndpointAuthMethod as ClientAuthMethod,
            useRoutes: authOptions.useRoutes,
            /* eslint-enable @typescript-eslint/camelcase */
        }
    }

    public makeAuthorization = (passport: any) => `Bearer ${passport.user.tokenset.accessToken}`

    // TODO: this.client should be passed in
    // This function is hard to mock, come back to once we've mocked out easier prod code.
    public authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (req.isUnauthenticated()) {
            this.logger.log('unauthenticated, redirecting')
            return res.redirect(AUTH.ROUTE.LOGIN)
        }

        if (req.session && this.getClient()) {
            const userDetails = req.session.passport.user
            const currentAccessToken = userDetails.tokenset.accessToken

            req.headers['user-roles'] = userDetails.userinfo.roles.join()

            if (currentAccessToken) {
                try {
                    // TODO: ideally we need to introspect the tokens but currently unsupported in IDAM
                    if (this.isTokenExpired(currentAccessToken)) {
                        this.logger.log('token expired')

                        req.session.passport.user.tokenset = await this.client?.refresh(
                            req.session.passport.user.tokenset,
                        )
                        req.headers.Authorization = this.makeAuthorization(req.session.passport)

                        if (!this.listenerCount(AUTH.EVENT.AUTHENTICATE_SUCCESS)) {
                            this.logger.log(`refresh: no listener count: ${AUTH.EVENT.AUTHENTICATE_SUCCESS}`)
                            return next()
                        } else {
                            this.emit(AUTH.EVENT.AUTHENTICATE_SUCCESS, true, req, res, next)
                            return
                        }
                    } else {
                        this.logger.info('Adding req.headers.Authorization')
                        req.headers.Authorization = this.makeAuthorization(req.session.passport)
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
        const issuer = await this.discoverIssuer()

        const metadata = issuer.metadata
        metadata.issuer = this.options.issuerURL

        this.logger.log('metadata', metadata)

        const newIssuer = this.newIssuer(metadata)
        return newIssuer
    }

    public initialiseStrategy = async (authOptions: AuthOptions): Promise<void> => {
        const options = this.getOpenIDOptions(authOptions)
        const strategy = await this.createNewStrategy(options)
        this.useStrategy(this.strategyName, strategy)
    }

    public verify = (
        tokenset: TokenSet,
        userinfo: UserinfoResponse,
        done: (err: any, user?: any, message?: any) => void,
    ): void => {
        if (!userinfo?.roles) {
            this.logger.warn(VERIFY_ERROR_MESSAGE_NO_ACCESS_ROLES)
            return done(null, false, { message: VERIFY_ERROR_MESSAGE_NO_ACCESS_ROLES })
        }
        this.logger.info('verify okay, user:', userinfo)

        const userTokenSet = {
            accessToken: tokenset.access_token,
            refreshToken: tokenset.refresh_token,
            idToken: tokenset.id_token,
        }
        return done(null, { tokenset: { ...tokenset, ...userTokenSet }, userinfo })
    }

    public discoverIssuer = async (): Promise<any> => {
        return await Issuer.discover(`${this.options.discoveryEndpoint}`)
    }

    public newIssuer = (metadata: any): Issuer<Client> => {
        this.logger.log('newIssuer')
        return new Issuer(metadata)
    }

    public useStrategy = (strategyName: string, strategy: Strategy<any, any>): void => {
        passport.use(strategyName, strategy)
    }

    // TODO: Don't throw errors from inside functions as it's side effecting,
    // get the function to return and throw the error in the caller function.
    // Why? - this makes the function more pure, and allows it to be easily testable.
    public createNewStrategy = async (options: OpenIDMetadata): Promise<Strategy<any, any>> => {
        const redirectUri = new URL(AUTH.ROUTE.OAUTH_CALLBACK, options.redirect_uri)
        this.issuer = await this.discover()
        if (!this.issuer) {
            throw new Error('auto discovery failed')
        }
        this.client = this.getClientFromIssuer(this.issuer, options)
        if (!this.client) {
            throw new Error('client not initialised')
        }
        return this.getNewStrategy(redirectUri, options, this.client)
    }

    public getNewStrategy = (redirectUri: URL, options: OpenIDMetadata, client: Client): Strategy<any, Client> => {
        return new Strategy(
            {
                client,
                params: {
                    prompt: OIDC.PROMPT,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    redirect_uri: redirectUri.toString(),
                    scope: options.scope,
                },
                sessionKey: options.sessionKey,
            },
            this.verify,
        )
    }

    public getClientFromIssuer = (issuer: Issuer<Client>, options: OpenIDMetadata): Client | undefined => {
        return new issuer.Client(options)
    }

    public getClient = (): Client | undefined => {
        return this.client
    }
}

export default new OpenID()
