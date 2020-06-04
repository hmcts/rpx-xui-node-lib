import oauth2 from './oauth2.class'

test('OIDC Auth', () => {
    expect(oauth2).toBeDefined()
})

test('OAuth2 configure', () => {
    const options = {
        authorizationURL: 'someauthurl',
        tokenURL: 'sometokenUrl',
        clientID: 'client',
        clientSecret: 'secret',
        callbackURL: 'callbackUrl',
        scope: 'scope',
        sessionKey: 'node-lib',
        useRoutes: false,
        logoutURL: 'logoutUrl',
        discoveryEndpoint: 'string',
        issuerURL: 'string',
        responseTypes: [''],
        tokenEndpointAuthMethod: 'string',
    }
    const handler = oauth2.configure(options)
    expect(handler).toBeTruthy()
})
