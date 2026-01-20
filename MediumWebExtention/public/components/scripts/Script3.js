export default async function BulkFollow(BulkFollowArgument) {

    function humanDelay(fast = false) {
        const r = Math.random();
        if (fast && r < 0.3) return 1500 + Math.random() * 1000;
        if (r < 0.2) return 3000 + Math.random() * 2000;   // Quick glance
        if (r < 0.4) return 15000 + Math.random() * 25000; // Deep read
        return 8000 + Math.random() * 12000;               // Normal
    }

    function humanClick(element) {
        const rect = element.getBoundingClientRect();
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;


        const moveEvent = new MouseEvent('mousemove', {
            bubbles: true, clientX: x, clientY: y
        });
        element.dispatchEvent(moveEvent);


        // Realistic event sequence
        const events = ['pointerover', 'pointerenter', 'mousedown', 'mouseup', 'click'];
        events.forEach(type => {
            const event = new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0,
                buttons: 1,
                clientX: x,
                clientY: y,
                screenX: x + window.screenX,
                screenY: y + window.screenY
            });
            element.dispatchEvent(event);
        });

        console.log(`🖱️ Human-like click at (${Math.round(x)}, ${Math.round(y)})`);
    }

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

        document.querySelectorAll("main ul button").forEach(value => value.textContent.trim() === "Follow" && data.add(value));

        [...data][data.size - 1].scrollIntoView({
            behavior: "smooth"
        })

        await new Promise((resolve) => setTimeout(resolve, humanDelay(true)));

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

            const time = no_of_Followers_Achived === 1 ? Math.floor((Math.random() * 5000) + 8000) : humanDelay(true);

            await new Promise(resolve => setTimeout(resolve, time));

            value.scrollIntoView({ behavior: "smooth", block: "center" });
            humanClick(value);
            ++no_of_Followers_Achived;

            const email_Notifications = document.querySelectorAll("div[tabindex='-1'] ul li:nth-child(3) button");

            if (email_Notifications.length === 0) return { no_of_Followers_Achived, limit };

            for (const value2 of email_Notifications) {

                await new Promise(resolve => setTimeout(resolve, humanDelay(true)));

                if (value2.textContent.trim() === "Email notifications off") humanClick(value2);

            }

        }

    }

    return { no_of_Followers_Achived, limit };
}
