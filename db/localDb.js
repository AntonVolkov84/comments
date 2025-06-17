import * as SQLite from "expo-sqlite";

async function initLocalDb() {
  const db = await SQLite.openDatabaseAsync("comments.db");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY NOT NULL,
      text TEXT NOT NULL,
      tags TEXT,
      createdAt TEXT NOT NULL,
      synced INTEGER NOT NULL
    );
  `);

  return db;
}

export default initLocalDb;
