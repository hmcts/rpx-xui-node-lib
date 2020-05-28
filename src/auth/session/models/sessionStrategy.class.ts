import { SESSION } from '../session.constants'
import { Strategy } from '../../models'
import { SessionMetadata } from './sessionMetadata.interface'
import * as express from 'express'
import { default as session } from 'express-session'

export class SessionStrategy extends Strategy {
    constructor() {
        super(SESSION.STRATEGY_NAME)
    }

    public configure(options: SessionMetadata): express.RequestHandler {
        this.router.use(session(options))
        return this.router
    }

    public logout(req: express.Request, res: express.Response): Promise<void> {
        throw new Error('Not yet implemented')
    }
}

export default new SessionStrategy()
