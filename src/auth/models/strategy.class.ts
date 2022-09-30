import * as events from 'events'
import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import passport from 'passport'
import { AUTH } from '../auth.constants'
import jwtDecode from 'jwt-decode'
import { arrayPatternMatch, http, XuiLogger, getLogger } from '../../common'
import { AuthOptions } from './authOptions.interface'
import Joi from '@hapi/joi'
import * as URL from 'url'
import { generators } from 'openid-client'
import csrf from 'csurf'

export abstract class Strategy extends events.EventEmitter {
    public readonly strategyName: string

    protected readonly router: Router

    protected readonly logger: XuiLogger

    protected options: AuthOptions = {
        authorizationURL: '',
        tokenURL: '',
        clientID: '',
        clientSecret: '',
        callbackURL: '',
        scope: '',
        logoutURL: '',
        useRoutes: true,
        sessionKey: '',
        //openID options
        discoveryEndpoint: '',
        issuerURL: '',
        responseTypes: [''],
        tokenEndpointAuthMethod: '',
        allowRolesRegex: '.',
        useCSRF: true,
        routeCredential: undefined,
    }

    protected constructor(strategyName: string, router: Router, logger: XuiLogger = getLogger('auth:strategy')) {
        super()
        this.strategyName = strategyName
        this.router = router
        this.logger = logger
    }

    public validateOptions(options: any): boolean {
        const schema = Joi.object({
            authorizationURL: Joi.string().required(),
            tokenURL: Joi.string().required(),
            clientID: Joi.string().required(),
            clientSecret: Joi.string().required(),
            callbackURL: Joi.string().required(),
            discoveryEndpoint: Joi.string(),
            issuerURL: Joi.string(),
            logoutURL: Joi.string().required(),
            scope: Joi.string().required(),
            scopeSeparator: Joi.any(),
            sessionKey: Joi.any(),
            useRoutes: Joi.bool(),
            skipUserProfile: Joi.any(),
            responseTypes: Joi.array(),
            tokenEndpointAuthMethod: Joi.string(),
            pkce: Joi.any(),
            proxy: Joi.any(),
            store: Joi.any(),
            state: Joi.any(),
            customHeaders: Joi.any(),
            allowRolesRegex: Joi.string(),
            useCSRF: Joi.bool(),
            routeCredential: Joi.any(),
        })
        const { error } = schema.validate(options)
        if (error) {
            throw error
        }
        return true
    }

    public initialiseStrategy = async (options: any): Promise<void> => {
        this.options = options
    }

    /**
     * The login route handler, will attempt to setup security state param and redirect user if not authenticated
     * @param req Request
     * @param res Response
     * @param next NextFunction
     */
    public loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        this.logger.log('Base loginHandler Hit')

        // we are using oidc generator but it's just a helper, rather than installing another library to provide this
        const state = generators.state()

        const promise = new Promise((resolve) => {
            if (req.session && this.options?.sessionKey) {
                req.session[this.options?.sessionKey] = { state }
                req.session.save(() => {
                    this.logger.log('resolved promise, state saved')
                    resolve(true)
                })
            } else {
                this.logger.warn('resolved promise, state not saved')
                resolve(false)
            }
        })

        await promise

        this.logger.log('calling passport authenticate')

