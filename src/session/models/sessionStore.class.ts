import { RequestHandler, Router } from 'express'
import * as events from 'events'
import { SessionMetadata } from './sessionMetadata.interface'
import session from 'express-session'
import { SESSION } from '../session.constants'
import { getLogger, XuiLogger } from '../../common'

// TODO : This is hard to mock and test as it doesn't have
// an exported default, and when one is added the compiler
// complains that its constructor needs storename, as it's used
// in the constructor.
// This needs to be refactored so that storeName is not passed
// in via const?
export abstract class SessionStore extends events.EventEmitter {
    protected readonly logger: XuiLogger
    protected readonly router: Router
    public readonly storeName: string

    protected constructor(storeName: string, router: Router, logger: XuiLogger = getLogger('session:store')) {
        super()
        this.storeName = storeName
        this.router = router
        this.logger = logger
    }

    public abstract getStore(options: SessionMetadata): session.Store

    public configure = (options: SessionMetadata): RequestHandler => {
        const store = this.getClassStore(options)
        const sessionOptions = this.mapSessionOptions(options, store)
        // Ensure trust proxy is enabled before session middleware so secure cookies are respected
        this.router.use((req, _res, next) => {
            if (!req.app.get('trust proxy')) {
                req.app.set('trust proxy', true)
                this.logger.log('sessionStore: trust proxy enabled (pre-session middleware)')
            }
            next()
        })
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

    /**
     * Get all the events that this strategy emits
     * @return string[]
     */
    public getEvents = (): string[] => {
        return Object.values<string>(SESSION.EVENT)
    }
}
