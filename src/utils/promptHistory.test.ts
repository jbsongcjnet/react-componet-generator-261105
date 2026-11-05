import { describe, it, expect } from 'vitest';
import { addToHistory } from './promptHistory';

describe('addToHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToHistory(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('이미 있는 프롬프트는 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addToHistory(['b', 'a'], 'a')).toEqual(['a', 'b']);
  });

  it('최대 10개까지만 유지하고 오래된 것부터 버린다', () => {
    const full = Array.from({ length: 10 }, (_, i) => 'p' + i);
    const next = addToHistory(full, 'new');
    expect(next).toHaveLength(10);
    expect(next[0]).toBe('new');
    expect(next).not.toContain('p9');
  });
});
