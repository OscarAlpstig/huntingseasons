const DB_NAME = 'huntingseasons-offline-v1';
const STORE = 'records';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Lagringen används av en äldre appversion.'));
  });
}

async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = operation(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error ?? request.error ?? new Error('Lagring misslyckades.')); };
  });
}

export const storage = {
  get: <T>(key: string) => transaction('readonly', (store) => store.get(key)) as Promise<T | undefined>,
  put: (key: string, value: unknown) => transaction('readwrite', (store) => store.put(value, key)),
  remove: (key: string) => transaction('readwrite', (store) => store.delete(key)),
  all: <T>() => transaction('readonly', (store) => store.getAll()) as Promise<T[]>,
};
