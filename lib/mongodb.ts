import { Db, MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("未配置 MONGODB_URI，请先在 .env.local 中填写 MongoDB 连接字符串。");
}

declare global {
  var __martinMongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(MONGODB_URI);
const clientPromise =
  globalThis.__martinMongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== "production") {
  globalThis.__martinMongoClientPromise = clientPromise;
}

export async function getMongoDb(): Promise<Db> {
  try {
    const connectedClient = await clientPromise;
    return connectedClient.db();
  } catch {
    throw new Error("MongoDB 连接失败，请检查 MONGODB_URI、网络和数据库权限。");
  }
}
