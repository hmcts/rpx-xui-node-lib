import { createMock } from 'ts-auto-mock'

import { fileStore } from './fileSessionStore.class'
import { FileSessionMetadata } from './sessionMetadata.interface'

describe('getStore()', () => {
    it('should return', () => {
        const fileSessionMetadata = createMock<FileSessionMetadata>()
        expect(fileStore.getStore(fileSessionMetadata)).toBeDefined()
    })
})
