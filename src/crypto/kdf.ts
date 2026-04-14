/**
 * Derive AES-GCM 256-bit CryptoKey from user PIN and machine raw key.
 *
 * Uses PBKDF2 with:
 * - password: PIN (UTF-8)
 * - salt: machine raw key (Uint8Array)
 * - iterations: 200_000 (tunable)
 * - hash: SHA-256
 *
 * Returns a CryptoKey usable for AES-GCM encrypt/decrypt.
 */

import { getOrCreateRawMachineKey } from "./machineKey";

const PBKDF2_ITERATIONS = 200_000;

export async function deriveAesKeyFromPin(pin: string): Promise<CryptoKey> {
  if (typeof pin !== "string" || pin.length === 0) {
    throw new Error("PIN must be a non-empty string");
  }

  const rawMachineKey = await getOrCreateRawMachineKey();

  const enc = new TextEncoder();
  const pinBytes = enc.encode(pin);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    pinBytes,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: rawMachineKey,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    baseKey,
    256
  );

  return crypto.subtle.importKey(
    "raw",
    derivedBits,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}
