/**
 * Vault operations: save, load, list, delete entries.
 * Uses deriveAesKeyFromPin + aesEncrypt/aesDecrypt.
 *
 * Vault schema stored in chrome.storage.local under key "vault".
 */
import { VaultError } from "./types";
import { loadVault, saveVault } from "./utils/storage";
import { deriveAesKeyFromPin } from "./crypto/kdf";
import { aesEncrypt, aesDecrypt } from "./crypto/aes";
/** Create or update an entry */
export async function saveEntry(id, pin, plainPassword, meta) {
    if (!id)
        throw new VaultError("id is required");
    if (!plainPassword)
        throw new VaultError("plainPassword is required");
    const aesKey = await deriveAesKeyFromPin(pin);
    const encrypted = await aesEncrypt(aesKey, plainPassword);
    const record = {
        iv: encrypted.iv,
        cipher: encrypted.cipher,
        createdAt: new Date().toISOString(),
        meta: meta ?? {}
    };
    const vault = await loadVault();
    vault[id] = record;
    await saveVault(vault);
}
/** Load and decrypt an entry */
export async function loadEntry(id, pin) {
    const vault = await loadVault();
    const record = vault[id];
    if (!record)
        throw new VaultError("Entry not found");
    try {
        const aesKey = await deriveAesKeyFromPin(pin);
        const plain = await aesDecrypt(aesKey, record.iv, record.cipher);
        return plain;
    }
    catch (e) {
        // Could be wrong PIN or tampered data
        throw new VaultError("Failed to decrypt entry. PIN may be incorrect or data corrupted.");
    }
}
/** List metadata only (do not decrypt) */
export async function listEntries() {
    const vault = await loadVault();
    return Object.entries(vault).map(([id, rec]) => ({
        id,
        meta: rec.meta,
        createdAt: rec.createdAt
    }));
}
/** Delete entry */
export async function deleteEntry(id) {
    const vault = await loadVault();
    if (!vault[id])
        throw new VaultError("Entry not found");
    delete vault[id];
    await saveVault(vault);
}
