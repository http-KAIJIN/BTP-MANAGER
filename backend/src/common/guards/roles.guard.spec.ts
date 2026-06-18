import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  it('allows users with at least one required role', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(['administrator']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [{ code: 'administrator' }] } }),
      }),
    } as never;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies users without required roles', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(['administrator']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: [{ code: 'viewer' }] } }),
      }),
    } as never;

    expect(guard.canActivate(context)).toBe(false);
  });
});
