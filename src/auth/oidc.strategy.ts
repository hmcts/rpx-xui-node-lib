import { Issuer, Strategy } from 'openid-client';

const clientMetadata = {
    client_id: 'xuiwebapp',
    client_secret: '***REMOVED***',
    // token_endpoint_auth_method: 'client_secret_post', // The default is 'client_secret_basic'.
    post_logout_redirect_uri: 'http://localhost:3000',
    redirect_uri: 'http://localhost:3000/oauth2/callback',
};

const strategy = (async () => {
    const issuer = await Issuer.discover('https://idam-api.demo.platform.hmcts.net/o');
    const client = new issuer.Client(clientMetadata);
    // @ts-ignore
    return new Strategy({ client }, (tokenset: any, userinfo: any, done: any) => {
        // console.log(tokenset, userinfo);
        done(null, userinfo);
    });
})();

export default strategy;
