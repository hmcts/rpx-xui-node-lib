import { hasKey } from './hasKey'

test('hasKey prop1', () => {
    expect(hasKey({ prop1: 'someValue' }, 'prop1')).toBeTruthy()
    expect(hasKey({ prop1: 'someValue' }, 'prop2')).toBeFalsy()
})
