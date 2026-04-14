/**
 * Machine Key management
 *
 * - Internally generate and persist a 32-byte (256-bit) raw key.
 * - For display / storage convenience we also store a stretched representation (raw + SHA-512 -> base64)
 * - KDF should use the raw 32 bytes (Uint8Array) as salt/input.
 *
 * Storage keys:
 * - __asahi_machine_raw : number[] (32 bytes)
 * - __asahi_machine_stretched : string (base64, 100+ chars)
 *
 * Important: If the extension is uninstalled or storage cleared, raw key is lost and vault becomes unrecoverable.
 */
import { storageGet, storageSet } from "../utils/storage";
const RAW_KEY_STORAGE = "__asahi_machine_raw";
const STRETCHED_STORAGE = "__asahi_machine_stretched";
/** Generate cryptographically secure random 32 bytes */
function generateRawKey() {
    return crypto.getRandomValues(new Uint8Array(32));
}
/** Convert Uint8Array to number[] for storage */
function toNumberArray(u) {
    return Array.from(u);
}
/** Convert number[] to Uint8Array */
function fromNumberArray(arr) {
    if (!arr)
        return null;
    return new Uint8Array(arr);
}
/** Base64 (URL-safe) encode */
function base64Encode(bytes) {
    // btoa expects binary string
    let s = "";
    for (let i = 0; i < bytes.length; i++) {
        s += String.fromCharCode(bytes[i]);
    }
    return btoa(s);
}
/** Create a stretched display string (raw + SHA-512) -> base64 (length > 100) */
async function createStretchedString(raw) {
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-512", raw));
    const combined = new Uint8Array(raw.length + hash.length);
    combined.set(raw, 0);
    combined.set(hash, raw.length);
    return base64Encode(combined);
}
/** Public API */
/** Returns the raw 32-byte key (Uint8Array). Creates and persists if missing. */
export async function getOrCreateRawMachineKey() {
    const stored = await storageGet([RAW_KEY_STORAGE]);
    const rawArr = stored[RAW_KEY_STORAGE];
    if (rawArr && Array.isArray(rawArr) && rawArr.length === 32) {
        return fromNumberArray(rawArr);
    }
    // create
    const raw = generateRawKey();
    const stretched = await createStretchedString(raw);
    await storageSet({
        [RAW_KEY_STORAGE]: toNumberArray(raw),
        [STRETCHED_STORAGE]: stretched
    });
    return raw;
}
/** Returns the stretched display string (base64) if exists, otherwise creates it. */
export async function getStretchedMachineKeyForDisplay() {
    const stored = await storageGet([STRETCHED_STORAGE, RAW_KEY_STORAGE]);
    if (stored[STRETCHED_STORAGE]) {
        return stored[STRETCHED_STORAGE];
    }
    // If stretched missing but raw exists, create stretched
    const rawArr = stored[RAW_KEY_STORAGE];
    if (rawArr && rawArr.length === 32) {
        const raw = new Uint8Array(rawArr);
        const stretched = await createStretchedString(raw);
        await storageSet({ [STRETCHED_STORAGE]: stretched });
        return stretched;
    }
    // otherwise create both
    const raw = await getOrCreateRawMachineKey();
    return await createStretchedString(raw);
}
/** Forcibly delete machine key (dangerous) */
export async function deleteMachineKey() {
    await storageSet({ [RAW_KEY_STORAGE]: undefined, [STRETCHED_STORAGE]: undefined });
}
