//problems
//what if the url chnage and it is not the same as before .
//what if the user relad the same page when the script is ingeted .

const mediumRegex = /^https?:\/\/([a-z0-9-]+\.)*medium\.com\/.*/i;

const processingTabs = new Set();
const pendingTimeouts = new Map();

function isMoreThan24HoursApart(date1, date2) {
    const diffMs = Math.abs(date2 - date1);
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours >= 24;
}

const dayTimer = async () => {
    const i = 0;
    while (i === 0) {

        var date = await chrome.storage.local.get("Todays_Followers").Todays_Followers?.date_time || new Date;

        chrome.storage.local.set({
            Todays_Followers: {
                count: 0,
                date_time: date
            }
        })

        const j = 0;

        while (j === 0) {
            await new Promise((resolve) => setTimeout(resolve, (60 * 1000) * 15))

            if (isMoreThan24HoursApart(date, new Date)) {
                break;
            }
        }

    }
}

dayTimer();

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

function checkUrlAndPermission(url, tabId) {
    if (!url || !url.startsWith("http")) return;

    const isMedium = mediumRegex.test(url);
    const originPattern = `${new URL(url).origin}/*`;

    if (!isMedium) {
        chrome.storage.local.set({
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

        chrome.storage.local.set({
            laststatus: {
                type: "URL_PERMISSION_STATUS",
                url,
                originPattern,
                hasPerm,
                isMedium,
                tabId: tabId
            }
        });

        if (hasPerm && isMedium) {

            const controler = await chrome.storage.local.get("on_off_Controler");
            const Todays_Followers = await chrome.storage.local.get("Todays_Followers").Todays_Followers?.count || 0;

            if (controler.on_off_Controler?.indector === "start" && Todays_Followers < 150) {
                getFollower(tabId);
            } else {
                console.log("the extent is for now on pause");
            }

        } else {
            console.log("either it is not a medium web page or we donot have the permissions");
        }

    });
}

function extractArticleData() {
    const follow = (element) => {
        try {
            element.click();
            console.log("Clicked follow button");
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
                isFollowing = currentElement.querySelectorAll('button') || null;
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
                } else {
                    const textElements = currentElement.querySelectorAll('span, div, p, time, a');
                    const agoPattern = /\d+\s+(minute|hour|day|week|month|year)s?\s+ago/i;

                    for (const el of textElements) {
                        const text = el.textContent.trim();

                        if (agoPattern.test(text) && el.offsetParent !== null && text.length < 100) {
                            artical.Artical.ArticalDate = text;
                            foundPublishDate = true;
                            ++checks;
                            break;
                        }
                    }
                }
            }

            if (checks === 4) {
                if (isFollowing && isFollowing.length > 0 && isFollowing[0].textContent.trim() === "Follow") {
                    const result = follow(isFollowing[0]);
                    const ChangeButton = currentElement.querySelectorAll('button') || null;
                    if (result === true && ChangeButton[0].textContent.trim() === "Following") {
                        artical.Auther.isFollowing = true;
                    } else {
                        artical.Auther.isFollowing = false;
                    }
                } else if (isFollowing && isFollowing.length > 0 && isFollowing[0].textContent.trim() === "Following") {
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


    const data = document.querySelectorAll('span[data-testid="storyReadTime"]') || null;
    const articals = [];

    if (data.length === 0) return { title: document.title, items: [] };

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
        items: articals
    };
}

function FindFollowers() {

    const data = document.querySelectorAll("a[rel='noopener follow']");

    if (data.length === 0) return { Followers: 0, FollowersUrl: null };

    for (const value of data) {

        const follow = value.textContent.trim() || null;
        if (follow === null || !follow.includes("followers") || value.href === null) continue;

        return { Followers: follow, FollowersUrl: value.href };

    }

    return { Followers: 0, FollowersUrl: null };

}


async function BulkFollow(BulkFollowArgument) {

    let upperLimit, lowerLimit;

    if (BulkFollowArgument.upperLimit && BulkFollowArgument.lowerLimit) {

        upperLimit = Number(BulkFollowArgument.upperLimit);
        lowerLimit = Number(BulkFollowArgument.lowerLimit);

    } else {

        upperLimit = 125;
        lowerLimit = 100;

    }

    var no_of_Followers_Achived = 0;
    var data = new Set();

    console.log("script3 injected");

    const limit = Math.floor((Math.random() * (upperLimit - lowerLimit) + lowerLimit) - BulkFollowArgument.Todays_Followers);
    console.log(limit);

    while (data.size <= limit) {

        const previous = document.querySelector("main").clientHeight;

        document.querySelectorAll("main ul button").forEach(value => data.add(value));

        const time = Math.floor((Math.random() * 1000) + 1000);

        [...data][data.size - 1].scrollIntoView({
            behavior: "smooth"
        })

        await new Promise((resolve) => setTimeout(resolve, time));

        const current = document.querySelector("main").clientHeight;

        if (previous >= current) {
            console.log("Scroll stoped because of intrept or we reach the end ");
            break;
        }

    }

    if (data.size < limit) {

        console.log("aborting becaue the data is less then 100 = ", data.size);

        return { no_of_Followers_Achived, limit };
    }

    for (const value of data) {

        if (value.textContent.trim() === "Follow") {

            value.click();
            ++no_of_Followers_Achived;

            const time = Math.floor((Math.random() * 2000) + 4000);

            await new Promise(resolve => setTimeout(resolve, time));

            const email_Notifications = document.querySelectorAll("div[tabindex='-1'] ul li:nth-child(3) button");

            if (email_Notifications.length === 0) return no_of_Followers_Achived;

            for (const value2 of email_Notifications) {

                if (value2.textContent.trim() === "Email notifications off") value2.click();

            }

        }

    }

    return no_of_Followers_Achived;
}

async function script1(tabId) {
    try {

        const script1 = await chrome.scripting.executeScript({
            target: { tabId },
            func: extractArticleData
        });

        if (script1[0].result?.items.length === 0) return false;

        chrome.storage.local.set({
            ArticalData: script1[0].result
        });

        const Todays_Followers = await chrome.storage.local.get("Todays_Followers").Todays_Followers || null;

        chrome.storage.local.set({
            Todays_Followers: {
                count: Todays_Followers?.count + script1[0].result?.items.length || 0,
                date_time: Todays_Followers?.date_time || new Date()
            }
        })

        console.log("Successfully saved article data to storage");

        if (script1[0].result.items[0].Auther.isFollowing) {

            chrome.tabs.update(tabId, { url: script1[0].result.items[0].Auther.AutherUrl });

            return true;

        }

    } catch (error) {
        console.error("Error executing script:", error);
    }

    return false;
}

async function script2(tabId) {

    try {

        const script2 = await chrome.scripting.executeScript({
            target: { tabId },
            func: FindFollowers
        })

        console.log(script2[0]);

        if (script2[0].result?.Followers !== 0) {

            chrome.storage.local.set({
                AutherFollowers: script2[0].result
            });

            chrome.tabs.update(tabId, { url: script2[0].result.FollowersUrl })

            return true;

        }

    } catch (error) {
        console.error("Error executing script2:", error);
    }

    return false;

}

async function script3(tabId) {
    try {

        const Todays_Followers = await chrome.storage.local.get("Todays_Followers").Todays_Followers || null;

        const BulkFollowArgument = { Todays_Followers: Todays_Followers?.count || 0 };

        const result = await chrome.storage.local.get("BulkFollowArguments");

        if (result.BulkFollowArguments) {
            BulkFollowArgument.upperLimit = result.BulkFollowArguments.upperLimit;
            BulkFollowArgument.lowerLimit = result.BulkFollowArguments.lowerLimit;
        }

        const script3 = await chrome.scripting.executeScript({
            target: { tabId },
            func: BulkFollow,
            args: [BulkFollowArgument]
        })

        chrome.storage.local.set({
            Todays_Followers: {
                count: Todays_Followers?.count + script3[0].result?.no_of_Followers_Achived,
                date_time: Todays_Followers?.date_time
            }
        })

        if (script3[0].result?.no_of_Followers_Achived < script3[0].result?.limit) return false;

        console.log(script3[0]);

        return true;

    } catch (err) {
        console.error("error in script3:", err);
    }

    return false;
}

async function getFollower(tabId) {
    if (!tabId) {
        console.log("no TabId");
        return;
    }

    var reTry = 0;

    while (reTry < 2) {

        const script1Result = await script1(tabId);
        if (script1Result === true) break;
        const script2Result = await script2(tabId);
        if (script2Result === true) break;
        const script3Result = await script3(tabId);
        if (script3Result === true) break;

        if (!script1Result && !script2Result && !script3Result) {

            const time = Math.floor((Math.random() * 2000) + 1000);
            await new Promise(resolve => setTimeout(resolve, time));
            reTry++;

        }

    }

}