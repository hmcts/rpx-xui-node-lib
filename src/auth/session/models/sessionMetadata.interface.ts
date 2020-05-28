import { Store } from 'express-session'

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
    store: Store
}
