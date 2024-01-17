export interface SessionMetadata {
    cookie: {
        httpOnly: boolean
        maxAge?: number
        secure: boolean
    }
    name: string
    resave: boolean
    saveUninitialized: boolean
    secret: string
}

export interface FileSessionMetadata extends SessionMetadata {
    fileStoreOptions: {
        filePath: string
    }
}

export interface RedisSessionMetadata extends SessionMetadata {
    redisStoreOptions: {
        redisKeyPrefix: string
        redisCloudUrl: string
        redisTtl: number | string
    }
}
