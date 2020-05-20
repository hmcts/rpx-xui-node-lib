import { NextFunction, Request, RequestHandler, Response } from 'express'
import * as express from 'express'
import { OAuth2Metadata } from './OAuth2Metadata'
import passport from 'passport'
import { AUTH } from '../auth.constants'
import { OAUTH2 } from './oauth2.constants'
import OAuth2Strategy, { VerifyCallback } from 'passport-oauth2'
import { Authentication } from '..'
import { http } from '../../http/http'

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

    constructor(strategyName: string) {
        super(strategyName)
    }

    public configure = (options: OAuth2Metadata): RequestHandler => {
        console.log('oAuth2 configure start')
        this.options = options
        passport.serializeUser((user, done) => {
            console.log('serialize user', user)
            if (!this.listenerCount(AUTH.EVENT.SERIALIZE_USER)) {
                done(null, user)
            } else {
                this.emit(AUTH.EVENT.SERIALIZE_USER, user, done)
            }
        })

        passport.deserializeUser((id, done) => {
            console.log('de-serialize user', id)
            if (!this.listenerCount(AUTH.EVENT.DESERIALIZE_USER)) {
                done(null, id)
            } else {
                this.emit(AUTH.EVENT.DESERIALIZE_USER, id, done)
            }
        })
        console.log('oAuth2 before initialiseStrategy')
        this.initialiseStrategy(this.options)
        console.log('oAuth2 after initialiseStrategy')

        this.router.use(passport.initialize())
        this.router.use(passport.session())

        console.log('oAuth2 options.useRoutes', options.useRoutes)
        if (options.useRoutes) {
            this.router.get(AUTH.ROUTE.DEFAULT_AUTH_ROUTE, (req, res) => {
                res.send(req.isAuthenticated())
            })
            this.router.get(AUTH.ROUTE.LOGIN, this.loginHandler)
            this.router.get(AUTH.ROUTE.OAUTH_CALLBACK, this.callbackHandler)
            this.router.get(AUTH.ROUTE.LOGOUT, async (req, res) => {
                console.log('before logout')
                await this.logout(req, res)
            })
        }
        this.emit('oAuth2 outh2.bootstrap.success')
        console.log('oAuth2 configure end')
        return this.router
    }

    public logout = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            console.log('logout start')
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
        console.log('logout end')
    }

    public initialiseStrategy = (options: OAuth2Metadata): void => {
        passport.use(this.strategyName, new OAuth2Strategy(options, this.verify))
        console.log('initialiseStrategy end')
    }

    public verify = (accessToken: string, refreshToken: string, results: any, profile: any, done: VerifyCallback) => {
        console.log('accessToken', accessToken)
        console.log('refreshToken', refreshToken)
        console.log('results', results)
        console.log('verify', profile)
        done(null, profile)
    }
}

export default new OAuth2(OAUTH2.STRATEGY_NAME)
