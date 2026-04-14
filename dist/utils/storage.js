/**
 * Promise-based wrapper around chrome.storage.local
 * Provides consistent error handling and typing.
 */
export async function storageGet(keys = null) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(keys, (items) => {
                const err = chrome.runtime.lastError;
                if (err) {
                    reject(new Error(err.message));
                    return;
                }
                resolve(items);
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
export async function storageSet(items) {
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
        }
        catch (e) {
            reject(e);
        }
    });
}
export async function storageRemove(keys) {
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
        }
        catch (e) {
            reject(e);
        }
    });
}
/** Vault helpers */
export async function loadVault() {
    const items = await storageGet(["vault"]);
    return items.vault ?? {};
}
export async function saveVault(vault) {
    await storageSet({ vault });
}
