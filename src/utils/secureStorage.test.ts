import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, createSecureStorage, type KeyStore } from './secureStorage';

describe('secureStorage', () => {
  it('암호화한 값을 복호화하면 원문이 나온다', async () => {
    const cipher = await encrypt('sk-ant-secret');
    expect(await decrypt(cipher)).toBe('sk-ant-secret');
  });

  it('암호문에는 원문이 그대로 드러나지 않는다', async () => {
    const cipher = await encrypt('sk-ant-secret');
    expect(cipher).not.toContain('sk-ant-secret');
  });

  it('손상되었거나 평문인 값은 null을 반환한다', async () => {
    expect(await decrypt('sk-ant-plaintext')).toBeNull();
    expect(await decrypt('AAAA.BBBB')).toBeNull();
  });

  it('같은 키 저장소를 쓰면 새 인스턴스(새로고침)에서도 복호화된다', async () => {
    let saved: CryptoKey | undefined;
    const store: KeyStore = { load: async () => saved, save: async (k) => void (saved = k) };

    const cipher = await createSecureStorage(store).encrypt('sk-ant-secret');
    const afterReload = createSecureStorage(store);
    expect(await afterReload.decrypt(cipher)).toBe('sk-ant-secret');
  });
});
