import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';

describe('useComponentGenerator 영속화', () => {
  beforeEach(() => localStorage.clear());

  it('저장된 컴포넌트를 복원하고 createdAt을 Date로 되살린다', () => {
    localStorage.setItem(
      'rcg:components',
      JSON.stringify([
        { id: '1', prompt: '카드', code: '<div/>', createdAt: '2026-01-02T03:04:05.000Z' },
      ]),
    );
    const { result } = renderHook(() => useComponentGenerator());
    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].createdAt).toBeInstanceOf(Date);
  });

  it('생성에 성공하면 컴포넌트 목록을 localStorage에 저장한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: '<b/>' }) }),
    );
    const { result } = renderHook(() => useComponentGenerator());
    await act(() => result.current.generate('버튼', undefined, 'google'));
    const saved = JSON.parse(localStorage.getItem('rcg:components') ?? '[]');
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ prompt: '버튼', code: '<b/>' });
    vi.unstubAllGlobals();
  });
});
