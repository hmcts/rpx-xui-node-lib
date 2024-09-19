/* eslint-disable @typescript-eslint/no-use-before-define */

import { OAuth2Metadata } from './OAuth2Metadata.interface'
import OAuth2Strategy from 'passport-oauth2'
import { AxiosResponse } from 'axios'
import { getLogger, http, XuiLogger } from '../../../common'

export class XUIOAuth2Strategy extends OAuth2Strategy {
    private readonly options: OAuth2Metadata
    private readonly logger: XuiLogger = getLogger('auth:XUIOAuth2Strategy')

    constructor(options: OAuth2Metadata, verify: OAuth2Strategy.VerifyFunction) {
        super(options, verify)
        this.options = options
    }
    userProfile = async (accessToken: string, done: (err?: Error | null, profile?: any) => void): Promise<void> => {
        const userDetails = await getUserDetails(accessToken, this.options.logoutUrl)
        if (userDetails?.data) {
            this.logger.log('retrieved userProfile', userDetails.data);
            done(null, userDetails.data)
        } else {
            this.logger.error('no user details retrieved')
            const e: Error = new Error('XUIOAuth2Strategy no user details retrieved')
            done(e, null)
        }
    }
}

export const getUserDetails = (jwt: string, logoutUrl: string): Promise<AxiosResponse> => {
    const options = {
        headers: { Authorization: `Bearer ${jwt}` },
    }
    return http.get(`${logoutUrl}/details`, options)
}
