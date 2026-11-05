import { useEffect, useState } from 'react';
import { encrypt, decrypt } from '../utils/secureStorage';

/** 문자열 상태를 암호화해 localStorage에 유지한다. 복호화가 끝나기 전에는 저장하지 않는다. */
export function useEncryptedState(key: string) {
  const [value, setValue] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let restored: string | null = null;
      try {
        const raw = localStorage.getItem(key);
        if (raw) restored = await decrypt(raw);
      } catch {
        // 저장소 접근 불가 시 빈 값으로 시작한다.
      }
      if (cancelled) return;
      if (restored) setValue(restored);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      try {
        if (value) localStorage.setItem(key, await encrypt(value));
        else localStorage.removeItem(key);
      } catch {
        // 저장 실패 시에도 메모리 상태로 계속 동작한다.
      }
    })();
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}
