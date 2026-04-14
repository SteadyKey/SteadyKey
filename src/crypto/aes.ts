/**
 * AES-GCM encrypt/decrypt helpers
 *
 * - IV: 12 bytes random per encryption
 * - Tag length: default (128 bits) provided by WebCrypto
 */

export async function aesEncrypt(aesKey: CryptoKey, plainText: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const data = enc.encode(plainText);

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    aesKey,
    data
  );

  return {
    iv: Array.from(iv),
    cipher: Array.from(new Uint8Array(cipherBuffer))
  };
}

export async function aesDecrypt(aesKey: CryptoKey, ivArr: number[], cipherArr: number[]) {
  const iv = new Uint8Array(ivArr);
  const cipher = new Uint8Array(cipherArr);

  const plainBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv
    },
    aesKey,
    cipher
  );

  const dec = new TextDecoder();
  return dec.decode(plainBuffer);
}
