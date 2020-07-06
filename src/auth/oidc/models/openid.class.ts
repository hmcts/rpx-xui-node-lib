import { NextFunction, Request, Response, Router } from 'express'
import { Client, ClientAuthMethod, Issuer, ResponseType, Strategy, TokenSet, UserinfoResponse } from 'openid-client'
import passport from 'passport'
import { OIDC } from '../oidc.constants'
import { OpenIDMetadata } from './OpenIDMetadata.interface'
import { AUTH } from '../../auth.constants'
import { Strategy as AuthStrategy } from '../../models'
import { AuthOptions } from '../../models'
import { VERIFY_ERROR_MESSAGE_NO_ACCESS_ROLES } from '../../messaging.constants'
import { logger as debugLogger } from '../../../common/util'

export class OpenID extends AuthStrategy {
    protected issuer: Issuer<Client> | undefined
    protected client: Client | undefined

    constructor(router: Router = Router({ mergeParams: true }), logger: typeof debugLogger = debugLogger) {
        super(OIDC.STRATEGY_NAME, router, logger)
    }

    public getOpenIDOptions = (authOptions: AuthOptions): OpenIDMetadata => {
        return {
            /* eslint-disable @typescript-eslint/camelcase */
            client_id: authOptions.clientID,
            client_secret: authOptions.clientSecret,
            discovery_endpoint: authOptions.discoveryEndpoint,
            issuer_url: authOptions.issuerURL,
            logout_url: authOptions.logoutURL,
            response_types: authOptions.responseTypes as ResponseType[],
            scope: authOptions.scope,
            sessionKey: authOptions.sessionKey,
            token_endpoint_auth_method: authOptions.tokenEndpointAuthMethod as ClientAuthMethod,
            useRoutes: authOptions.useRoutes,
            /* eslint-enable @typescript-eslint/camelcase */
        }
    }

    // TODO: this.client should be passed in
    // This function is hard to mock, come back to once we've mocked out easier prod code.
    public keepAliveHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.session?.passport?.user) {
            return next()
        }

        if (req.isAuthenticated() && this.getClient()) {
            const userDetails = req.session.passport.user
            const currentAccessToken = userDetails.tokenset.accessToken

            if (currentAccessToken) {
                try {
                    // TODO: ideally we need to introspect the tokens but currently unsupported in IDAM
                    if (this.isTokenExpired(currentAccessToken)) {
                        this.logger.log('token expired')

                        const tokenSet: TokenSet | undefined = await this.getClient()?.refresh(
                            req.session.passport.user.tokenset.refreshToken,
                        )

                        req.session.passport.user.tokenset = this.convertTokenSet(tokenSet)

                        if (!this.listenerCount(AUTH.EVENT.AUTHENTICATE_SUCCESS)) {
                            this.logger.log(`refresh: no listener count: ${AUTH.EVENT.AUTHENTICATE_SUCCESS}`)
                            return next()
                        } else {
                            req.isRefresh = true
                            this.emit(AUTH.EVENT.AUTHENTICATE_SUCCESS, req, res, next)
                            return
                        }
                    }
                } catch (e) {
                    this.logger.error('refresh error => ', e)
                    next(e)
                }
            }
        }
        next()
    }

    public discover = async (): Promise<Issuer<Client>> => {
        this.logger.log(`discovering endpoint: ${this.options.discoveryEndpoint}`)
        const issuer = await this.discoverIssuer()

        const metadata = issuer.metadata
        metadata.issuer = this.options.issuerURL

        this.logger.log('metadata', metadata)

        return this.newIssuer(metadata)
    }

    public initialiseStrategy = async (authOptions: AuthOptions): Promise<void> => {
        const options = this.getOpenIDOptions(authOptions)
        const strategy = await this.createNewStrategy(options)
        this.useStrategy(this.strategyName, strategy)
    }

    public convertTokenSet = (tokenset: TokenSet | undefined): any => {
        return {
            accessToken: tokenset?.access_token,
            refreshToken: tokenset?.refresh_token,
            idToken: tokenset?.id_token,
        }
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

        return done(null, { tokenset: this.convertTokenSet(tokenset), userinfo })
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
        this.issuer = await this.discover()
        if (!this.issuer) {
            throw new Error('auto discovery failed')
        }
        this.client = this.getClientFromIssuer(this.issuer, options)
        if (!this.client) {
            throw new Error('client not initialised')
        }
        return this.getNewStrategy(options, this.client)
    }

    public getNewStrategy = (options: OpenIDMetadata, client: Client): Strategy<any, Client> => {
        return new Strategy(
            {
                client,
                params: {
                    prompt: OIDC.PROMPT,
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

export const oidc = new OpenID()
