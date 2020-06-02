export interface AuthOptions {
    authorizationURL: string
    tokenURL: string
    clientID: string
    clientSecret: string
    callbackURL: string
    scope: string
    logoutUrl: string
    useRoutes?: boolean
    sessionKey?: string
    //openID options
    discoveryEndpoint: string
    issuerUrl: string
    responseTypes: string[]
    tokenEndpointAuthMethod: string
}
