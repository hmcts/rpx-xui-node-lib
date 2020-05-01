import { IClientMetadataBase } from './clientMetadataBase.interface';
import { OpenIdClientAuthMethod } from './openIdClientAuthMethod.enum';
import { OpenIdResponseType } from './openIdResponseType.enum';

export interface IOpenIdMetadata extends IClientMetadataBase {
    idTokenSignedResponseAlg?: string;
    tokenEndpointAuthMethod?: OpenIdClientAuthMethod;
    responseTypes?: OpenIdResponseType[];
    postLogoutRedirectUris?: string[];
    defaultMaxAge?: number;
    requireAuthTime?: boolean;
    tlsClientCertificateBoundAccessTokens?: boolean;
    requestObjectSigningAlg?: string;
    [key: string]: unknown;
}
