function isMoreThan24HoursApart(date1, date2) {
    const diffMs = Math.abs(date2 - date1);
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours >= 24;
}

const dayTimer = async () => {
    const i = 0;
    while (i === 0) {

        const data = (await chrome.storage.local.get("Todays_Followers"))?.Todays_Followers;
        const date = data?.date_time ?? new Date().toISOString();
        const count = data?.count ?? 0;

        chrome.storage.local.set({
            Todays_Followers: {
                count: count,
                date_time: date
            }
        })

        const j = 0;

        while (j === 0) {
            await new Promise((resolve) => setTimeout(resolve, (60 * 1000) * 15))

            if (isMoreThan24HoursApart(date, new Date().toISOString())) {
                chrome.storage.local.remove("Todays_Followers");
                break;
            }
        }

    }
}

export default dayTimer;