import { OptionsMapper } from './optionsMapper.class'

test('OIDC OptionsMapper', () => {
    const options = {
        authorizationURL: '',
        tokenURL: '',
        clientID: 'clientId',
        clientSecret: 'Clientsecret',
        discoveryEndpoint: 'someEndpoint',
        issuerUrl: 'issuer_url',
        logoutUrl: 'logouturl',
        callbackURL: 'redirect_uri',
        responseTypes: ['none'],
        scope: 'some scope',
        sessionKey: 'key',
        tokenEndpointAuthMethod: 'client_secret_basic',
        useRoutes: false,
    }
    const openIdOptions = OptionsMapper.getOpenIDOptions(options)

    expect(openIdOptions.client_id).toEqual(options.clientID)
    expect(openIdOptions.client_secret).toEqual(options.clientSecret)
    expect(openIdOptions.discovery_endpoint).toEqual(options.discoveryEndpoint)
    expect(openIdOptions.issuer_url).toEqual(options.issuerUrl)
    expect(openIdOptions.logout_url).toEqual(options.logoutUrl)
    expect(openIdOptions.redirect_uri).toEqual(options.callbackURL)
    expect(openIdOptions.response_types).toEqual(options.responseTypes)
    expect(openIdOptions.scope).toEqual(options.scope)
    expect(openIdOptions.sessionKey).toEqual(options.sessionKey)
    expect(openIdOptions.token_endpoint_auth_method).toEqual(options.tokenEndpointAuthMethod)
    expect(openIdOptions.useRoutes).toEqual(options.useRoutes)
})
