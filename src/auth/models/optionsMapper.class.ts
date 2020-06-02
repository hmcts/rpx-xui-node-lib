import { AuthOptions } from './authOptions.interface'
import { OpenIDMetadata } from '../oidc'
import { ResponseType, ClientAuthMethod } from 'openid-client'

export class OptionsMapper {
    /* eslint-disable @typescript-eslint/camelcase */
    public static getOpenIDOptions(openIdOptions: AuthOptions): OpenIDMetadata {
        const options = {
            client_id: openIdOptions.clientID,
            client_secret: openIdOptions.clientSecret,
            discovery_endpoint: openIdOptions.discoveryEndpoint,
            issuer_url: openIdOptions.issuerUrl,
            logout_url: openIdOptions.logoutUrl,
            redirect_uri: openIdOptions.callbackURL,
            response_types: openIdOptions.responseTypes as ResponseType[],
            scope: openIdOptions.scope,
            sessionKey: openIdOptions.sessionKey,
            token_endpoint_auth_method: openIdOptions.tokenEndpointAuthMethod as ClientAuthMethod,
            useRoutes: openIdOptions.useRoutes,
        }
        /* eslint-disable @typescript-eslint/camelcase */
        return options
    }
}
