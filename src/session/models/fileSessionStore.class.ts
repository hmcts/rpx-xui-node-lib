import session from 'express-session'
import sessionFileStore from 'session-file-store'
import { SessionStore } from './sessionStore.class'
import { FileSessionMetadata } from './sessionMetadata.interface'
import { SESSION } from '../session.constants'

export class FileSessionStore extends SessionStore {
    constructor() {
        super(SESSION.FILE_STORE_NAME)
    }

    public getStore = (options: FileSessionMetadata): session.Store => {
        this.logger.info('using FileStore')
        const fileStore = sessionFileStore(session)
        return new fileStore({
            path: options.fileStoreOptions.filePath,
        })
    }
}

export default new FileSessionStore()
