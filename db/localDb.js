import * as SQLite from "expo-sqlite";

let db = null;

export async function initLocalDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("comments.db");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY,
        post_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        text TEXT,
        created_at TEXT NOT NULL,
        file_uri TEXT,
        photo_uri TEXT
      );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_comments (
        local_id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        file_uri TEXT,
        photo_uri TEXT
      );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS post_likes (
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, post_id)
      );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_postlikes (
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, post_id)
      );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        likescount INTEGER NOT NULL
      );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_posts (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        likescount INTEGER NOT NULL
      );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        email TEXT NOT NULL,
        username TEXT NOT NULL,
        avatar_url TEXT,
        created_at TEXT NOT NULL,
        homepage TEXT
      );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_users (
        id INTEGER PRIMARY KEY,
        email TEXT NOT NULL,
        username TEXT NOT NULL,
        avatar_url TEXT,
        created_at TEXT NOT NULL,
        homepage TEXT
      );
    `);
  }

  return db;
}
export async function syncCommentToDb(comment) {
  const db = await initLocalDb();
  try {
    const result = await db.runAsync(
      `INSERT OR REPLACE INTO comments (id, post_id, author_id, text, created_at, file_uri, photo_uri) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        comment.id,
        comment.post_id,
        comment.author_id,
        comment.text,
        comment.created_at,
        comment.file_uri,
        comment.photo_uri,
      ]
    );
    return result;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}

