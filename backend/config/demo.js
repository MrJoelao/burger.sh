const DEMO_DATABASE_NAME = 'burger-demo';

function replaceDatabaseName(uri, databaseName = DEMO_DATABASE_NAME) {
  const [baseUri, query = ''] = uri.split('?');
  const separatorIndex = baseUri.lastIndexOf('/');

  if (separatorIndex === -1 || separatorIndex === baseUri.length - 1) {
    return `${baseUri}/${databaseName}${query ? `?${query}` : ''}`;
  }

  const databasePath = baseUri.slice(0, separatorIndex + 1);
  return `${databasePath}${databaseName}${query ? `?${query}` : ''}`;
}

function resolveDemoUri({ demoUri, productionUri } = {}) {
  if (demoUri) {
    return demoUri;
  }

  if (productionUri) {
    return replaceDatabaseName(productionUri);
  }

  return `mongodb://localhost:27017/${DEMO_DATABASE_NAME}`;
}

module.exports = {
  DEMO_DATABASE_NAME,
  replaceDatabaseName,
  resolveDemoUri,
};
