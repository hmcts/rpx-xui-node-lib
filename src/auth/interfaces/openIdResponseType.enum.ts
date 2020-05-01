export type OpenIdResponseType =
    | 'code'
    | 'id_token'
    | 'code id_token'
    | 'id_token token'
    | 'code token'
    | 'code id_token token'
    | 'none';
