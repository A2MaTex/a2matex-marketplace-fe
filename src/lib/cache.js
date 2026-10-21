// src/lib/imageCache.js
import { openDB } from "idb";

const dbPromise = openDB("app-image-cache", 1, {
  upgrade(db) {
    db.createObjectStore("images");
  },
});

export async function getCachedImage(key) {
  const db = await dbPromise;
  return db.get("images", key);
}

export async function cacheImage(key, blob) {
  const db = await dbPromise;
  await db.put("images", blob, key);
}