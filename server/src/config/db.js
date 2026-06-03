import mongoose from 'mongoose';

const globalCache = globalThis;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  if (!globalCache._mongoose) {
    globalCache._mongoose = { conn: null, promise: null };
  }

  const cached = globalCache._mongoose;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((mongooseInstance) => {
      console.log('MongoDB connected');
      return mongooseInstance;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};
