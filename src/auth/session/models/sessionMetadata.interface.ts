export interface SessionMetadata {
    cookie: {
        httpOnly: boolean
        maxAge: number
        secure: boolean
    }
    name: string
    resave: boolean
    saveUninitialized: boolean
    secret: string
    storeOptions: SessionStoreOptions
}

export interface SessionStoreOptions {
    useRedisStore: true
    fileStoreOptions?: {
        filePath: string
    }
    redisStoreOptions?: {
        redisKeyPrefix: string
        redisCloudUrl: string
        redisTtl: number | string
    }
}
