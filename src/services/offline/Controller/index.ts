import type { OfflineDeck, PendingAnswer } from "../Model";
import type { StudyCard } from "@/features/Vocabulary/Model";

const DB_NAME = "english-journey-offline";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("decks")) database.createObjectStore("decks", { keyPath: "key" });
      if (!database.objectStoreNames.contains("pending")) database.createObjectStore("pending", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function write(storeName: "decks" | "pending", method: "put" | "delete", value: OfflineDeck | PendingAnswer | string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      if (method === "put") store.put(value); else store.delete(value as string);
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
  } finally { database.close(); }
}

async function readOne<T>(storeName: "decks" | "pending", key: string): Promise<T | undefined> {
  const database = await openDatabase();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const request = database.transaction(storeName, "readonly").objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result as T | undefined); request.onerror = () => reject(request.error);
    });
  } finally { database.close(); }
}

async function readAll<T>(storeName: "decks" | "pending"): Promise<T[]> {
  const database = await openDatabase();
  try {
    return await new Promise<T[]>((resolve, reject) => {
      const request = database.transaction(storeName, "readonly").objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result as T[]); request.onerror = () => reject(request.error);
    });
  } finally { database.close(); }
}

export function deckKey(ownerId: string, mode: string, level: string, lessonId?: string): string { return `${ownerId}:${mode}:${lessonId ?? level}`; }
export async function saveDeck(ownerId: string, key: string, cards: StudyCard[]) { await write("decks", "put", { ownerId, key, cards, savedAt: Date.now() }); }
export async function getDeck(ownerId: string, key: string): Promise<StudyCard[] | null> {
  const deck = await readOne<OfflineDeck>("decks", key);
  if (!deck || deck.ownerId !== ownerId || Date.now() - deck.savedAt > 30 * 24 * 60 * 60 * 1000) return null;
  return deck.cards;
}
export async function enqueueAnswer(answer: PendingAnswer) { await write("pending", "put", answer); }
export async function syncPending(ownerId: string): Promise<number> {
  if (!navigator.onLine) return 0;
  const pending = (await readAll<PendingAnswer>("pending")).filter((item) => item.ownerId === ownerId).sort((a, b) => a.queuedAt - b.queuedAt);
  let synced = 0;
  for (const answer of pending) {
    const response = await fetch("/api/v1/vocabulary/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(answer) });
    if (!response.ok) break;
    const body = await response.json() as { success: boolean };
    if (!body.success) break;
    await write("pending", "delete", answer.id); synced++;
  }
  return synced;
}
export async function clearOfflineUser(ownerId: string) {
  const [decks, pending] = await Promise.all([readAll<OfflineDeck>("decks"), readAll<PendingAnswer>("pending")]);
  await Promise.all([...decks.filter((item) => item.ownerId === ownerId).map((item) => write("decks", "delete", item.key)), ...pending.filter((item) => item.ownerId === ownerId).map((item) => write("pending", "delete", item.id))]);
}
