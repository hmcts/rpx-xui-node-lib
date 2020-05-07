import { Request, Response } from 'express';
import { XuiNodeLib } from './index';

test('Auth', () => {
    const instance = new XuiNodeLib();
    expect(instance).toBeDefined();
});
