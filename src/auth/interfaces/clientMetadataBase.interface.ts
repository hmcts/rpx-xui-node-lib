export interface IClientMetadataBase {
    clientID: string;
    clientSecret: string;
    redirectUrls: string[];
    scope?: string | string[];
    sessionKey?: string;
}
