import { SESSION } from '../session.constants'
import { Strategy } from '../../models'
import { SessionMetadata, FileSessionMetadata } from './sessionMetadata.interface'
import * as express from 'express'
import { default as session } from 'express-session'
import { default as sessionFileStore } from 'session-file-store'
const logger = console

export class FileSessionStrategy extends Strategy {
    protected redisClient: any
    constructor() {
        super(SESSION.FILE_STRATEGY_NAME)
    }

    public configure = (options: FileSessionMetadata): express.RequestHandler => {
        const store = this.getStore(options)
        const sessionOptions = FileSessionStrategy.mapSessionOptions(options, store)
        this.router.use(session(sessionOptions))
        return this.router
    }

    public logout = (): Promise<void> => {
        throw new Error('Not yet implemented')
    }

    public getStore = (options: FileSessionMetadata): session.Store => {
        if (options.fileStoreOptions) {
            return this.getFileStore(options.fileStoreOptions)
        }
        throw new Error('File store Options are missing')
    }

    public getFileStore = (options: { filePath: string }): session.Store => {
        logger.info('using FileStore')
        const fileStore = sessionFileStore(session)
        return new fileStore({
            path: options.filePath,
        })
    }

    public static mapSessionOptions = (options: SessionMetadata, store: session.Store): any => {
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

export default new FileSessionStrategy()
