"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OIDC = {
    EVENT: {
        AUTHENTICATE_SUCCESS: 'oidc.authenticate.success',
        AUTHENTICATE_FAILURE: 'oidc.authenticate.failure',
    },
    PROMPT: 'login',
    STRATEGY_NAME: 'oidc',
};
// AUTH
exports.AUTH = {
    EVENT: {
        AUTHENTICATE_SUCCESS: 'auth.authenticate.success',
        SERIALIZE_USER: 'auth.serializeUser',
        DESERIALIZE_USER: 'auth.deserializeUser',
    },
    ROUTE: {
        DEFAULT_REDIRECT: '/',
        LOGIN: '/auth/login',
        DEFAULT_AUTH_ROUTE: '/auth/isAuthenticated',
        OAUTH_CALLBACK: '/oauth2/callback',
        LOGOUT: '/auth/logout',
    },
};