export async function getCommentsByPostId(post_id) {
  const db = await initLocalDb();
  try {
    const rows = await db.getAllAsync(`SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC LIMIT 25`, [
      post_id,
    ]);
    return rows;
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
}
export async function addPost(post) {
  const db = await initLocalDb();
  try {
    const result = await db.runAsync(
      `INSERT OR REPLACE INTO posts (id, user_id, text, created_at, likescount)
       VALUES (?, ?, ?, ?, ?)`,
      [post.id, post.user_id, post.text, post.created_at, post.likescount]
    );
    return result;
  } catch (error) {
    console.error("Error adding post:", error);
    throw error;
  }
}

export async function addUser(user) {
  const db = await initLocalDb();
  return db.runAsync(
    `INSERT OR REPLACE INTO users (id, email, username, avatar_url, created_at, homepage)
     VALUES (?, ?, ?, ?, ?, ?)`,
    user.id,
    user.email,
    user.username,
    user.avatar_url,
    user.created_at,
    user.homepage
  );
}
export const getLocalUserId = async (email) => {
  const db = await initLocalDb();
  try {
    const rows = await db.getAllAsync("SELECT id FROM users WHERE email = ?", [email]);
    if (rows.length > 0) {
      return rows[0].id;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Ошибка при получении ID пользователя:", error);
    throw error;
  }
};
export async function getPostsFromDb() {
  const db = await initLocalDb();
  try {
    const rows = await db.getAllAsync(`
      SELECT 
        posts.id,
        posts.user_id,
        posts.text,
        posts.likescount,
        posts.created_at,
        users.username,
        users.avatar_url,
        users.homepage,
        users.email
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC
    `);
    return rows;
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
}
export async function addPostLike(like) {
  const db = await initLocalDb();
  await db.runAsync(`INSERT OR REPLACE INTO post_likes (user_id, post_id) VALUES (?, ?)`, [like.user_id, like.post_id]);
}
export async function debugLogAllUsers() {
  const db = await initLocalDb();
  try {
    const rows = await db.getAllAsync(`SELECT * FROM posts`);
    console.log("Все комментарии в БД:", rows);
    return rows;
  } catch (error) {
    console.error("Ошибка при получении комментариев:", error);
    throw error;
  }
}
export async function likePostOffline(postId, userId) {
  const db = await initLocalDb();
  const likeCheck = await db.getAllAsync("SELECT 1 FROM post_likes WHERE user_id = ? AND post_id = ?", [
    userId,
    postId,
  ]);
  if (likeCheck.length > 0) {
    return { error: "User has already liked this post" };
  }
  await db.runAsync("INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)", [userId, postId]);
  await db.runAsync("UPDATE posts SET likescount = likescount + 1 WHERE id = ?", [postId]);
  await db.runAsync("INSERT INTO pending_postlikes (user_id, post_id) VALUES (?, ?)", [userId, postId]);
  const posts = await db.getAllAsync(
    `
    SELECT 
      posts.id,
      posts.user_id,
      posts.text,
      posts.likescount,
      posts.created_at,
      users.username,
      users.avatar_url,
      users.homepage,
      users.email
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.id = ?
    `,
    [postId]
  );

  return posts[0];
}
export async function createPostOffline(user_id, text) {
  const db = await initLocalDb();
  try {
    await db.runAsync("BEGIN TRANSACTION");
    await db.runAsync(`INSERT INTO posts (user_id, text, likescount, created_at) VALUES (?, ?, 0, datetime('now'))`, [
      user_id,
      text,
    ]);
    await db.runAsync(
      `INSERT INTO pending_posts (user_id, text, created_at, likescount) VALUES (?, ?, datetime('now'), 0)`,
      [user_id, text]
    );
    await db.runAsync("COMMIT");
    const inserted = await db.getAllAsync(
      `SELECT * FROM posts WHERE user_id = ? AND text = ? ORDER BY created_at DESC LIMIT 1`,
      [user_id, text]
    );
    return inserted[0];
  } catch (error) {
    await db.runAsync("ROLLBACK");
    console.error("createPostOffline error:", error);
    throw error;
  }
}
export async function getCommentsByPostIdOffline(post_id) {
  const db = await initLocalDb();
  if (!post_id) {
    throw new Error("post_id is required");
  }
  try {
    const query = `
      SELECT 
        comments.*,
        users.username,
        users.avatar_url,
        users.email,
        users.homepage
      FROM comments
      JOIN users ON comments.author_id = users.id
      WHERE comments.post_id = ?
      ORDER BY comments.created_at DESC
    `;
    const rows = await db.getAllAsync(query, [post_id]);
    return rows;
  } catch (error) {
    console.error("Error fetching local comments:", error.message);
    throw error;
  }
}
export async function addCommentOffline(post_id, author_id, text, file_uri = null, photo_uri = null) {
  if (!post_id || !author_id || !text) {
    throw new Error("post_id, author_id, and text are required");
  }
  const db = await initLocalDb();
  try {
    await db.runAsync("BEGIN TRANSACTION");
    const created_at = new Date().toISOString();
    const tempId = -Date.now();
    await db.runAsync(
      `INSERT INTO comments (id, post_id, author_id, text, created_at, file_uri, photo_uri)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tempId, post_id, author_id, text, created_at, file_uri, photo_uri]
    );
    await db.runAsync(
      `INSERT INTO pending_comments (post_id, author_id, text, created_at, file_uri, photo_uri)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [post_id, author_id, text, created_at, file_uri, photo_uri]
    );
    await db.runAsync("COMMIT");
    return {
      id: tempId,
      post_id,
      author_id,
      text,
      created_at,
      file_uri,
      photo_uri,
    };
  } catch (error) {
    await db.runAsync("ROLLBACK");
    console.error("addCommentOffline error:", error);
    throw error;
  }
}
export async function syncPendingDataToServer() {
  const db = await initLocalDb();

  try {
    const pendingComments = await db.getAllAsync(`SELECT * FROM pending_comments`);
    const pendingPostlikes = await db.getAllAsync(`SELECT * FROM pending_postlikes`);
    const pendingPosts = await db.getAllAsync(`SELECT * FROM pending_posts`);

    const sendJson = async (url, payload) => {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Ошибка отправки в ${url}: ${response.statusText}`);
      }
    };

    for (const comment of pendingComments) {
      await sendJson("https://comments-server-production.up.railway.app/comments/create", comment);
    }

    for (const like of pendingPostlikes) {
      await sendJson("https://comments-server-production.up.railway.app/post/like", like);
    }

    for (const post of pendingPosts) {
      await sendJson("https://comments-server-production.up.railway.app/post/createpost", post);
    }

    await db.runAsync("DELETE FROM pending_comments");
    await db.runAsync("DELETE FROM pending_postlikes");
    await db.runAsync("DELETE FROM pending_posts");

    console.log("Синхронизация прошла успешно");
  } catch (error) {
    console.error("Ошибка при синхронизации данных:", error);
  }
}
export async function resetLocalDb() {
  const db = await initLocalDb();

  try {
    await db.runAsync("DELETE FROM comments");
    await db.runAsync("DELETE FROM pending_comments");
    await db.runAsync("DELETE FROM post_likes");
    await db.runAsync("DELETE FROM pending_postlikes");
    await db.runAsync("DELETE FROM posts");
    await db.runAsync("DELETE FROM pending_posts");
    await db.runAsync("DELETE FROM users");
    await db.runAsync("DELETE FROM pending_users");

    console.log("База данных очищена успешно!");
  } catch (error) {
    console.error("Ошибка при очистке базы данных:", error);
  }
}
