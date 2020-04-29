import { xuiNodeLib } from './index';
import { Request, Response } from 'express';

test('Auth', () => {
  const req = ({} as unknown) as Request;
  const res = ({} as unknown) as Response;
    const nextMock = jest.fn();
    xuiNodeLib({})(req, res, nextMock);
    expect(nextMock.mock.calls.length).toBe(1);
});
