import { OAuth2Metadata } from './OAuth2Metadata.interface'
import passport from 'passport'
import { OAUTH2 } from '../oauth2.constants'
import { VerifyCallback } from 'passport-oauth2'
import { Authentication } from '../../models'
import { XUIOAuth2Strategy } from './XUIOAuth2Strategy.class'
import Joi from '@hapi/joi'

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

    public initialiseStrategy = async (options: OAuth2Metadata): Promise<void> => {
        passport.use(this.strategyName, new XUIOAuth2Strategy(options, this.verify))
        console.log('initialiseStrategy end')
    }

    public validateOptions(options: any): void {
        const schema = Joi.object({
            authorizationURL: Joi.string().required(),
            clientID: Joi.string().required(),
            clientSecret: Joi.string().required(),
            logoutUrl: Joi.string().required(),
            callbackURL: Joi.string().required(),
            scope: Joi.string().required(),
            sessionKey: Joi.string().required(),
            tokenURL: Joi.string().required(),
            useRoutes: Joi.bool().optional(),
        })
        /* eslint-enable @typescript-eslint/camelcase */
        const { error } = schema.validate(options)
        if (error) {
            throw error
        }
    }

    public verify = (
        accessToken: string,
        refreshToken: string,
        results: any,
        profile: any,
        done: VerifyCallback,
    ): void => {
        done(null, { tokenset: { accessToken, refreshToken }, userinfo: profile })
    }
}

export default new OAuth2()
