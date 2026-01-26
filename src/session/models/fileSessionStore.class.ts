import session from 'express-session'
import sessionFileStore from 'session-file-store'
import { SessionStore } from './sessionStore.class'
import { FileSessionMetadata } from './sessionMetadata.interface'
import { SESSION } from '../session.constants'
import { Router } from 'express'
import { getLogger, XuiLogger } from '../../common'

export class FileSessionStore extends SessionStore {
    constructor(router = Router({ mergeParams: true }), logger: XuiLogger = getLogger('session:file')) {
        super(SESSION.FILE_STORE_NAME, router, logger)
    }

    public getStore = (options: FileSessionMetadata): session.Store => {
        this.logger.info('using FileStore')
        const fileStore = sessionFileStore(session)
        return new fileStore({
            path: options.fileStoreOptions.filePath,
        })
    }
}

export const fileStore = new FileSessionStore()