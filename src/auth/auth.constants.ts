export const AUTH = {
    EVENT: {
        AUTHENTICATE_SUCCESS: 'auth.authenticate.success',
        SERIALIZE_USER: 'auth.serializeUser',
        DESERIALIZE_USER: 'auth.deserializeUser',
        AUTHENTICATE_FAILURE: 'auth.authenticate.failure',
        AUTHENTICATE_ACCESS_DENIED: 'auth.authenticate.accessDenied',
    },
    ROUTE: {
        DEFAULT_REDIRECT: '/',
        LOGIN: '/auth/login',
        DEFAULT_AUTH_ROUTE: '/auth/isAuthenticated',
        KEEPALIVE_ROUTE: '/auth/keepalive',
        OAUTH_CALLBACK: '/oauth2/callback',
        LOGOUT: '/auth/logout',
        EXPIRED_LOGIN_LINK: '/expired-login-link',
        ACCESS_DENIED: '/access-denied',
    },
}
