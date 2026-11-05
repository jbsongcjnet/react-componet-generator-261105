import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';

describe('useComponentGenerator 영속화', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

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
  });

  it('형식이 잘못된 항목은 버리고 유효한 컴포넌트만 복원한다', () => {
    localStorage.setItem(
      'rcg:components',
      JSON.stringify([
        null,
        42,
        { id: 'x', prompt: 'p', code: 'c' },
        { id: 'y', prompt: 'p', code: 'c', createdAt: 'not-a-date' },
        { id: 'ok', prompt: '카드', code: '<div/>', createdAt: '2026-01-02T03:04:05.000Z' },
      ]),
    );
    const { result } = renderHook(() => useComponentGenerator());
    expect(result.current.components.map((c) => c.id)).toEqual(['ok']);
  });

  it('컴포넌트는 최대 50개까지만 유지하고 오래된 것부터 버린다', async () => {
    const stored = Array.from({ length: 50 }, (_, i) => ({
      id: 'old' + i,
      prompt: 'p',
      code: 'c',
      createdAt: '2026-01-02T03:04:05.000Z',
    }));
    localStorage.setItem('rcg:components', JSON.stringify(stored));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: '<i/>' }) }),
    );
    const { result } = renderHook(() => useComponentGenerator());
    await act(() => result.current.generate('새것', undefined, 'google'));

    expect(result.current.components).toHaveLength(50);
    expect(result.current.components[0].prompt).toBe('새것');
    expect(result.current.components.map((c) => c.id)).not.toContain('old49');
  });
});
