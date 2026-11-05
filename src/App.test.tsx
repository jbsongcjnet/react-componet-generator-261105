import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

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

  it('저장된 Provider와 API 키를 복원한다', () => {
    localStorage.setItem('rcg:provider', JSON.stringify('anthropic'));
    localStorage.setItem('rcg:apiKey', JSON.stringify('sk-ant-saved'));
    render(<App />);

    expect(screen.getByLabelText('Provider')).toHaveValue('anthropic');
    expect(screen.getByLabelText('API Key')).toHaveValue('sk-ant-saved');
  });

  it('API 키를 입력하면 localStorage에 저장한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('API Key'), 'AIza-typed');
    expect(localStorage.getItem('rcg:apiKey')).toBe(JSON.stringify('AIza-typed'));
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
    await user.type(screen.getByRole('textbox', { name: '' }), '로그인 폼');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    await screen.findByText('생성된 컴포넌트');
    expect(JSON.parse(localStorage.getItem('rcg:history') ?? '[]')).toEqual(['로그인 폼']);

    first.unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: '로그인 폼' })).toBeInTheDocument();
  });
});
