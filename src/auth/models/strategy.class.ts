import * as events from 'events'
import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import passport from 'passport'
import { AUTH } from '../auth.constants'
import jwtDecode from 'jwt-decode'
import { http } from '../../common'
import { AuthOptions } from './authOptions.interface'
import Joi from '@hapi/joi'

export abstract class Strategy extends events.EventEmitter {
    public readonly strategyName: string

    protected readonly router: Router

    protected readonly logger = console

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
    }

    protected constructor(strategyName: string, router: Router) {
        super()
        this.strategyName = strategyName
        this.router = router
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

    public loginHandler = (req: Request, res: Response, next: NextFunction): RequestHandler => {
        this.logger.log('loginHandler Hit')
        return passport.authenticate(this.strategyName)(req, res, next)
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

            this.logger.log('noredirect => ', req.query.noredirect)
            if (req.query.noredirect) {
                res.status(200).send({ message: 'You have been logged out!' })
                return Promise.resolve()
            }

            const redirect = req.query.redirect ? req.query.redirect : AUTH.ROUTE.LOGIN
            this.logger.log('redirecting to => ', redirect)
            // 401 is when no accessToken
            res.redirect(redirect as string)
        } catch (e) {
            res.redirect(401, AUTH.ROUTE.DEFAULT_REDIRECT)
        }
        this.logger.log('logout end')
    }

    public authRouteHandler = (req: Request, res: Response): Response => {
        return res.send(req.isAuthenticated())
    }

    public configure = (options: AuthOptions): RequestHandler => {
        this.validateOptions(options)
        this.options = options

        this.serializeUser()
        this.deserializeUser()
        ;(async () => {
            await this.initialiseStrategy(this.options)
        })()

        this.initializePassport()
        this.initializeSession()

        if (options.useRoutes) {
            this.router.get(AUTH.ROUTE.DEFAULT_AUTH_ROUTE, this.authRouteHandler)
            this.router.get(AUTH.ROUTE.KEEPALIVE_ROUTE, this.authRouteHandler)
            this.router.get(AUTH.ROUTE.LOGIN, this.loginHandler)
            this.router.get(AUTH.ROUTE.OAUTH_CALLBACK, this.callbackHandler)
            this.router.get(AUTH.ROUTE.LOGOUT, this.logout)
        }
        this.addHeaders()
        this.emit(`${this.strategyName}.bootstrap.success`)
        return this.router
    }

    public callbackHandler = (req: Request, res: Response, next: NextFunction): void => {
        passport.authenticate(this.strategyName, (error, user, info) => {
            this.logger.info('inside passport authenticate')
            this.logger.error(error)
            if (error) {
                this.logger.error(error)
                // return next(error);
            }
            if (info) {
                this.logger.info(info)
                // return next(info);
            }
            if (!user) {
                this.logger.info('No user found, redirecting')
                return res.redirect(AUTH.ROUTE.LOGIN)
            }
            this.verifyLogin(req, user, next, res)
        })(req, res, next)
    }

    public isTokenExpired = (token: string): boolean => {
        const jwtData = jwtDecode<any>(token)
        return this.jwTokenExpired(jwtData)
    }

    public authenticate = (req: Request, res: Response, next: NextFunction): void => {
        if (req.isUnauthenticated()) {
            this.logger.log('unauthenticated, redirecting')
            return res.redirect(AUTH.ROUTE.LOGIN)
        }
        next()
    }

    public makeAuthorization = (passport: any) => `Bearer ${passport.user.tokenset.accessToken}`

    public setHeaders = (req: Request, res: Response, next: NextFunction): void => {
        if (req.session?.passport?.user) {
            req.headers['user-roles'] = req.session.passport.user.userinfo.roles.join()
            req.headers.Authorization = this.makeAuthorization(req.session.passport)
        }
        next()
    }

    public verifyLogin = (req: Request, user: any, next: NextFunction, res: Response<any>): void => {
        req.logIn(user, (err) => {
            if (err) {
                return next(err)
            }
            if (!this.listenerCount(AUTH.EVENT.AUTHENTICATE_SUCCESS)) {
                this.logger.log(`redirecting, no listener count: ${AUTH.EVENT.AUTHENTICATE_SUCCESS}`, req.session)
                res.redirect(AUTH.ROUTE.DEFAULT_REDIRECT)
            } else {
                this.emit(AUTH.EVENT.AUTHENTICATE_SUCCESS, this, false, req, res, next)
            }
        })
    }

    public initializePassport = (): void => {
        this.router.use(passport.initialize())
    }

    public initializeSession = (): void => {
        this.router.use(passport.session())
    }

    public addHeaders = (): void => {
        this.router.use(this.setHeaders)
    }

    public serializeUser = (): void => {
        passport.serializeUser((user, done) => {
            this.logger.log(`${this.strategyName} serializeUser`, user)
            this.emitIfListenersExist(AUTH.EVENT.SERIALIZE_USER, user, done)
        })
    }

    public deserializeUser = (): void => {
        passport.deserializeUser((id, done) => {
            this.logger.log(`${this.strategyName} deserializeUser`, id)
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
     * emit Events if any subscribtions available
     */
    public emitIfListenersExist(eventName: string, eventObject: unknown, done: (err: any, id?: unknown) => void) {
        if (!this.listenerCount(eventName)) {
            done(null, eventObject)
        } else {
            this.emit(eventName, eventObject, done)
        }
    }
}
