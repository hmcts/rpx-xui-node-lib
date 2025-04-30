import { OAuth2Metadata } from './OAuth2Metadata.interface'
import OAuth2Strategy from 'passport-oauth2'
import { AxiosResponse } from 'axios'
import { http } from '../../../common'

export class XUIOAuth2Strategy extends OAuth2Strategy {
    private readonly options: OAuth2Metadata
    constructor(options: OAuth2Metadata, verify: OAuth2Strategy.VerifyFunction) {
        super(options, verify)
        this.options = options
    }
    userProfile = async (accessToken: string, done: (err?: Error | null, profile?: any) => void): Promise<void> => {
        const userDetails = await getUserDetails(accessToken, this.options.logoutUrl)
        done(null, userDetails.data)
    }
}

export const getUserDetails = (jwt: string, logoutUrl: string): Promise<AxiosResponse> => {
    const options = {
        headers: { Authorization: `Bearer ${jwt}` },
    }
    return http.get(`${logoutUrl}/details`, options)
}
