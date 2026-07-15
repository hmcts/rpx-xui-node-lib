import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import type {
    ClientAuth,
    Configuration,
    IntrospectionResponse,
    TokenEndpointResponse,
    TokenEndpointResponseHelpers,
    UserInfoResponse,
} from 'openid-client'
import passport from 'passport'
import type { Strategy as PassportStrategy } from 'passport'
import { randomBytes } from 'crypto'
import { OIDC } from '../oidc.constants'
import { OpenIDMetadata } from './OpenIDMetadata.interface'
import { AUTH } from '../../auth.constants'
import { Strategy as AuthStrategy } from '../../models'
import { AuthOptions } from '../../models'
import { VERIFY_ERROR_MESSAGE_NO_ACCESS_ROLES } from '../../messaging.constants'
import { getLogger, XuiLogger } from '../../../common'
import { MySessionData } from '../../models/sessionData.interface'

export interface HttpOptions {
    retry?: number
    timeout?: number
    [key: string]: unknown
}

export type TokenSet = TokenEndpointResponse & TokenEndpointResponseHelpers

interface OpenIDPassportModule {
    Strategy: new (options: any, verify: any) => PassportStrategy & {
        authorizationRequestParams: (req: Request, options: any) => URLSearchParams | Record<string, string> | undefined
    }
}

export class OpenID extends AuthStrategy {
    protected client: Configuration | undefined
    private httpOptions: HttpOptions

    constructor(
        router: Router = Router({ mergeParams: true }),
        logger: XuiLogger = getLogger('auth:oidc'),
        options: HttpOptions = {},
    ) {
        super(OIDC.STRATEGY_NAME, router, logger)
        this.httpOptions = options
        this.setHttpOptionsDefaults(options)
    }

    /**
     * Helper function to customise GOT defaults and hooks to provide debug information
     * @param options
     */
    /* istanbul ignore next */
    public setHttpOptionsDefaults = (options: HttpOptions): void => {
        this.httpOptions = { retry: 3, timeout: 15000, ...options }
    }

    /** Preserve native ESM imports when this library is compiled to CommonJS. */
    public loadOpenIdClient = (): Promise<typeof import('openid-client')> => {
        return Function('specifier', 'return import(specifier)')('openid-client')
    }

    /** Preserve native ESM imports when this library is compiled to CommonJS. */
    public loadOpenIdPassport = (): Promise<OpenIDPassportModule> => {
        return Function('specifier', 'return import(specifier)')('openid-client/passport')
    }

