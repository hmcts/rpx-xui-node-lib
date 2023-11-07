import session from 'express-session'

export interface MySessionData extends session.SessionData {
    [key: string]: any
}
