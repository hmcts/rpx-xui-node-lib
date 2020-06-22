import debug from 'debug'
import { callerPath } from './callerPath'
import * as path from 'path'

const debugLogger = debug('xuiNode')

export const logFn = (...args: any[]): any => {
    const calledPath = callerPath()
    const layers = calledPath.split(path.sep).slice(0, 2).join(':')
    const logger = debugLogger.extend(layers)
    logger(args)
}

//TODO: see if we can control colours per method instead of a generic function
export const logger = {
    log: logFn,
    error: logFn,
    info: logFn,
    warn: logFn,
}
