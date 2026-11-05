import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { encrypt, decrypt } from './utils/secureStorage';

function mockFetch(generate: () => unknown = () => ({ code: '<div/>' })) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url === '/api/config' ? { envKeys: { anthropic: false, google: false } } : generate(),
    })),
  );
}

describe('App 상태 영속화', () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetch();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('저장된 Provider와 암호화된 API 키를 복원한다', async () => {
    localStorage.setItem('rcg:provider', JSON.stringify('anthropic'));
    localStorage.setItem('rcg:apiKey', await encrypt('sk-ant-saved'));
    render(<App />);

    expect(screen.getByLabelText('Provider')).toHaveValue('anthropic');
    await waitFor(() => expect(screen.getByLabelText('API Key')).toHaveValue('sk-ant-saved'));
    // 복원 과정에서 저장된 키가 지워지지 않고 여전히 복호화 가능해야 한다.
    expect(await decrypt(localStorage.getItem('rcg:apiKey') as string)).toBe('sk-ant-saved');
  });

  it('API 키를 입력하면 평문이 아닌 암호문으로 저장한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('API Key'), 'AIza-typed');
    await waitFor(() => expect(localStorage.getItem('rcg:apiKey')).not.toBeNull());
    const stored = localStorage.getItem('rcg:apiKey') as string;
    expect(stored).not.toContain('AIza');
    expect(await decrypt(stored)).toBe('AIza-typed');
  });

  it('API 키를 지우면 저장된 값도 삭제한다', async () => {
    localStorage.setItem('rcg:apiKey', await encrypt('AIza-old'));
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByLabelText('API Key')).toHaveValue('AIza-old'));
    await user.clear(screen.getByLabelText('API Key'));
    await waitFor(() => expect(localStorage.getItem('rcg:apiKey')).toBeNull());
  });

  it('Provider를 바꾸면 localStorage에 저장한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText('Provider'), 'anthropic');
    expect(localStorage.getItem('rcg:provider')).toBe(JSON.stringify('anthropic'));
  });

  it('생성한 프롬프트를 히스토리에 저장하고, 새로고침 후에도 보여준다', async () => {
    const user = userEvent.setup();
    const first = render(<App />);

    await user.type(screen.getByLabelText('API Key'), 'AIza-key');
    await user.type(screen.getByPlaceholderText(/고객 목록 테이블/), '로그인 폼');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    await screen.findByText('생성된 컴포넌트');
    expect(JSON.parse(localStorage.getItem('rcg:history') ?? '[]')).toEqual(['로그인 폼']);

    first.unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: '로그인 폼' })).toBeInTheDocument();
  });

  it('저장된 Provider가 알 수 없는 값이면 기본값(Google)으로 복원한다', () => {
    localStorage.setItem('rcg:provider', JSON.stringify('bogus'));
    render(<App />);

    expect(screen.getByLabelText('Provider')).toHaveValue('google');
  });

  it('저장된 히스토리가 배열이 아니면 빈 히스토리로 시작한다', () => {
    localStorage.setItem('rcg:history', JSON.stringify('not-an-array'));
    render(<App />);

    expect(screen.queryByText('최근 프롬프트')).not.toBeInTheDocument();
  });

  it('복원이 끝나기 전에는 저장된 API 키를 지우지 않는다', async () => {
    localStorage.setItem('rcg:apiKey', await encrypt('AIza-keep'));
    const removeItem = vi.spyOn(localStorage, 'removeItem');
    render(<App />);

    await waitFor(() => expect(screen.getByLabelText('API Key')).toHaveValue('AIza-keep'));
    expect(removeItem).not.toHaveBeenCalledWith('rcg:apiKey');
  });
});
