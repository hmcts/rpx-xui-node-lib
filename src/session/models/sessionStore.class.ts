import { RequestHandler, Router } from 'express'
import * as events from 'events'
import { SessionMetadata } from './sessionMetadata.interface'
import session from 'express-session'

export abstract class SessionStore extends events.EventEmitter {
    protected readonly logger = console
    protected readonly router = Router({ mergeParams: true })
    public readonly storeName: string

    protected constructor(storeName: string) {
        super()
        this.storeName = storeName
    }

    public abstract getStore(options: SessionMetadata): session.Store

    public configure = (options: SessionMetadata): RequestHandler => {
        const store = this.getClassStore(options)
        const sessionOptions = this.mapSessionOptions(options, store)
        this.router.use(session(sessionOptions))
        return this.router
    }

    public getClassStore = (options: SessionMetadata): session.Store => {
        if (options) {
            return this.getStore(options)
        }
        throw new Error('Store Options are missing')
    }

    public mapSessionOptions = (options: SessionMetadata, store: session.Store): any => {
        return {
            cookie: options.cookie,
            name: options.name,
            resave: options.resave,
            saveUninitialized: options.saveUninitialized,
            secret: options.secret,
            store,
        }
    }
}
