import { Cookie, Session, SessionData } from 'express-session'

export interface MySessionData extends Session, SessionData {
    [key: string]: any
    cookie: Cookie
    passport: any
}
