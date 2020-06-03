import { ValidateOAuth2Options } from './oauth2.validation'
import { OutgoingHttpHeaders } from 'http'

/* eslint-disable @typescript-eslint/camelcase */
test('OAuth2 Validation', () => {
    const options = {
        authorizationURL: 'someauthurl',
        tokenURL: 'sometokenUrl',
        clientID: 'client',
        clientSecret: 'secret',
        callbackURL: 'callbackUrl',
        scope: 'scope',
        scopeSeparator: '',
        sessionKey: '',
        useRoutes: false,
        logoutUrl: 'logoutUrl',
    }
    /* eslint-disable @typescript-eslint/camelcase */

    ValidateOAuth2Options(options)
})
