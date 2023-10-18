import debug from 'debug'

export interface XuiLogger {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    log: (...args: any[]) => any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info: (...args: any[]) => any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warn: (...args: any[]) => any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: (...args: any[]) => any
}

const cache: Map<string, debug.Debugger> = new Map<string, debug.Debugger>()

let color = 1

export const getLogger = (namespace: string, delimiter = ':'): XuiLogger => {
    let logger: debug.Debugger = debug('xuiNode')
    namespace.split(delimiter).forEach((newNamespace: string) => {
        if (!cache.has(newNamespace)) {
            const newLogger = logger.extend(newNamespace)
            newLogger.color = String(color)
            cache.set(newNamespace, newLogger)
            color += 1
        }
        logger = cache.get(newNamespace) as debug.Debugger
    })

    return {
        log: logger,
        warn: logger,
        error: logger,
        info: logger,
    }
}
