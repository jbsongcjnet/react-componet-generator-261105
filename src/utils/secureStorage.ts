export interface KeyStore {
  load(): Promise<CryptoKey | undefined>;
  save(key: CryptoKey): Promise<void>;
}

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export function createSecureStorage(store: KeyStore) {
  let keyPromise: Promise<CryptoKey> | undefined;

  const getKey = () =>
    (keyPromise ??= (async () => {
      const existing = await store.load();
      if (existing) return existing;
      // extractable=false: 키 원문은 JS에서 읽을 수 없다.
      const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
        'encrypt',
        'decrypt',
      ]);
      await store.save(key);
      return key;
    })());

  return {
    async encrypt(plain: string): Promise<string> {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = new TextEncoder().encode(plain);
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await getKey(), data);
      return `${toBase64(iv)}.${toBase64(new Uint8Array(ct))}`;
    },

    async decrypt(cipher: string): Promise<string | null> {
      try {
        const [iv, ct] = cipher.split('.');
        const plain = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: fromBase64(iv) },
          await getKey(),
          fromBase64(ct),
        );
        return new TextDecoder().decode(plain);
      } catch {
        return null;
      }
    },
  };
}

function memoryKeyStore(): KeyStore {
  let key: CryptoKey | undefined;
  return { load: async () => key, save: async (k) => void (key = k) };
}

function indexedDbKeyStore(): KeyStore {
  const open = () =>
    new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('rcg-secure', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('keys');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  const run = async <T,>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => {
    const db = await open();
    return new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction('keys', mode).objectStore('keys'));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  };
  return {
    load: () => run<CryptoKey | undefined>('readonly', (s) => s.get('aes')),
    save: async (key) => void (await run('readwrite', (s) => s.put(key, 'aes'))),
  };
}

// IndexedDB가 없는 환경(테스트 등)에서는 메모리 키로 대체한다. 이 경우 새로고침 후 복호화는 실패(null)한다.
const defaultStorage = createSecureStorage(
  typeof indexedDB === 'undefined' ? memoryKeyStore() : indexedDbKeyStore(),
);

export const { encrypt, decrypt } = defaultStorage;
