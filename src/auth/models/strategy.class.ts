import * as events from 'events'
import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import passport, { LogOutOptions } from 'passport'
import { AUTH } from '../auth.constants'
import jwtDecode from 'jwt-decode'
import { arrayPatternMatch, http, XuiLogger, getLogger } from '../../common'
import { AuthOptions } from './authOptions.interface'
import Joi from 'joi'
import * as URL from 'url'
import { generators } from 'openid-client'
import csrf from '@dr.pogodin/csurf'
import { MySessionData } from './sessionData.interface'

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
    /* istanbul ignore next */
    public initialiseStrategy = async (options: any): Promise<void> => {
        this.options = options
    }

    /**
     * The login route handler, will attempt to setup security state param and redirect user if not authenticated
     * @param req Request
     * @param res Response
     * @param next NextFunction
     */
    /* istanbul ignore next */
    public loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
        this.logger.log('Base loginHandler Hit')

        const reqSession = req.session as MySessionData

        // we are using oidc generator but it's just a helper, rather than installing another library to provide this
        const state = generators.state()
        /* istanbul ignore next */
        const promise = new Promise((resolve) => {
            if (req.session && this.options?.sessionKey) {
                reqSession[this.options?.sessionKey] = { state }
                req.session.save(() => {
                    this.logger.log('resolved promise, state saved')
                    resolve(true)
                })
            } else {
                this.logger.warn('resolved promise, state not saved')
                resolve(false)
            }
        })

        try {
            /* istanbul ignore next */
            await promise
            /* istanbul ignore next */
            this.logger.log('calling passport authenticate')
            /* istanbul ignore next */
            return passport.authenticate(
                this.strategyName,
                {
                    redirect_uri: reqSession?.callbackURL,
                    state,
                } as any,
                (error: any, user: any, info: any) => {
                    /* istanbul ignore next */
                    if (error) {
                        this.logger.error('error => ', JSON.stringify(error))
                    }
                    /* istanbul ignore next */
                    if (info) {
                        this.logger.info(info)
                    }
                    /* istanbul ignore next */
                    if (!user) {
                        const message = 'No user details returned by the authentication service, redirecting to login'
                        this.logger.log(message)
                    }
                },
            )(req, res, next)
            /* istanbul ignore next */
        } catch (error) {
            this.logger.error(error, this.strategyName)
            next(error)
            return Promise.reject(error)
        }
    }

    /* istanbul ignore next */
    public setCallbackURL = (req: Request, _res: Response, next: NextFunction): void => {
        const reqSession = req.session as MySessionData

        /* istanbul ignore else */
        if (req.session && !reqSession.callbackURL) {
            req.app.set('trust proxy', true)
            reqSession.callbackURL = URL.format({
                protocol: req.protocol,
                host: req.get('host'),
                pathname: this.options.callbackURL,
            })
        }
        /* istanbul ignore next */
        next()
    }

    /* istanbul ignore next */
    public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const reqSession = req.session as MySessionData

        try {
            this.logger.log('logout start')
            const { accessToken, refreshToken } = reqSession?.passport.user.tokenset || null

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
            req.logout(async (err) => {
                if (err) {
                    console.error(err)
                    return next(err)
                }
                await this.destroySession(req)
                /* istanbul ignore next */
                if (req.query.noredirect) {
                    res.status(200).send({ message: 'You have been logged out!' })
                    return Promise.resolve()
                }

                const redirect = req.query.redirect ? req.query.redirect : AUTH.ROUTE.LOGIN
                this.logger.log('redirecting to => ', redirect)
                // 401 is when no accessToken
                res.redirect(redirect as string)
            })
            /* istanbul ignore next */
        } catch (e) {
            this.logger.error('error => ', e)
            res.status(401).redirect(AUTH.ROUTE.DEFAULT_REDIRECT)
        }
        this.logger.log('logout end')
    }

    /* istanbul ignore next */
    public authRouteHandler = (req: Request, res: Response): Response => {
        return res.send(req.isAuthenticated())
    }

    /* istanbul ignore next */
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

    /* istanbul ignore next */
    public keepAliveHandler = (_req: Request, _res: Response, next: NextFunction): void => {
        next()
    }

    /* istanbul ignore next */
    public configure = (options: AuthOptions): RequestHandler => {
        const configuredOptions = { ...this.options, ...options }
        this.validateOptions(configuredOptions)
        this.options = configuredOptions

        this.serializeUser()
        this.deserializeUser()
        ;(async () => {
            await Promise.all([this.initialiseStrategy(this.options)])
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

    /* istanbul ignore next */
    public callbackHandler = (req: Request, res: Response, next: NextFunction): void => {
        this.logger.log('inside callbackHandler')
        const INVALID_STATE_ERROR = 'Invalid authorization request state.'
        const reqSession = req.session as MySessionData

        const emitAuthenticationFailure = (logMessages: string[]): void => {
            this.logger.log('inside emitAuthenticationFailure')

            if (!logMessages.length) return

            this.logger.log(`emitAuthenticationFailure logMessages ${logMessages}`)

            res.locals.message = logMessages.join('\n')
            this.emit(AUTH.EVENT.AUTHENTICATE_FAILURE, req, res, next)
        }

        passport.authenticate(
            this.strategyName,
            {
                redirect_uri: reqSession?.callbackURL,
                keepSessionInfo: true,
            } as any,
            (error: any, user: any, info: any) => {
                const errorMessages: string[] = []
                this.logger.log('inside passport authenticate')

                if (error) {
                    switch (error.name) {
                        case 'TimeoutError':
                            const timeoutErrorMessage = `${error.name}: timeout awaiting ${error.url} for ${error.gotOptions.gotTimeout.request}ms`
                            errorMessages.push(timeoutErrorMessage)
                            this.logger.error(error)
                            break

                        default:
                            errorMessages.push(error)
                            this.logger.error(error)
                            break
                    }
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

    /* istanbul ignore next */
    public isTokenExpired = (token: string): boolean => {
        const jwtData = jwtDecode<any>(token)
        return this.jwTokenExpired(jwtData)
    }

    /* istanbul ignore next */
    public authenticate = (
        req: Request,
        _res: Response,
        next: NextFunction,
    ): void | Response<any, Record<string, any>> => {
        if (req.isUnauthenticated() || !req?.session?.passport?.user?.userinfo) {
            this.logger.log('unauthenticated')
            return _res.status(401).send({ message: 'Unauthorized' })
        }
        next()
    }

    /* istanbul ignore next */
    public makeAuthorization = (passport: any) => `Bearer ${passport.user.tokenset.accessToken}`

    /* istanbul ignore next */
    public setHeaders = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        const reqSession = req.session as MySessionData

        if (reqSession?.passport?.user) {
            if (this.isRouteCredentialNeeded(req.path, this.options)) {
                await this.setCredentialToken(req)
            } else {
                req.headers['user-roles'] = reqSession.passport.user.userinfo.roles.join()
                req.headers.Authorization = this.makeAuthorization(reqSession.passport)
            }
        } else if (this.isRouteCredentialNeeded(req.path, this.options)) {
            await this.setCredentialToken(req)
        }
        next()
    }

    /* istanbul ignore next */
    public isRouteCredentialNeeded = (url: string, options: AuthOptions): boolean | undefined => {
        return options.routeCredential && options.routeCredential.routes && options.routeCredential.routes.includes(url)
    }

    /* istanbul ignore next */
    public setCredentialToken = async (req: Request) => {
        let routeCredentialToken
        const cachedToken = req.app.get('routeCredentialToken')
        if (cachedToken && cachedToken.access_token && !this.isTokenExpired(cachedToken.access_token)) {
            routeCredentialToken = cachedToken
        } else {
            routeCredentialToken = await this.generateToken()
            req.app.set('routeCredentialToken', routeCredentialToken)
        }
        if (routeCredentialToken && routeCredentialToken.access_token) {
            req.headers.Authorization = `Bearer ${routeCredentialToken.access_token}`
        }
    }

    /* istanbul ignore next */
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

    /* istanbul ignore next */
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

    /* istanbul ignore next */
    public initializePassport = (): void => {
        this.router.use(passport.initialize())
    }

    /* istanbul ignore next */
    public initializeSession = (): void => {
        this.router.use(passport.session())
    }

    /* istanbul ignore next */
    public initializeKeepAlive = (): void => {
        this.router.use(this.keepAliveHandler)
    }

    /**
     * helper method to store csrf token into session
     */
    /* istanbul ignore next */
    public initialiseCSRF = (): void => {
        if (this.options.useCSRF) {
            this.logger.log('initialising CSRF middleware')

            const csrfProtection = csrf({
                value: this.getCSRFValue,
            })
            /* istanbul ignore next */
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
    /* istanbul ignore next */
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

    /* istanbul ignore next */
    public addHeaders = (): void => {
        this.router.use(this.setHeaders)
    }

    /* istanbul ignore next */
    public serializeUser = (): void => {
        passport.serializeUser((user, done) => {
            this.logger.log(`${this.strategyName} serializeUser`)
            this.emitIfListenersExist(AUTH.EVENT.SERIALIZE_USER, user, done)
        })
    }

    /* istanbul ignore next */
    public deserializeUser = (): void => {
        passport.deserializeUser((id, done) => {
            this.logger.log(`${this.strategyName} deserializeUser`)
            this.emitIfListenersExist(AUTH.EVENT.DESERIALIZE_USER, id, done)
        })
    }

    /* istanbul ignore next */
    public jwTokenExpired = (jwtData: any): boolean => {
        const expires = new Date(jwtData.exp * 1000).getTime()
        const now = new Date().getTime()
        return expires < now
    }

    /**
     * Get session URL
     * @return {string}
     */
    /* istanbul ignore next */
    public urlFromToken = (url: string | undefined, token: any): string => {
        return `${url}/session/${token}`
    }

    /**
     * Get authorization from ClientID and secret
     * @return {string}
     */
    /* istanbul ignore next */
    public getAuthorization = (clientID: string, clientSecret: string, encoding: BufferEncoding = 'base64'): string => {
        return `Basic ${Buffer.from(`${clientID}:${clientSecret}`).toString(encoding)}`
    }

    /**
     * Get all the events that this strategy emits
     * @return {string[]} - ['auth.authenticate.success']
     */
    /* istanbul ignore next */
    public getEvents = (): string[] => {
        return Object.values<string>(AUTH.EVENT)
    }

    /**
     * emit Events if any subscriptions available
     */
    /* istanbul ignore next */
    public emitIfListenersExist = (
        eventName: string,
        eventObject: unknown,
        done: (err: any, id?: any) => void,
    ): void => {
        if (!this.listenerCount(eventName)) {
            done(null, eventObject)
        } else {
            this.emit(eventName, eventObject, done)
        }
    }

    /* istanbul ignore next */
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

    /* istanbul ignore next */
    public getUrlFromOptions = (options: AuthOptions): string => {
        if (options.routeCredential) {
            return `${options.logoutURL}/o/token`
        }
        throw new Error('missing routeCredential in options')
    }
}
