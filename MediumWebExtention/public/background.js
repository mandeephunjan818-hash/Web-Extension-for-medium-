const mediumRegex = /^https?:\/\/([a-z0-9-]+\.)*medium\.com\/.*/i;

// When user switches tabs
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const tab = await chrome.tabs.get(tabId);
    setTimeout(() => {
        checkUrlAndPermission(tab.url, tabId);
    }, 3000); // Initial delay for tab switch
});

// When URL changes in the current tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        setTimeout(() => {
            checkUrlAndPermission(changeInfo.url, tabId);
        }, 3000); // Initial delay for navigation
        return;
    }

    if (changeInfo.status === "complete" && tabId) {
        setTimeout(() => {
            checkUrlAndPermission(tab.url, tabId);
        }, 3000); // Initial delay for page load
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
        });
        console.log("Not Medium:", url);
        return;
    }

    chrome.permissions.contains({ origins: [originPattern] }, async (hasPerm) => {
        console.log("URL:", url);
        console.log("Origin pattern:", originPattern);
        console.log("Has host permission:", hasPerm);

        await chrome.storage.local.set({
            laststatus: {
                type: "URL_PERMISSION_STATUS",
                url,
                originPattern,
                hasPerm,
                isMedium
            }
        });

        if (hasPerm && isMedium) {
            // Wait for content to be ready before extraction
            const isContentReady = await waitForContentToLoad(tabId);
            if (isContentReady) {
                await getFollower(tabId);
            } else {
                console.log("Content not ready, skipping extraction");
            }
        }
    });
}

/**
 * Waits for page content to be fully loaded and visible
 * @param {number} tabId - The tab ID to check
 * @param {number} timeout - Maximum time to wait (default 15 seconds)
 * @returns {Promise<boolean>} - True if content is ready, false if timeout
 */
async function waitForContentToLoad(tabId, timeout = 15000) {
    const startTime = Date.now();
    const pollInterval = 500; // Check every 500ms

    console.log(`Waiting for content to load on tab ${tabId}...`);

    while (Date.now() - startTime < timeout) {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => {
                    // 1. Check document ready state
                    if (document.readyState !== 'complete') {
                        return { ready: false, reason: 'document not complete' };
                    }

                    // 2. Check for common loading indicators (customize these for Medium)
                    const loadingSelectors = [
                        'svg[class*="spinner"]',
                        'div[class*="loader"]',
                        'div[class*="loading"]',
                        'div[class*="skelton"]', // Common for placeholder content
                        '[data-testid="loading"]',
                        '.spinner',
                        '.loader',
                        '.loading'
                    ];
                    
                    for (const selector of loadingSelectors) {
                        const loadingElement = document.querySelector(selector);
                        if (loadingElement && loadingElement.offsetParent !== null) {
                            return { ready: false, reason: 'loading indicator visible' };
                        }
                    }

                    // 3. Check if our target content is present AND visible
                    const readTimeElements = document.querySelectorAll('span[data-testid="storyReadTime"]');
                    if (readTimeElements.length > 0 && readTimeElements[0].offsetParent !== null) {
                        return { ready: true, reason: 'content found and visible' };
                    }

                    // 4. Check if article container exists but is empty
                    const articleContainer = document.querySelector('article');
                    if (articleContainer && articleContainer.textContent.trim().length < 100) {
                        return { ready: false, reason: 'article container empty' };
                    }

                    return { ready: false, reason: 'target content not yet present' };
                }
            });

            const status = results[0].result;
            if (status.ready) {
                console.log("✅ Content is ready:", status.reason);
                return true;
            }

            // Log progress every few attempts
            if ((Date.now() - startTime) % 3000 < 500) {
                console.log(`⏳ Still waiting: ${status.reason}...`);
            }

        } catch (error) {
            console.error("❌ Error checking page readiness:", error);
            return false;
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    console.log(`❌ Timeout after ${timeout}ms waiting for content to load`);
    return false;
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
    };

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
    };

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
    };
}

async function getFollower(tabId) {
    if (!tabId) {
        console.log("no TabId");
        return;
    }

    try {
        const data = await chrome.scripting.executeScript({ 
            target: { tabId }, 
            func: extractArticleData 
        });

        console.log("Extracted data:", data[0].result);

        if (data[0].result.items.length === 0) {
            console.log("No articles found in extraction");
            return;
        }

        await chrome.storage.local.set({
            ArticalData: data[0].result
        });
        
        console.log("Successfully saved article data to storage");
    } catch (error) {
        console.error("Error executing script:", error);
    }
}