    public getOpenIDOptions = (authOptions: AuthOptions, discoveryOptions: any): OpenIDMetadata => {
        return {
            client_id: authOptions.clientID,
            client_secret: authOptions.clientSecret,
            discovery_endpoint: authOptions.discoveryEndpoint,
            issuer_url: discoveryOptions.issuer,
            logout_url: authOptions.logoutURL,
            response_types: authOptions.responseTypes,
            scope: authOptions.scope,
            sessionKey: authOptions.sessionKey,
            token_endpoint_auth_method: authOptions.tokenEndpointAuthMethod,
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
            const client = this.getClient()
            const canIntrospect = Boolean(client?.serverMetadata().introspection_endpoint)

            if (currentAccessToken) {
                try {
                    let tokenExpiredOrInvalid = this.isTokenExpired(currentAccessToken)

                    if (canIntrospect) {
                        const now = Math.floor(Date.now() / 1000)
                        const introspection = await this.introspect(currentAccessToken)
                        tokenExpiredOrInvalid = !introspection?.active || !introspection?.exp || introspection.exp <= now
                    }

                    if (tokenExpiredOrInvalid) {
                        this.logger.log('token expired or inactive')

                        const tokenSet = await this.refresh(reqsession.passport.user.tokenset.refreshToken)

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

    public discover = async (): Promise<Configuration> => {
        this.logger.info(`discovering endpoint: ${this.options.discoveryEndpoint}`)
        const client = await this.discoverIssuer()
        this.logger.log('discover metadata', client.serverMetadata())
        return client
    }

    public initialiseStrategy = async (authOptions: AuthOptions): Promise<void> => {
        this.logger.log('initialiseStrategy start')
        const strategy = await this.createNewStrategy(authOptions)
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

    public verify = async (
        tokenset: TokenSet,
        done: (err: any, user?: any, message?: any) => void,
    ): Promise<void> => {
        try {
            const userinfo = await this.getUserInfo(tokenset)
            this.verifyUserInfo(tokenset, userinfo, done)
        } catch (error) {
            done(error)
        }
    }

    public verifyUserInfo = (
        tokenset: TokenSet,
        userinfo: UserInfoResponse,
        done: (err: any, user?: any, message?: any) => void,
    ): void => {
        if (!userinfo?.roles) {
            this.logger.warn(VERIFY_ERROR_MESSAGE_NO_ACCESS_ROLES)
            return done(null, false, { message: VERIFY_ERROR_MESSAGE_NO_ACCESS_ROLES })
        }
        const allowedKeys = ['ssoProvider', 'uid', 'identity', 'roles', 'iss']
        const filteredUserinfo = Object.fromEntries(
            Object.entries(userinfo).filter(([key]) => allowedKeys.includes(key))
        )
        this.logger.info('verify okay, user:', filteredUserinfo)

        return done(null, { tokenset: this.convertTokenSet(tokenset), userinfo })
    }

    public getUserInfo = async (tokenset: TokenSet): Promise<UserInfoResponse> => {
        if (!this.client || !tokenset.access_token) {
            throw new Error('client or access token not initialised')
        }
        const subject = tokenset.claims()?.sub
        if (!subject) {
            throw new Error('ID token subject not available')
        }
        const openid = await this.loadOpenIdClient()
        return openid.fetchUserInfo(this.client, tokenset.access_token, subject)
    }

    public discoverIssuer = async (): Promise<Configuration> => {
        const openid = await this.loadOpenIdClient()
        const authMethod = this.getClientAuth(openid)
        const client = await openid.discovery(
            new URL(this.options.discoveryEndpoint),
            this.options.clientID,
            {
                client_secret: this.options.clientSecret,
                response_types: this.options.responseTypes,
                token_endpoint_auth_method: this.options.tokenEndpointAuthMethod,
            },
            authMethod,
            { timeout: Math.ceil((this.httpOptions.timeout ?? 15000) / 1000) },
        )
        return client
    }

    private getClientAuth = (openid: typeof import('openid-client')): ClientAuth | undefined => {
        switch (this.options.tokenEndpointAuthMethod) {
            case 'client_secret_basic':
                return openid.ClientSecretBasic(this.options.clientSecret)
            case 'client_secret_post':
                return openid.ClientSecretPost(this.options.clientSecret)
            case 'client_secret_jwt':
                return openid.ClientSecretJwt(this.options.clientSecret)
            case 'none':
                return openid.None()
            default:
                return undefined
        }
    }

    public introspect = async (accessToken: string): Promise<IntrospectionResponse> => {
        if (!this.client) throw new Error('client not initialised')
        const openid = await this.loadOpenIdClient()
        return openid.tokenIntrospection(this.client, accessToken)
    }

    public refresh = async (refreshToken: string): Promise<TokenSet> => {
        if (!this.client) throw new Error('client not initialised')
        const openid = await this.loadOpenIdClient()
        return openid.refreshTokenGrant(this.client, refreshToken)
    }

    public useStrategy = (strategyName: string, strategy: PassportStrategy): void => {
        passport.use(strategyName, strategy)
    }

    // TODO: Don't throw errors from inside functions as it's side effecting,
    // get the function to return and throw the error in the caller function.
    // Why? - this makes the function more pure, and allows it to be easily testable.
    /* istanbul ignore next */
    public createNewStrategy = async (authOptions: AuthOptions): Promise<PassportStrategy> => {
        this.client = await this.discover()
        if (!this.client) {
            throw new Error('auto discovery failed')
        }
        const options = this.getOpenIDOptions(authOptions, this.client.serverMetadata())
        this.logger.log('initialiseStrategy options', options)
        return this.getNewStrategy(options, this.client)
    }
    /* istanbul ignore next */
    public getNewStrategy = async (options: OpenIDMetadata, client: Configuration): Promise<PassportStrategy> => {
        const { Strategy } = await this.loadOpenIdPassport()
        const strategy = new Strategy(
            {
                config: client,
                name: this.strategyName,
                scope: options.scope,
                sessionKey: options.sessionKey,
            },
            this.verify,
        )
        const authorizationRequestParams = strategy.authorizationRequestParams.bind(strategy)
        strategy.authorizationRequestParams = (req, authenticateOptions) => {
            const params = new URLSearchParams(authorizationRequestParams(req, authenticateOptions))
            const supplied = authenticateOptions as any
            params.set('prompt', OIDC.PROMPT)
            if (supplied.nonce) params.set('nonce', supplied.nonce)
            if (supplied.state) params.set('state', supplied.state)
            return params
        }
        const authenticate = strategy.authenticate
        strategy.authenticate = function (req: Request, authenticateOptions: any): void {
            const callbackURL = authenticateOptions?.redirect_uri
            authenticate.call(this, req, callbackURL ? { ...authenticateOptions, callbackURL } : authenticateOptions)
        }
        return strategy
    }

    public getClient = (): Configuration | undefined => {
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

        const nonce = randomBytes(32).toString('base64url')
        const state = randomBytes(32).toString('base64url')
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
            const loginHint = this.getLoginHint(req)
            return passport.authenticate(
                this.strategyName,
                {
                    redirect_uri: reqsession?.callbackURL,
                    nonce,
                    state,
                    ...(loginHint ? { login_hint: loginHint } : {}),
                    keepSessionInfo: false,
                    failureMessage: true,
                } as any,
                (error: any, user: any, info: any) => {
                    this.logger.log('passport authenticate')

                    if (error) {
                        this.logger.error('loginHandler error: ', JSON.stringify(error, this.redactingLogReplacer))
                    }
                    /* istanbul ignore next */
                    if (info) {
                        this.logger.info('loginHandler info: ', JSON.stringify(info, this.redactingLogReplacer))
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
