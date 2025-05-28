import { createMock } from '@golevelup/ts-jest';

import { fileStore } from './fileSessionStore.class'
import { FileSessionMetadata } from './sessionMetadata.interface'

describe('getStore()', () => {
    it('should create a file store', () => {
        const fileSessionMetadata = createMock<FileSessionMetadata>()
        fileSessionMetadata.fileStoreOptions = {
            filePath: '/tmp/mock-session-store.json',
        };
        expect(fileStore.getStore(fileSessionMetadata)).toBeDefined()
    })
})
