import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import {
    Client,
    ClientAuthMethod,
    Issuer,
    ResponseType,
    Strategy,
    TokenSet,
    UserinfoResponse,
    generators,
    custom,
    HttpOptions,
} from 'openid-client'
import passport from 'passport'
import { OIDC } from '../oidc.constants'
import { OpenIDMetadata } from './OpenIDMetadata.interface'
import { AUTH } from '../../auth.constants'
import { Strategy as AuthStrategy } from '../../models'
import { AuthOptions } from '../../models'
import { VERIFY_ERROR_MESSAGE_NO_ACCESS_ROLES } from '../../messaging.constants'
import { getLogger, XuiLogger } from '../../../common'
import { MySessionData } from '../../models/sessionData.interface'

export class OpenID extends AuthStrategy {
    protected issuer: Issuer<Client> | undefined
    protected client: Client | undefined

    constructor(
        router: Router = Router({ mergeParams: true }),
        logger: XuiLogger = getLogger('auth:oidc'),
        options: HttpOptions = {},
    ) {
        super(OIDC.STRATEGY_NAME, router, logger)
        this.setHttpOptionsDefaults(options)
    }

    /**
     * Helper function to customise GOT defaults and hooks to provide debug information
     * @param options
     */
    /* istanbul ignore next */
    public setHttpOptionsDefaults = (options: HttpOptions): void => {
        const defaults = {
            retry: 3,
            timeout: 15000,
            hooks: {
                beforeRequest: [
                    (options: any) => {
                        this.logger.log('--> %s %s', options.method.toUpperCase(), options.href)
                    },
                ],
                afterResponse: [
                    (response: any) => {
                        this.logger.log(
                            '<-- %i FROM %s %s',
                            response.statusCode,
                            response.request.gotOptions.method.toUpperCase(),
                            response.request.gotOptions.href,
                        )
                        return response
                    },
                ],
            },
        }
        const httpOptions = { ...defaults, ...options } as HttpOptions
        custom.setHttpOptionsDefaults(httpOptions)
    }

    public getOpenIDOptions = (authOptions: AuthOptions): OpenIDMetadata => {
        return {
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
        }
    }

    // TODO: this.client should be passed in
    // This function is hard to mock, come back to once we've mocked out easier prod code.
    /* istanbul ignore next */
    public keepAliveHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const reqsession = req.session as MySessionData

        if (!reqsession?.passport?.user) {
            return next()
        }

        if (req.isAuthenticated() && this.getClient()) {
            const userDetails = reqsession.passport.user
            const currentAccessToken = userDetails.tokenset.accessToken

            if (currentAccessToken) {
                try {
                    // TODO: ideally we need to introspect the tokens but currently unsupported in IDAM
                    if (this.isTokenExpired(currentAccessToken)) {
                        this.logger.log('token expired')

                        const tokenSet: TokenSet | undefined = await this.getClient()?.refresh(
                            reqsession.passport.user.tokenset.refreshToken,
                        )

                        reqsession.passport.user.tokenset = this.convertTokenSet(tokenSet)

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

        this.logger.log('discover metadata', metadata)

        return this.newIssuer(metadata)
    }

    public initialiseStrategy = async (authOptions: AuthOptions): Promise<void> => {
        this.logger.log('initialiseStrategy start')
        const options = this.getOpenIDOptions(authOptions)
        const strategy = await this.createNewStrategy(options)
        this.useStrategy(this.strategyName, strategy)
        this.logger.log('initialiseStrategy end')
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
    /* istanbul ignore next */
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
    /* istanbul ignore next */
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

    /**
     * The login route handler, will attempt to setup security state and nonce param and redirect user if not authenticated
     * @param req Request
     * @param res Response
     * @param next NextFunction
     */
    /* istanbul ignore next */
    public loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        this.logger.log('OIDC loginHandler Hit')

        const nonce = generators.nonce()
        const state = generators.state()
        const reqsession = req.session as MySessionData

        const promise = new Promise((resolve) => {
            if (req.session && this.options?.sessionKey) {
                reqsession[this.options?.sessionKey] = { state }
                this.logger.log('saving state in session')
                req.session.save(() => {
                    this.logger.log('state saved in session')
                    resolve(true)
                })
            } else {
                this.logger.warn('no session in request, state not saved')
                resolve(false)
            }
        })

        try {
            this.logger.log('waiting for session state to be saved')
            await promise
            this.logger.log('calling passport authenticate')
            return passport.authenticate(
                this.strategyName,
                {
                    redirect_uri: reqsession?.callbackURL,
                    nonce,
                    state,
                    keepSessionInfo: true,
                    failureMessage: true,
                } as any,
                (error: any, user: any, info: any) => {
                    this.logger.log('passport authenticate')

                    if (error) {
                        this.logger.error('loginHandler error: ', JSON.stringify(error))
                    }
                    /* istanbul ignore next */
                    if (info) {
                        this.logger.info('loginHandler info: ', JSON.stringify(info))
                    }
                    /* istanbul ignore next */
                    if (user) {
                        const message = 'loginHandler User details returned by passport authenticate'
                        this.logger.log(message)
                    }
                    if (!user) {
                        const message = 'loginHandler no User details returned by passport authenticate'
                        this.logger.log(message)
                    }
                },
            )(req, res, next)
        } catch (error) {
            this.logger.error('this should not throw an error')
            throw new Error(`this should not throw an ${error}`)
        }
    }
}

export const oidc = new OpenID()
