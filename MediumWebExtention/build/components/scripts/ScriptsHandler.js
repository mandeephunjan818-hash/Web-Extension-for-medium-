import extractArticleData from "./Script1.js";
import FindFollowers from "./Script2.js";
import BulkFollow from "./Script3.js";

export async function script1(tabId) {
    try {

        const script1 = await chrome.scripting.executeScript({
            target: { tabId },
            func: extractArticleData
        });

        if (script1[0].result?.items.length === 0) return false;

        chrome.storage.local.set({
            ArticalData: script1[0].result
        });

        const Todays_Followers = (await chrome.storage.local.get("Todays_Followers"))?.Todays_Followers;

        chrome.storage.local.set({
            Todays_Followers: {
                count: (Todays_Followers?.count ?? 0) + (script1[0].result?.items.length ?? 0),
                date_time: Todays_Followers?.date_time ?? new Date().toISOString()
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

export async function script2(tabId) {

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

export async function script3(tabId) {
    try {

        const Todays_Followers = (await chrome.storage.local.get("Todays_Followers")).Todays_Followers || null;

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
                count: (Todays_Followers?.count || 0) + (script3[0].result?.no_of_Followers_Achived || 0),
                date_time: Todays_Followers?.date_time || new Date().toISOString()
            }
        })

        if ((script3[0].result?.no_of_Followers_Achived ?? 0) < (script3[0].result?.limit ?? 125)) return false;

        console.log(script3[0]);

        return true;

    } catch (err) {
        console.error("error in script3:", err);
    }

    return false;
}