import { Vault } from "../types";

/**
 * Promise-based wrapper around chrome.storage.local
 * Provides consistent error handling and typing.
 */

export async function storageGet<T = any>(keys: string | string[] | null = null): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(keys, (items) => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve(items as T);
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function storageSet(items: Record<string, any>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(items, () => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function storageRemove(keys: string | string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove(keys, () => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

/** Vault helpers */
export async function loadVault(): Promise<Vault> {
  const items = await storageGet<{ vault?: Vault }>(["vault"]);
  return items.vault ?? {};
}

export async function saveVault(vault: Vault): Promise<void> {
  await storageSet({ vault });
}
