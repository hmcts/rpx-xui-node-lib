import { auth } from './index';

test('Auth', () => {
    expect(auth('Carl')).toBe('Hello Carl');
});
