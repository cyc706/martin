import { Db, MongoClient } from "mongodb";

const mongoUri = (() => {
  const value = process.env.MONGODB_URI;
  if (!value) {
    throw new Error("未配置 MONGODB_URI，请先在 .env.local 中填写 MongoDB 连接字符串。");
  }
  return value;
})();

declare global {
  var __martinMongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoClientPromise() {
  if (!globalThis.__martinMongoClientPromise) {
    const client = new MongoClient(mongoUri);
    globalThis.__martinMongoClientPromise = client.connect();
  }

  return globalThis.__martinMongoClientPromise;
}

export async function getMongoDb(): Promise<Db> {
  try {
    const connectedClient = await getMongoClientPromise();
    return connectedClient.db();
  } catch {
    throw new Error("MongoDB 连接失败，请检查 MONGODB_URI、网络和数据库权限。");
  }
}
