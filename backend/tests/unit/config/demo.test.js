const {
  DEMO_DATABASE_NAME,
  replaceDatabaseName,
  resolveDemoUri,
} = require('@config/demo');

describe('demo database configuration', () => {
  test('uses an explicitly configured demo URI', () => {
    expect(resolveDemoUri({
      demoUri: 'mongodb://localhost:27017/custom-demo',
      productionUri: 'mongodb://localhost:27017/production',
    })).toBe('mongodb://localhost:27017/custom-demo');
  });

  test('replaces the production database while preserving query options', () => {
    expect(replaceDatabaseName(
      'mongodb+srv://user:password@cluster.example/burger?retryWrites=true'
    )).toBe(
      'mongodb+srv://user:password@cluster.example/burger-demo?retryWrites=true'
    );
  });

  test('uses a dedicated local database when no URI is configured', () => {
    expect(resolveDemoUri()).toBe(`mongodb://localhost:27017/${DEMO_DATABASE_NAME}`);
  });
});
