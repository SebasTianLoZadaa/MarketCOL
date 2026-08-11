describe('database config defaults', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('uses fallback values when env vars are missing', () => {
    const { sequelize } = require('../config/database');

    expect(sequelize.config.database).toBe('ecommerce_db');
    expect(sequelize.config.username).toBe('root');
    expect(sequelize.config.password).toBe('');
    expect(sequelize.config.host).toBe('localhost');
    expect(sequelize.config.port).toBe(3306);
  });
});
