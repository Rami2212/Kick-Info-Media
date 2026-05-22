import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB_NAME || "lankachat";

if (!uri) {
  throw new Error("MONGODB_URI is missing");
}

type GlobalMongoCache = {
  client?: MongoClient;
  promise?: Promise<MongoClient>;
};

const globalCache = globalThis as typeof globalThis & { _lcMongo?: GlobalMongoCache };
const cache = globalCache._lcMongo || (globalCache._lcMongo = {});

export async function getMongoClient() {
  if (cache.client) return cache.client;
  if (!cache.promise) {
    cache.promise = new MongoClient(uri).connect();
  }
  cache.client = await cache.promise;
  return cache.client;
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}

