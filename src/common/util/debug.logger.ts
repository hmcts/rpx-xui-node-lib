import debug from 'debug'

export interface XuiLogger {
    log: (...args: any[]) => any
    info: (...args: any[]) => any
    warn: (...args: any[]) => any
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
    // Make everything go to stdout so that AppInsights will pick it up in Traces
    logger.log = console.info.bind(console)
    return {
        log: logger,
        warn: logger,
        error: logger,
        info: logger,
    }
}
