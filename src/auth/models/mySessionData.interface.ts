export interface AuthOptions {
    authorizationURL: string
    tokenURL: string
    clientID: string
    clientSecret: string
    callbackURL: string
    scope: string
    logoutURL?: string
    useRoutes?: boolean
    sessionKey?: string
    //openID options
    discoveryEndpoint: string
    issuerURL: string
    responseTypes: string[]
    tokenEndpointAuthMethod: string
    allowRolesRegex?: string
    useCSRF?: boolean
    routeCredential?: RouteCredential
}

export interface RouteCredential {
    userName: string
    password: string
    routes: string[]
    scope: string
}
