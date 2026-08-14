import { shouldBlockDeleteAction } from './permissions';

describe('shouldBlockDeleteAction', () => {
  test('bloquea acciones de eliminación para auxiliares', () => {
    expect(shouldBlockDeleteAction('auxiliar')).toBe(true);
  });

  test('permite eliminación para administradores', () => {
    expect(shouldBlockDeleteAction('administrador')).toBe(false);
  });
});
