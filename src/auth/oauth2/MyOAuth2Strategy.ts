import { OAuth2Metadata } from './OAuth2Metadata'
import OAuth2Strategy from 'passport-oauth2'
import { getUserDetails } from './getUserDetails'
export class MyOAuth2Strategy extends OAuth2Strategy {
    private readonly options: OAuth2Metadata
    constructor(options: OAuth2Metadata, verify: OAuth2Strategy.VerifyFunction) {
        super(options, verify)
        this.options = options
    }
    userProfile = async (accessToken: string, done: (err?: Error | null, profile?: any) => void): Promise<void> => {
        const userDetails = await getUserDetails(accessToken, this.options.logoutUrl)
        const newProfile = { user: userDetails.data, token: accessToken }
        done(null, newProfile)
    }
}
