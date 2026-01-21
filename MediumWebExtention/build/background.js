import dayTimer from "./components/time/Timer.js";
import checkUrlAndPermission from "./components/permissions/CheckPermissions.js";

const pendingTimeouts = new Map();

// ONE global lock per profile
let currentProcessingTabId = null;

try { dayTimer(); } catch (err) { console.error("timer error", err); }

function debounce(tabId, delay, fn) {
    const existing = pendingTimeouts.get(tabId);
    if (existing) {
        clearTimeout(existing);
        pendingTimeouts.delete(tabId);
    }

    const t = setTimeout(async () => {
        pendingTimeouts.delete(tabId);
        try {
            await fn();
        } catch (e) {
            console.error("debounced fn error", e);
        }
    }, delay);

    pendingTimeouts.set(tabId, t);
}

// cleanup when tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
    const t = pendingTimeouts.get(tabId);
    if (t) {
        clearTimeout(t);
        pendingTimeouts.delete(tabId);
    }

    if (currentProcessingTabId === tabId) {
        currentProcessingTabId = null;
        console.log(`🧹 Cleared global lock (tab ${tabId} closed)`);
    }
});

async function runSingle(tabId, url) {
    // if someone else is running, skip
    if (currentProcessingTabId !== null && currentProcessingTabId !== tabId) {
        console.log(`⛔ Skipping tab ${tabId}. Tab ${currentProcessingTabId} is already running.`);
        return;
    }

    // acquire lock if free
    if (currentProcessingTabId === null) {
        currentProcessingTabId = tabId;
        console.log(`🔒 Global lock acquired by tab ${tabId}`);
    }

    try {
        await checkUrlAndPermission(url, tabId);
    } finally {
        currentProcessingTabId = null;
        console.log(`🔓 Global lock released by tab ${tabId}`);
    }
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
    debounce(tabId, 3000, async () => {
        const tab = await chrome.tabs.get(tabId);
        await runSingle(tabId, tab.url);
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url || changeInfo.status === "complete") {
        debounce(tabId, 3000, async () => {
            const tab = await chrome.tabs.get(tabId);
            await runSingle(tabId, tab.url);
        });
    }
});
