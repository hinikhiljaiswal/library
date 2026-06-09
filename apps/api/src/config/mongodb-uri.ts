const supportedMongoOptions = new Set([
  'appName',
  'authMechanism',
  'authSource',
  'connectTimeoutMS',
  'directConnection',
  'family',
  'journal',
  'maxIdleTimeMS',
  'maxPoolSize',
  'minPoolSize',
  'readConcernLevel',
  'readPreference',
  'replicaSet',
  'retryReads',
  'retryWrites',
  'serverSelectionTimeoutMS',
  'socketTimeoutMS',
  'ssl',
  'tls',
  'w',
  'wtimeoutMS',
]);

function normalizeAtlasDatabasePath(value: string) {
  const questionMarkIndex = value.indexOf('?');
  if (questionMarkIndex === -1) {
    return value;
  }

  const beforeQuery = value.slice(0, questionMarkIndex);
  const query = value.slice(questionMarkIndex + 1);
  const pathStartIndex = beforeQuery.indexOf('/', 'mongodb+srv://'.length);
  const hasDatabasePath = pathStartIndex !== -1 && beforeQuery.slice(pathStartIndex + 1).length > 0;

  if (hasDatabasePath) {
    return value;
  }

  const firstSegmentEnd = query.search(/[&?]/);
  const firstSegment = firstSegmentEnd === -1 ? query : query.slice(0, firstSegmentEnd);
  const [firstKey] = firstSegment.split('=');
  const looksLikeDatabaseName = firstKey && !supportedMongoOptions.has(firstKey);

  if (!looksLikeDatabaseName) {
    return value;
  }

  const remainingQuery = query.slice(firstSegment.length).replace(/^[&?]+/, '');
  return `${beforeQuery.replace(/\/$/, '')}/${firstKey}${remainingQuery ? `?${remainingQuery}` : ''}`;
}

export function getMongoDbUri(value?: string) {
  if (!value) {
    throw new Error('MONGODB_URI is required in apps/api/.env');
  }

  const normalizedValue = normalizeAtlasDatabasePath(value.trim());

  if (normalizedValue.includes('<') || normalizedValue.includes('>')) {
    throw new Error('MONGODB_URI still contains placeholder values. Replace username, password, and cluster first.');
  }

  const uri = new URL(normalizedValue);
  if (uri.protocol === 'mongodb+srv:' && !uri.hostname.endsWith('.mongodb.net')) {
    throw new Error(
      `Invalid MongoDB Atlas host "${uri.hostname}". Use the full Atlas cluster host, for example cluster0.xxxxx.mongodb.net.`,
    );
  }

  return normalizedValue;
}
