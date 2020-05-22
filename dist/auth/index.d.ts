import { RequestHandler } from 'express';
import { ClientMetadata } from 'openid-client';
export declare function auth(options: ClientMetadata): RequestHandler;
