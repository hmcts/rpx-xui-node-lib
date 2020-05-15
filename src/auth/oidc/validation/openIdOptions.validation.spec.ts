import { ValidateOpenIdOptions } from './openIdOptions.Validation'
import { ClientAuthMethod, ResponseType } from 'openid-client'
/* eslint-disable @typescript-eslint/camelcase */
test('Auth', () => {
    const options = {
        client_id: 'clientId',
        client_secret: 'Clientsecret',
        discovery_endpoint: 'someEndpoint',
        issuer_url: 'issuer_url',
        logout_url: 'logouturl',
        redirect_uri: 'redirect_uri',
        response_types: ['none'] as ResponseType[],
        scope: 'some scope',
        sessionKey: 'key',
        token_endpoint_auth_method: 'client_secret_basic' as ClientAuthMethod,
        useRoutes: false,
    }
    /* eslint-disable @typescript-eslint/camelcase */
    ValidateOpenIdOptions(options)
})
