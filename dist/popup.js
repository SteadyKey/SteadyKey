/**
 * Popup UI logic
 *
 * - Handles PIN entry, listing entries, viewing (decrypting) a single entry, adding a new entry, deleting.
 * - UI is intentionally minimal; keep crypto operations off the main UI thread as much as possible.
 *
 * This file assumes it will be transpiled to dist/ui/popup.js and popup.html will include it.
 */
import { getStretchedMachineKeyForDisplay } from "./crypto/machineKey";
import { listEntries, loadEntry, saveEntry, deleteEntry } from "./vault";
function $(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Missing element: ${id}`);
    return el;
}
async function renderMachineKeyDisplay() {
    try {
        const el = $("machineKeyDisplay");
        const stretched = await getStretchedMachineKeyForDisplay();
        el.textContent = stretched;
    }
    catch (e) {
        console.error("Failed to load machine key for display", e);
    }
}
async function renderList() {
    const listEl = $("entryList");
    listEl.innerHTML = "";
    try {
        const entries = await listEntries();
        if (entries.length === 0) {
            listEl.textContent = "No entries";
            return;
        }
        for (const e of entries) {
            const row = document.createElement("div");
            row.className = "entryRow";
            const title = e.meta?.title ?? e.id;
            row.innerHTML = `
        <div class="entryTitle">${escapeHtml(title)}</div>
        <div class="entryActions">
          <button data-id="${escapeHtml(e.id)}" class="viewBtn">View</button>
          <button data-id="${escapeHtml(e.id)}" class="delBtn">Delete</button>
        </div>
      `;
            listEl.appendChild(row);
        }
    }
    catch (err) {
        listEl.textContent = "Failed to load entries";
        console.error(err);
    }
}
function escapeHtml(s) {
    if (!s)
        return "";
    return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
async function handleView(id, pin) {
    try {
        const plain = await loadEntry(id, pin);
        // show in UI
        const out = $("output");
        out.textContent = `ID: ${id}\nPassword: ${plain}`;
    }
    catch (e) {
        const out = $("output");
        out.textContent = e.message;
    }
}
async function handleDelete(id) {
    if (!confirm("Delete this entry?"))
        return;
    try {
        await deleteEntry(id);
        await renderList();
    }
    catch (e) {
        alert("Failed to delete: " + e.message);
    }
}
async function handleAdd(pin) {
    const idInput = $("newId");
    const pwInput = $("newPassword");
    const titleInput = $("newTitle");
    const id = idInput.value.trim();
    const pw = pwInput.value;
    const title = titleInput.value.trim();
    if (!id || !pw) {
        alert("ID and password are required");
        return;
    }
    try {
        await saveEntry(id, pin, pw, { title });
        idInput.value = "";
        pwInput.value = "";
        titleInput.value = "";
        await renderList();
        $("output").textContent = "Saved.";
    }
    catch (e) {
        alert("Failed to save: " + e.message);
    }
}
function attachListHandlers(pin) {
    const listEl = $("entryList");
    listEl.addEventListener("click", (ev) => {
        const target = ev.target;
        if (!target)
            return;
        const id = target.getAttribute("data-id");
        if (!id)
            return;
        if (target.classList.contains("viewBtn")) {
            handleView(id, pin);
        }
        else if (target.classList.contains("delBtn")) {
            handleDelete(id);
        }
    });
}
function attachUI() {
    const unlockBtn = $("unlockBtn");
    const pinInput = $("pinInput");
    const addBtn = $("addBtn");
    unlockBtn.addEventListener("click", async () => {
        const pin = pinInput.value;
        if (!pin) {
            alert("Enter PIN");
            return;
        }
        // Try to decrypt a test or simply render list and attach handlers
        try {
            // We don't need to decrypt everything to validate PIN; attempt to decrypt first entry if exists
            await renderList();
            attachListHandlers(pin);
            // Attach add handler with this pin
            addBtn.onclick = () => handleAdd(pin);
            $("status").textContent = "Unlocked";
        }
        catch (e) {
            alert("Failed to unlock: " + e.message);
        }
    });
}
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await renderMachineKeyDisplay();
        attachUI();
        await renderList();
    }
    catch (e) {
        console.error("Popup init failed", e);
    }
});
