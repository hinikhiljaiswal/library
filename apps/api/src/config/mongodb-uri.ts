export function getMongoDbUri(value?: string) {
  if (!value) {
    throw new Error('MONGODB_URI is required in apps/api/.env');
  }

  if (value.includes('<') || value.includes('>')) {
    throw new Error('MONGODB_URI still contains placeholder values. Replace username, password, and cluster first.');
  }

  const uri = new URL(value);
  if (uri.protocol === 'mongodb+srv:' && !uri.hostname.endsWith('.mongodb.net')) {
    throw new Error(
      `Invalid MongoDB Atlas host "${uri.hostname}". Use the full Atlas cluster host, for example cluster0.xxxxx.mongodb.net.`,
    );
  }

  return value;
}
