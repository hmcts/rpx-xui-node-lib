import Joi from '@hapi/joi'
import { OAuth2Metadata } from '../models'

export function ValidateOAuth2Options(options: OAuth2Metadata): void {
    /* eslint-disable @typescript-eslint/camelcase */
    const schema = Joi.object({
        authorizationURL: Joi.string().required(),
        tokenURL: Joi.string().required(),
        clientID: Joi.string().required(),
        clientSecret: Joi.string().required(),
        callbackURL: Joi.string().required(),
        logoutUrl: Joi.string().required(),
        scope: Joi.string().required(),
        scopeSeparator: Joi.any(),
        sessionKey: Joi.any(),
        useRoutes: Joi.any(),
        skipUserProfile: Joi.any(),
        pkce: Joi.any(),
        proxy: Joi.any(),
        store: Joi.any(),
        state: Joi.any(),
        customHeaders: Joi.any(),
    })
    /* eslint-enable @typescript-eslint/camelcase */
    const { error } = schema.validate(options)
    if (error) {
        throw error
    }
}
