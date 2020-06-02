import { AuthOptions } from './authOptions.interface'
import { OpenIDMetadata } from '../oidc'
import { ResponseType, ClientAuthMethod } from 'openid-client'
import { OAuth2Metadata } from '../oauth2'

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
            useRoutes: false,
        }
        /* eslint-disable @typescript-eslint/camelcase */
        return options
    }

    public static getOAuth2Options(oAuth2Options: AuthOptions): OAuth2Metadata {
        const options = {
            authorizationURL: oAuth2Options.authorizationURL,
            tokenURL: oAuth2Options.tokenURL,
            clientID: oAuth2Options.clientID,
            clientSecret: oAuth2Options.clientSecret,
            callbackURL: oAuth2Options.callbackURL,
            scope: oAuth2Options.scope,
            sessionKey: oAuth2Options.sessionKey,
            useRoutes: oAuth2Options.useRoutes,
            logoutUrl: oAuth2Options.logoutUrl,
        }
        return options
    }
}
