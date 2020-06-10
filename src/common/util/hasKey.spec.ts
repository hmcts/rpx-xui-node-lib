import { hasKey } from './hasKey'

test('oAuth2 Strategy factory', () => {
    expect(hasKey({ prop1: 'someValue' }, 'prop1')).toBeTruthy()
    expect(hasKey({ prop1: 'someValue' }, 'prop2')).toBeFalsy()
})
