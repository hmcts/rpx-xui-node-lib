
export interface IClientMetadata {
  clientID: string;
  clientSecret: string;
  redirectUrl: string;


  // token_endpoint_auth_method: 'client_secret_post', // The default is 'client_secret_basic'.
  post_logout_redirect_uri: 'http://localhost:3000',


  // oauth2
  authorizationURL: 'https://www.example.com/oauth2/authorize',
  tokenURL: 'https://www.example.com/oauth2/token',
}
