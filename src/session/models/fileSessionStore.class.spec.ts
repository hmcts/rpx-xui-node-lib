import { createMock } from 'ts-auto-mock'

import fileSessionStore from './fileSessionStore.class'
import { FileSessionMetadata } from './sessionMetadata.interface'

describe('getStore()', () => {
    it('should return', () => {
        const fileSessionMetadata = createMock<FileSessionMetadata>()
        expect(fileSessionStore.getStore(fileSessionMetadata)).toBeDefined()
    })
})
