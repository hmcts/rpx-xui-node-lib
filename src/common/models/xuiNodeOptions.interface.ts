import { AuthOptions } from '../../auth/models/authOptions.interface'
import { FileSessionMetadata, RedisSessionMetadata } from '../../session/models/sessionMetadata.interface'
import { S2SConfig } from '../../auth/s2s'

export interface XuiNodeOptions {
    auth?: {
        oidc?: AuthOptions
        oauth2?: AuthOptions
        s2s?: S2SConfig
    }
    session?: {
        fileStore?: FileSessionMetadata
        redisStore?: RedisSessionMetadata
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [index: string]: any
}
