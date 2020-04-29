import { Request, Response } from 'express';
import { xuiNodeLib } from './index';

test('Auth', () => {
    const req = ({} as unknown) as Request;
    const res = ({} as unknown) as Response;
    const nextMock = jest.fn();
    xuiNodeLib({})(req, res, nextMock);
    expect(nextMock.mock.calls.length).toBe(1);
});
