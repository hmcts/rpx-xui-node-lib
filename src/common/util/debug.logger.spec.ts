import debug from 'debug'
import { getLogger } from './debug.logger'

describe('debug logger', () => {
    const originalConsoleInfo = console.info

    afterEach(() => {
        debug.disable()
        console.info = originalConsoleInfo
    })

    it('uses the current console.info when debug output is written', () => {
        const initialConsoleInfo = jest.fn()
        const patchedConsoleInfo = jest.fn()

        debug.enable('xuiNode:*')
        console.info = initialConsoleInfo

        const logger = getLogger('auth:oidc')

        console.info = patchedConsoleInfo
        logger.log('unauthenticated')

        expect(initialConsoleInfo).not.toHaveBeenCalled()
        expect(patchedConsoleInfo).toHaveBeenCalled()
    })
})
