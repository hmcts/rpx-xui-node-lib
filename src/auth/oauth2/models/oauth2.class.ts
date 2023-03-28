import passport from 'passport'
import { OAUTH2 } from '../oauth2.constants'
import { VerifyCallback } from 'passport-oauth2'
import { Strategy } from '../../models'
import { XUIOAuth2Strategy } from './XUIOAuth2Strategy.class'
import { AuthOptions } from '../../models/authOptions.interface'
import { OAuth2Metadata } from './OAuth2Metadata.interface'
import { Router } from 'express'
import { getLogger, XuiLogger } from '../../../common'

export class OAuth2 extends Strategy {
    constructor(router = Router({ mergeParams: true }), logger: XuiLogger = getLogger('auth:oauth2')) {
        super(OAUTH2.STRATEGY_NAME, router, logger)
    }

    /**
     * Retrieve transformed AuthOptions
     * @param authOptions
     * @return OAuth2Metadata
     */
    public getOAuthOptions = (authOptions: AuthOptions): OAuth2Metadata => {
        const options = {
            ...authOptions,
            ...{
                logoutUrl: authOptions.logoutURL,
                state: '1', // this is required to have oauth strategy chose the right sessionStore
            },
        }
        delete options.logoutURL
        return options as OAuth2Metadata
    }

    public initialiseStrategy = async (authOptions: AuthOptions): Promise<void> => {
        const options = this.getOAuthOptions(authOptions)
        passport.use(this.strategyName, new XUIOAuth2Strategy(options, this.verify))
        this.logger.log('initialiseStrategy end')
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

export const oauth2 = new OAuth2()
