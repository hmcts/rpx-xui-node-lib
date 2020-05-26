import { OpenIDMetadata } from '../models'
import Joi from '@hapi/joi'

export function ValidateOpenIdOptions(options: OpenIDMetadata): void {
    /* eslint-disable @typescript-eslint/camelcase */
    const schema = Joi.object({
        client_id: Joi.string().required(),
        client_secret: Joi.string().required(),
        discovery_endpoint: Joi.string().required(),
        issuer_url: Joi.string().required(),
        logout_url: Joi.string().required(),
        redirect_uri: Joi.string().required(),
        response_types: Joi.array().required().min(1),
        scope: Joi.string().required(),
        sessionKey: Joi.string().required(),
        token_endpoint_auth_method: Joi.string().required(),
        useRoutes: Joi.any(),
    })
    /* eslint-enable @typescript-eslint/camelcase */
    const { error } = schema.validate(options)
    if (error) {
        throw error
    }
}
