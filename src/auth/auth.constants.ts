export const AUTH = {
    EVENT: {
        AUTHENTICATE_SUCCESS: 'auth.authenticate.success',
        SERIALIZE_USER: 'auth.serializeUser',
        DESERIALIZE_USER: 'auth.deserializeUser',
        AUTHENTICATE_FAILURE: 'outh2.authenticate.failure',
    },
    ROUTE: {
        DEFAULT_REDIRECT: '/',
        LOGIN: '/auth/login',
        DEFAULT_AUTH_ROUTE: '/auth/isAuthenticated',
        OAUTH_CALLBACK: '/oauth2/callback',
        LOGOUT: '/auth/logout',
    },
}
