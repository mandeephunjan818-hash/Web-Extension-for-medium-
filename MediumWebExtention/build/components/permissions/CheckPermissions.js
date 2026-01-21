import { script1, script2, script3 } from "../scripts/ScriptsHandler.js";

const mediumRegex = /^https?:\/\/([a-z0-9-]+\.)*medium\.com\/.*/i;

export default async function checkUrlAndPermission(url, tabId) {
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

    const hasPerm = await chrome.permissions.contains({ origins: [originPattern] });

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
        const Todays_Followers = (await chrome.storage.local.get("Todays_Followers")).Todays_Followers?.count || 0;
        const upperLimit = (await chrome.storage.local.get("BulkFollowArguments")).BulkFollowArguments?.upperLimit || 150;

        if (controler.on_off_Controler?.indector === "start" && Todays_Followers < upperLimit) {
            await getFollower(tabId);
        } else {
            console.log("the extent is for now on pause");
        }

    } else {
        console.log("either it is not a medium web page or we donot have the permissions");
    }

}

async function getFollower(tabId) {
    if (!tabId) {
        console.log("no TabId");
        return;
    }

    var reTry = 0;

    while (reTry <= 2) {

        const script1Result = await script1(tabId);
        if (script1Result === true) break;
        const script2Result = await script2(tabId);
        if (script2Result === true) break;
        const script3Result = await script3(tabId);
        if (script3Result === true) break;

        if (!script1Result && !script2Result && !script3Result) {

            const time = Math.floor((Math.random() * 5000) + 5000);
            await new Promise(resolve => setTimeout(resolve, time));
            ++reTry;

        }

    }

}

