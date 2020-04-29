import { Issuer, Strategy } from "openid-client";

let clientMetadata = {
    client_id: 'xuiwebapp',
    client_secret: 'yB71mnPeypP3HlcN',
    // token_endpoint_auth_method: 'client_secret_post', // The default is 'client_secret_basic'.
    redirect_uri: 'http://localhost:3000/oauth2/callback',
    post_logout_redirect_uri: 'http://localhost:3000'
}

const strategy = (async () => {
  const issuer = await Issuer.discover('https://idam-api.demo.platform.hmcts.net/o');
  const client = new issuer.Client(clientMetadata);
  // @ts-ignore
   new Strategy({ client }, (tokenset: any, userinfo: any, done: any) => {
    console.log(tokenset, userinfo);
    done(null, userinfo);
  });
})();

export default strategy;