        return passport.authenticate(this.strategyName, {
            // eslint-disable-next-line @typescript-eslint/camelcase
            redirect_uri: req.session?.callbackURL,
            state,
        } as any)(req, res, next)
    }

    public setCallbackURL = (req: Request, _res: Response, next: NextFunction): void => {
        /* istanbul ignore else */
        if (req.session && !req.session.callbackURL) {
            req.app.set('trust proxy', true)
            req.session.callbackURL = URL.format({
                protocol: req.protocol,
                host: req.get('host'),
                pathname: this.options.callbackURL,
            })
        }
        next()
    }

    public logout = async (req: Request, res: Response): Promise<void> => {
        try {
            this.logger.log('logout start')
            const { accessToken, refreshToken } = req.session?.passport.user.tokenset

            const auth = this.getAuthorization(this.options.clientID, this.options.clientSecret)

            await http.delete(this.urlFromToken(this.options.logoutURL, accessToken), {
                headers: {
                    Authorization: auth,
                },
            })
            await http.delete(this.urlFromToken(this.options.logoutURL, refreshToken), {
                headers: {
                    Authorization: auth,
                },
            })

            //passport provides this method on request object
            req.logout()
            await this.destroySession(req)

            if (req.query.noredirect) {
                res.status(200).send({ message: 'You have been logged out!' })
                return Promise.resolve()
            }

            const redirect = req.query.redirect ? req.query.redirect : AUTH.ROUTE.LOGIN
            this.logger.log('redirecting to => ', redirect)
            // 401 is when no accessToken
            res.redirect(redirect as string)
        } catch (e) {
            this.logger.error('error => ', e)
            res.status(401).redirect(AUTH.ROUTE.DEFAULT_REDIRECT)
        }
        this.logger.log('logout end')
    }

    public authRouteHandler = (req: Request, res: Response): Response => {
        return res.send(req.isAuthenticated())
    }

    public destroySession = async (req: Request): Promise<any> => {
        return new Promise((resolve, reject) => {
            req.session?.destroy((err) => {
                if (err) {
                    reject(err)
                }
                this.logger.log('session destroyed')
                resolve(true)
            })
        })
    }

    public keepAliveHandler = (_req: Request, _res: Response, next: NextFunction): void => {
        next()
    }

    public configure = (options: AuthOptions): RequestHandler => {
        const configuredOptions = { ...this.options, ...options }
        this.validateOptions(configuredOptions)
        this.options = configuredOptions

        this.serializeUser()
        this.deserializeUser()
        ;(async () => {
            await this.initialiseStrategy(this.options)
        })()

        this.initializePassport()
        this.initializeSession()
        this.initializeKeepAlive()
        this.initialiseCSRF()

        if (options.useRoutes) {
            this.router.get(AUTH.ROUTE.DEFAULT_AUTH_ROUTE, this.authRouteHandler)
            this.router.get(AUTH.ROUTE.KEEPALIVE_ROUTE, this.authRouteHandler)
            this.router.get(AUTH.ROUTE.LOGIN, this.setCallbackURL, this.loginHandler)
            this.router.get(AUTH.ROUTE.OAUTH_CALLBACK, this.callbackHandler)
            this.router.get(AUTH.ROUTE.LOGOUT, this.logout)
        }
        this.addHeaders()
        this.emit(`${this.strategyName}.bootstrap.success`)
        return this.router
    }

    public callbackHandler = (req: Request, res: Response, next: NextFunction): void => {
        const INVALID_STATE_ERROR = 'Invalid authorization request state.'

        const emitAuthenticationFailure = (logMessages: string[]): void => {
            if (!logMessages.length) return

            res.locals.message = logMessages.join('\n')
            this.emit(AUTH.EVENT.AUTHENTICATE_FAILURE, req, res, next)
        }

        passport.authenticate(
            this.strategyName,
            {
                // eslint-disable-next-line @typescript-eslint/camelcase
                redirect_uri: req.session?.callbackURL,
            } as any,
            (error, user, info) => {
                const errorMessages: string[] = []
                this.logger.log('inside passport authenticate')

                if (error) {
                    errorMessages.push(error)
                    this.logger.error(error)
                }

                if (info) {
                    if (info.message === INVALID_STATE_ERROR) {
                        errorMessages.push(INVALID_STATE_ERROR)
                    }

                    this.logger.info(info)
                }

                if (!user) {
                    const message = 'No user details returned by the authentication service, redirecting to login'
                    errorMessages.push(message)
                    this.logger.log(message)

                    emitAuthenticationFailure(errorMessages)
                    return res.redirect(AUTH.ROUTE.LOGIN)
                }

                emitAuthenticationFailure(errorMessages)
                this.verifyLogin(req, user, next, res)
            },
        )(req, res, next)
    }

    public isTokenExpired = (token: string): boolean => {
        const jwtData = jwtDecode<any>(token)
        return this.jwTokenExpired(jwtData)
    }

    public authenticate = (req: Request, _res: Response, next: NextFunction): void => {
        if (req.isUnauthenticated()) {
            this.logger.log('unauthenticated')
        }
        next()
    }

    public makeAuthorization = (passport: any) => `Bearer ${passport.user.tokenset.accessToken}`

    public setHeaders = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        if (req.session?.passport?.user) {
            if (this.isRouteCredentialNeeded(req.path, this.options)) {
                await this.setCredentialToken(req)
            } else {
                req.headers['user-roles'] = req.session.passport.user.userinfo.roles.join()
                req.headers.Authorization = this.makeAuthorization(req.session.passport)
            }
        }
        next()
    }

    public isRouteCredentialNeeded = (url: string, options: AuthOptions): boolean | undefined => {
        return options.routeCredential && options.routeCredential.routes && options.routeCredential.routes.includes(url)
    }

    public setCredentialToken = async (req: Request) => {
        let routeCredentialToken
        const cachedToken = req.app.get('routeCredentialToken')
        if (cachedToken && cachedToken.access_token && !this.isTokenExpired(cachedToken.access_token)) {
            this.logger.log('using cached routeCredentialToken')
            routeCredentialToken = cachedToken
        } else {
            routeCredentialToken = await this.generateToken()
            this.logger.log('using new routeCredentialToken')
            req.app.set('routeCredentialToken', routeCredentialToken)
        }
        if (routeCredentialToken && routeCredentialToken.access_token) {
            req.headers.Authorization = `Bearer ${routeCredentialToken.access_token}`
        }
    }

    public generateToken = async (): Promise<any | undefined> => {
        const url = this.getUrlFromOptions(this.options)
        try {
            const axiosConfig = {
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
            }

            const body = this.getRequestBody(this.options)
            const response = await http.post(url, body, axiosConfig)
            return response.data
        } catch (error) {
            this.logger.error('error generating authentication token => ', error)
        }
    }

    public verifyLogin = (req: Request, user: any, next: NextFunction, res: Response): void => {
        req.logIn(user, (err) => {
            const roles = user.userinfo.roles
            if (err) {
                return next(err)
            }
            if (this.options.allowRolesRegex && !arrayPatternMatch(roles, this.options.allowRolesRegex)) {
                this.logger.error(
                    `User has no application access, as they do not have a ${this.options.allowRolesRegex} role.`,
                )
                return this.logout(req, res)
            }
            if (!this.listenerCount(AUTH.EVENT.AUTHENTICATE_SUCCESS)) {
                this.logger.log(`redirecting, no listener count: ${AUTH.EVENT.AUTHENTICATE_SUCCESS}`)
                res.redirect(AUTH.ROUTE.DEFAULT_REDIRECT)
            } else {
                req.isRefresh = false
                this.emit(AUTH.EVENT.AUTHENTICATE_SUCCESS, req, res, next)
            }
        })
    }

    public initializePassport = (): void => {
        this.router.use(passport.initialize())
    }

    public initializeSession = (): void => {
        this.router.use(passport.session())
    }

    public initializeKeepAlive = (): void => {
        this.router.use(this.keepAliveHandler)
    }

    /**
     * helper method to store csrf token into session
     */
    public initialiseCSRF = (): void => {
        if (this.options.useCSRF) {
            this.logger.log('initialising CSRF middleware')

            const csrfProtection = csrf({
                value: this.getCSRFValue,
            })

            this.router.use(csrfProtection, (req, res, next) => {
                res.cookie('XSRF-TOKEN', req.csrfToken())
                next()
            })
        }
    }

    /**
     * retrieve the csrf token value, lastly from sent cookies
     * @param req
     * @return string
     */
    public getCSRFValue = (req: Request): string => {
        return (
            (req.body && req.body._csrf) ||
            (req.query && req.query._csrf) ||
            req.headers['csrf-token'] ||
            req.headers['xsrf-token'] ||
            req.headers['x-csrf-token'] ||
            req.headers['x-xsrf-token'] ||
            req.cookies['XSRF-TOKEN']
        )
    }

    public addHeaders = (): void => {
        this.router.use(this.setHeaders)
    }

    public serializeUser = (): void => {
        passport.serializeUser((user, done) => {
            this.logger.log(`${this.strategyName} serializeUser`)
            this.emitIfListenersExist(AUTH.EVENT.SERIALIZE_USER, user, done)
        })
    }

    public deserializeUser = (): void => {
        passport.deserializeUser((id, done) => {
            this.logger.log(`${this.strategyName} deserializeUser`)
            this.emitIfListenersExist(AUTH.EVENT.DESERIALIZE_USER, id, done)
        })
    }

    public jwTokenExpired = (jwtData: any): boolean => {
        const expires = new Date(jwtData.exp * 1000).getTime()
        const now = new Date().getTime()
        return expires < now
    }

    /**
     * Get session URL
     * @return {string}
     */
    public urlFromToken = (url: string, token: any): string => {
        return `${url}/session/${token}`
    }

    /**
     * Get authorization from ClientID and secret
     * @return {string}
     */
    public getAuthorization = (clientID: string, clientSecret: string, encoding = 'base64'): string => {
        return `Basic ${Buffer.from(`${clientID}:${clientSecret}`).toString(encoding)}`
    }

    /**
     * Get all the events that this strategy emits
     * @return {string[]} - ['auth.authenticate.success']
     */
    public getEvents = (): string[] => {
        return Object.values<string>(AUTH.EVENT)
    }

    /**
     * emit Events if any subscriptions available
     */
    public emitIfListenersExist = (
        eventName: string,
        eventObject: unknown,
        done: (err: any, id?: unknown) => void,
    ): void => {
        if (!this.listenerCount(eventName)) {
            done(null, eventObject)
        } else {
            this.emit(eventName, eventObject, done)
        }
    }

    public getRequestBody = (options: AuthOptions): string => {
        if (options.routeCredential) {
            const userName = options.routeCredential.userName
            const userPassword = encodeURIComponent(options.routeCredential.password)
            const scope = options.routeCredential?.scope
            const clientSecret = options.clientSecret
            const idamClient = options.clientID
            return `grant_type=password&password=${userPassword}&username=${userName}&scope=${scope}&client_id=${idamClient}&client_secret=${clientSecret}`
        }
        throw new Error('options.routeCredential missing values')
    }

    public getUrlFromOptions = (options: AuthOptions): string => {
        if (options.routeCredential) {
            return `${options.logoutURL}/o/token`
        }
        throw new Error('missing routeCredential in options')
    }
}
