import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';

describe('usePersistentState', () => {
  beforeEach(() => localStorage.clear());

  it('저장된 값이 없으면 초기값을 반환한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('localStorage에 저장된 값이 있으면 그 값을 복원한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('saved');
  });

  it('값을 바꾸면 localStorage에 JSON으로 저장한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    act(() => result.current[1]('changed'));
    expect(localStorage.getItem('k')).toBe(JSON.stringify('changed'));
  });

  it('저장된 JSON이 손상되었으면 초기값으로 되돌린다', () => {
    localStorage.setItem('k', '{broken');
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('init');
  });
});
