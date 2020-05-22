/// <reference types="node" />
import * as events from 'events';
export * from 'openid-client';
import { ClientMetadata } from 'openid-client';
interface LibOptions {
    oidc?: ClientMetadata;
}
export declare class XuiNodeLib extends events.EventEmitter {
    constructor(options: LibOptions);
}
