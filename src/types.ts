export type Uint8ArrayLike = Uint8Array | number[];

export type EncryptedRecord = {
  iv: number[]; // 12 bytes
  cipher: number[]; // ciphertext bytes
  createdAt: string; // ISO timestamp
  meta?: {
    title?: string;
    username?: string;
    note?: string;
  };
};

export type Vault = Record<string, EncryptedRecord>;

export class VaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VaultError";
  }
}
