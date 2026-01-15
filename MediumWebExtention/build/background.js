import MediumDB from './db.js';

const mediumRegex = /^https?:\/\/([a-z0-9-]+\.)*medium\.com\/.*/i;

let db;

// Initialize database on service worker startup
async function initDB() {
    try {
        db = new MediumDB();
        await db.open();

        const stats = await db.getStats();
        console.log('📊 Database stats:', stats);

        return db;
    } catch (error) {
        console.error('❌ Failed to initialize DB:', error);
        return null;
    }
}

// Initialize immediately when service worker starts
initDB().then(database => {
    console.log('🚀 Service worker initialized with database');
    db = database;
});

// ✅ ADD MESSAGE LISTENER FOR POPUP/CONTENT SCRIPT COMMUNICATION
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getDatabaseData') {
        handleGetDatabaseData(sendResponse);
        return true; // Keep channel open for async response
    }
});

// ✅ HANDLE DATABASE DATA REQUESTS
async function handleGetDatabaseData(sendResponse) {
    try {
        // Ensure DB is initialized
        if (!db) {
            db = await initDB();
        }

        const [authors, stats, articles, events] = await Promise.all([
            db.getAllAuthors(),
            db.getStats(),
            db.getAllArticles(),
            db.getAllEvents()
        ]);

        sendResponse({
            authors,
            stats,
            articles,
            events
        });
    } catch (error) {
        console.error('Error fetching database data:', error);
        sendResponse({
            authors: [],
            stats: null,
            articles: [],
            events: [],
            error: error.message
        });
    }
}

// Listen for extension installation/update
chrome.runtime.onInstalled.addListener(async () => {
    console.log('🔧 Extension installed/updated');
    if (!db) {
        db = await initDB();
    }
});

// When user switches tabs
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const tab = await chrome.tabs.get(tabId);
    setTimeout(() => {
        checkUrlAndPermission(tab.url, tabId);
    }, 3000);
});

// When URL changes in the current tab (page load / navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // changeInfo.url fires when URL changes
    if (changeInfo.url) {
        setTimeout(() => {
            checkUrlAndPermission(changeInfo.url, tabId);
        }, 3000);
        return;
    }

    // also handle first time load completion (optional)
    if (changeInfo.status === "complete" && tabId) {
        setTimeout(() => {
            checkUrlAndPermission(tab.url, tabId);
        }, 3000);
        return;
    }
});

async function checkUrlAndPermission(url, tabId) {
    if (!url || !url.startsWith("http")) return;

    const isMedium = mediumRegex.test(url);

    const originPattern = `${new URL(url).origin}/*`;

    if (!isMedium) {
        await chrome.storage.local.set({
            laststatus: {
                type: "URL_PERMISSION_STATUS",
                url,
                originPattern,
                hasPerm: false,
                isMedium
            }
        })
        console.log("Not Medium:", url);
        return;
    }

    chrome.permissions.contains({ origins: [originPattern] }, (hasPerm) => {
        console.log("URL:", url);
        console.log("Origin pattern:", originPattern);
        console.log("Has host permission:", hasPerm);

        chrome.storage.local.set({
            laststatus: {
                type: "URL_PERMISSION_STATUS",
                url,
                originPattern,
                hasPerm,
                isMedium
            }
        })
        if (hasPerm && isMedium) getFollower(tabId, url);
    })
}

