import { useEffect, useState } from 'react';

export function usePersistentState<T>(key: string, initial: T, revive?: (parsed: unknown) => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed: unknown = JSON.parse(raw);
      return revive ? revive(parsed) : (parsed as T);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장소 차단·용량 초과 시에도 메모리 상태로 계속 동작한다.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
