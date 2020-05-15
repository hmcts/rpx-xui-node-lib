import { OpenIDMetadata } from '../OpenIDMetadata'
import Joi, { ValidationResult } from '@hapi/joi'

export function ValidateOpenIdOptions(options: OpenIDMetadata) {
    /* eslint-disable @typescript-eslint/camelcase */
    const schema = Joi.object({
        discovery_endpoint: Joi.required(),
        issuer_url: Joi.required(),
        redirect_uri: Joi.required(),
        scope: Joi.required(),
        logout_url: Joi.required(),
    })
    /* eslint-enable @typescript-eslint/camelcase */
    const { error, value } = schema.validate(options)
    if (error) {
        throw error
    }
}