function extractArticleData() {

    const follow = async (element) => {
        try {
            element.click();
            console.log("Clicked follow button");
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        } catch (err) {
            console.error("Error clicking follow button:", err);
            return false;
        }
    }

    const hasdata = (element) => {
        var currentElement = element;

        const artical = {
            Auther: {},
            Artical: {}
        };

        let foundAuthorName = null;
        let foundAuthorImage = null;
        let foundFollowingBtn = null;
        let foundPublishDate = null;

        var isFollowing = null;
        var checks = 0;

        while (currentElement && currentElement.tagName !== "ARTICLE" && checks !== 4) {

            console.log("checking element:", foundAuthorImage, foundAuthorName, foundFollowingBtn, foundPublishDate);

            if (foundAuthorName === null) {
                const authorName = currentElement.querySelectorAll('a[data-testid="authorName"]') || null;

                if (authorName && authorName.length > 0) {
                    artical.Auther.AutherName = authorName[0].textContent.trim();
                    artical.Auther.AutherUrl = authorName[0].href;
                    foundAuthorName = true;
                    ++checks;
                }
            }

            if (foundAuthorImage === null) {
                const autherImage = currentElement.querySelectorAll(`img[data-testid="authorPhoto"]`) || null;

                if (autherImage && autherImage.length > 0) {
                    artical.Auther.AutherImage = autherImage[0].src;
                    foundAuthorImage = true;
                    ++checks;
                }
            }

            if (foundFollowingBtn === null) {
                isFollowing = currentElement.querySelectorAll('button span span') || null;

                if (isFollowing && isFollowing.length > 0) {
                    foundFollowingBtn = true;
                    ++checks;
                }
            }

            if (foundPublishDate === null) {
                const publishDate = currentElement.querySelectorAll('span[data-testid="storyPublishDate"]') || null;

                if (publishDate && publishDate.length > 0) {
                    artical.Artical.ArticalDate = publishDate[0].textContent.trim();
                    foundPublishDate = true;
                    ++checks;
                }
            }

            if (checks === 4) {
                if (isFollowing && isFollowing.length > 0 && isFollowing[0].textContent.trim() === "Follow") {
                    const result = follow(isFollowing[0]);
                    if (result === true) {
                        artical.Auther.isFollowing = true;
                    }
                } else if (isFollowing && isFollowing.length > 0) {
                    artical.Auther.isFollowing = true;
                }
                return { artical, result: true };
            }

            if (currentElement.parentElement && currentElement.parentElement.tagName !== "ARTICLE") {
                currentElement = currentElement.parentElement;
            } else {
                break;
            }
        }

        return { artical, result: false };
    }

    const data = document.querySelectorAll('span[data-testid="storyReadTime"]');
    var articals = [];

    if (data.length === 0) return { title: document.title, count: data.length, items: [] };

    data.forEach((element) => {
        const result = hasdata(element);

        if (result.result === true) {
            result.artical.Artical.ArticalUrl = window.location.href;
            result.artical.Artical.ArticalReadTime = element.textContent.trim();
            result.artical.Artical.ArticalTitle = document.title.split("|")[0].trim();
            result.artical.Artical.LastVisitedAt = new Date().toISOString();
            articals.push(result.artical);
        }
    });

    return {
        title: document.title,
        count: data.length,
        items: articals
    }
}

async function getFollower(tabId, tabUrl) {
    if (!tabId) {
        console.log("no TabId");
        return;
    }

    const result = await db.CheckAuthorPresenc(tabUrl.split("/")[2]);
    const result2 = await db.CheckArticlePresenc(tabUrl);

    console.log("Author check result:", result);
    console.log("Article check result:", result2);

    const data = await chrome.scripting.executeScript({ target: { tabId }, func: extractArticleData });

    console.log("Extracted data:", data[0]);

    if (data[0].result.items.length === 0) return;

    if (result.result === true) await db.saveAuther(data[0].result.items[0].Auther);

    if (result2.result === true) {
        data[0].result.items[0].Artical.visitCount = result2.data;

        console.log(data[0]);

        chrome.storage.local.set({
            ArticalData: data[0].result
        })

        await db.saveArticle(data[0].result.items[0].Artical);
    } else {
        const ArticalData = await db.updateArticleVisitCount(tabUrl, result2.data);

        const refreshedData = {
            ...data[0].result,
            items: [{
                ...data[0].result.items[0],
                Artical: ArticalData.data
            }]
        };

        chrome.storage.local.set({
            ArticalData: refreshedData
        });
    }

    await db.saveEvent(data[0].result.items[0]);
}