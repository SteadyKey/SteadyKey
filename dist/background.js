"use strict";
/**
 * Background service worker (MV3)
 *
 * Minimal responsibilities:
 * - Provide runtime message handlers for other parts (popup) if needed.
 * - Keep background lightweight.
 *
 * Note: In MV3 the background is a service worker; keep synchronous work minimal.
 */
chrome.runtime.onInstalled.addListener(() => {
    console.info("Asahi Password Vault installed/updated.");
});
/** Example message handler (optional) */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "PING") {
        sendResponse({ ok: true, ts: Date.now() });
        return true;
    }
});
