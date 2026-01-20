//problems
//what if the url chnage and it is not the same as before .
//what if the user relad the same page when the script is engacted .

import dayTimer from "./components/time/Timer.js";
import checkUrlAndPermission from "./components/permissions/CheckPermissions.js";

const processingTabs = new Set();
const pendingTimeouts = new Map();

try {
    dayTimer();
} catch (err) {
    console.error("the error in the timer", err);
}

function debounceAndLock(tabId, delay, asyncFn) {

    const existingTimeout = pendingTimeouts.get(tabId);
    if (existingTimeout) {
        clearTimeout(existingTimeout);
        pendingTimeouts.delete(tabId);
        console.log(`🔄 Debounced previous timer for tab ${tabId}`);
    }


    const timeoutId = setTimeout(async () => {
        pendingTimeouts.delete(tabId);


        if (processingTabs.has(tabId)) {
            console.log(`⏭️ Tab ${tabId} is already processing, skipping duplicate`);
            return;
        }


        processingTabs.add(tabId);
        console.log(`🔒 Acquired lock for tab ${tabId}`);

        try {
            await asyncFn();
        } catch (error) {
            console.error(`❌ Error processing tab ${tabId}:`, error);
        } finally {

            processingTabs.delete(tabId);
            console.log(`🔓 Released lock for tab ${tabId}`);
        }
    }, delay);

    pendingTimeouts.set(tabId, timeoutId);
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {

    debounceAndLock(tabId, 3000, async () => {
        const tab = await chrome.tabs.get(tabId);
        checkUrlAndPermission(tab.url, tabId);
    });

});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {

    if (changeInfo.url || (changeInfo.status === "complete")) {
        debounceAndLock(tabId, 3000, async () => {
            const freshTab = await chrome.tabs.get(tabId);
            checkUrlAndPermission(freshTab.url, tabId);
        });
    }
});