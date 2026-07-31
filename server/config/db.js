import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;
let isConnecting = false;

const sanitizeMongoUri = (uri) => {
  try {
    const url = new URL(uri);
    const username = url.username ? '<username>' : '';
    const password = url.password ? '<password>' : '';
    const auth = username || password ? `${username}${password ? `:${password}` : ''}@` : '';
    return `${url.protocol}//${auth}${url.host}${url.pathname}${url.search}`;
  } catch {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//<username>:<password>@');
  }
};

const validateMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') {
    throw new Error('Missing MONGO_URI environment variable');
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('MONGO_URI must start with mongodb:// or mongodb+srv://');
  }

  if ((uri.match(/@/g) || []).length > 1) {
    throw new Error('MONGO_URI contains multiple @ symbols; check the username/password format.');
  }

  try {
    const parsed = new URL(uri);
    if (!parsed.hostname || parsed.hostname === '09') {
      throw new Error('MONGO_URI host is invalid. Expected a cluster host like cluster0.xxxxxx.mongodb.net');
    }
    if (!parsed.host.includes('mongodb.net') && !parsed.host.includes('mongo')) {
      console.warn('MONGO_URI host does not look like a MongoDB Atlas hostname. Please confirm the connection string.');
    }
  } catch (err) {
    throw new Error(`Invalid MONGO_URI format: ${err.message}`);
  }
};

const connectDB = async (attempt = 1) => {
  if (isConnecting) {
    return;
  }

  isConnecting = true;

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    validateMongoUri(mongoUri);

    console.log(`Connecting to MongoDB: ${sanitizeMongoUri(mongoUri)}`);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    isConnecting = false;
  } catch (err) {
    const message = err?.message || 'Unknown error';
    console.error(`❌ MongoDB connection error (attempt ${attempt}/${MAX_RETRIES}): ${message}`);

    if (attempt < MAX_RETRIES) {
      console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(() => {
        isConnecting = false;
        connectDB(attempt + 1);
      }, RETRY_DELAY_MS);
    } else {
      isConnecting = false;
      console.error('   Max retries reached. Exiting.');
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
  if (!isConnecting) {
    connectDB();
  }
});

export default connectDB;
