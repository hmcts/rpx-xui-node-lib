export * from './auth'
export * from './session'
export * from './common'

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            isRefresh?: boolean
        }
    }
}
