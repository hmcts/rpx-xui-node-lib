import { OutgoingHttpHeaders } from 'http';
import { IClientMetadataBase } from './clientMetadataBase.interface';
export interface IOAuth2Metadata extends IClientMetadataBase {
    authorizationURL: string;
    tokenURL: string;
    customHeaders?: OutgoingHttpHeaders;
    scopeSeparator?: string;
    state?: any;
    skipUserProfile?: any;
    pkce?: boolean;
    proxy?: any;
}
