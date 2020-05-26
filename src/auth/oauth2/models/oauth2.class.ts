import * as express from 'express'
import { RequestHandler } from 'express'
import { OAuth2Metadata } from './OAuth2Metadata.interface'
import passport from 'passport'
import { AUTH } from '../../auth.constants'
import { OAUTH2 } from '../oauth2.constants'
import { VerifyCallback } from 'passport-oauth2'
import { Authentication } from '../../models/authentication.class'
import { http } from '../../../http/http'
import { XUIOAuth2Strategy } from './XUIOAuth2Strategy.class'

//TODO: move this as an option and proper logger
const logger = console

export class OAuth2 extends Authentication {
    protected options: OAuth2Metadata = {
        authorizationURL: '',
        tokenURL: '',
        clientID: '',
        clientSecret: '',
        scope: '',
        logoutUrl: '',
        sessionKey: '',
        useRoutes: true,
    }

    constructor() {
        super(OAUTH2.STRATEGY_NAME)
    }

    public configure = (options: OAuth2Metadata): RequestHandler => {
        logger.info('oAuth2 configure start')
        this.options = options
        passport.serializeUser((user, done) => {
            logger.info('serialize user', user)
            if (!this.listenerCount(AUTH.EVENT.SERIALIZE_USER)) {
                done(null, user)
            } else {
                this.emit(AUTH.EVENT.SERIALIZE_USER, user, done)
            }
        })

        passport.deserializeUser((id, done) => {
            logger.info('de-serialize user', id)
            if (!this.listenerCount(AUTH.EVENT.DESERIALIZE_USER)) {
                done(null, id)
            } else {
                this.emit(AUTH.EVENT.DESERIALIZE_USER, id, done)
            }
        })
        logger.info('oAuth2 before initialiseStrategy')
        this.initialiseStrategy(this.options)
        logger.info('oAuth2 after initialiseStrategy')

        this.router.use(passport.initialize())
        this.router.use(passport.session())

        logger.info('oAuth2 options.useRoutes', options.useRoutes)
        if (options.useRoutes) {
            this.router.get(AUTH.ROUTE.DEFAULT_AUTH_ROUTE, (req, res) => {
                res.send(req.isAuthenticated())
            })
            this.router.get(AUTH.ROUTE.LOGIN, this.loginHandler)
            this.router.get(AUTH.ROUTE.OAUTH_CALLBACK, this.callbackHandler)
            this.router.get(AUTH.ROUTE.LOGOUT, async (req, res) => {
                logger.info('before logout')
                await this.logout(req, res)
            })
        }
        this.emit('oAuth2 outh2.bootstrap.success')
        logger.info('oAuth2 configure end')
        return this.router
    }

    public logout = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            logger.info('logout start')
            const accessToken = req.session?.passport.user.tokenset.access_token
            const refreshToken = req.session?.passport.user.tokenset.refresh_token

            const auth = `Basic ${Buffer.from(`${this.options.clientID}:${this.options.clientSecret}`).toString(
                'base64',
            )}`

            await http.delete(`${this.options.logoutUrl}/session/${accessToken}`, {
                headers: {
                    Authorization: auth,
                },
            })
            await http.delete(`${this.options.logoutUrl}/session/${refreshToken}`, {
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
        logger.info('logout end')
    }

    public initialiseStrategy = (options: OAuth2Metadata): void => {
        passport.use(this.strategyName, new XUIOAuth2Strategy(options, this.verify))
        logger.info('initialiseStrategy end')
    }

    public verify = async (
        accessToken: string,
        refreshToken: string,
        results: any,
        profile: any,
        done: VerifyCallback,
    ): Promise<void> => {
        logger.info('accessToken', accessToken)
        logger.info('refreshToken', refreshToken)
        logger.info('results', results)
        logger.info('profile', profile)
        done(null, { tokenset: { accessToken, refreshToken }, userinfo: profile })
    }
}

export default new OAuth2()
