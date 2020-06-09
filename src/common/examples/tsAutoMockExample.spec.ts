import { createMock } from 'ts-auto-mock'

interface Interface {
    a: string
    b: number
}

describe('Mock object created from an interface', () => {
    let mock: Interface

    beforeEach(() => {
        mock = createMock<Interface>()
    })

    it('should work', () => {
        expect(mock.a).toBe('')
    })
})
