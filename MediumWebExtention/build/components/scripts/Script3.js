
export default async function BulkFollow(BulkFollowArgument) {

    function humanDelay(fast = false) {
        const r = Math.random();
        if (fast && r < 0.3) return 1500 + Math.random() * 1000;
        if (r < 0.2) return 3000 + Math.random() * 2000;   // Quick glance
        if (r < 0.4) return 8000 + Math.random() * 2000; // Deep read
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

    function GUI() {
        let isAborted = false;

        // Check if style element already exists
        let bodyStyle = document.querySelector('style');
        if (!bodyStyle) {
            bodyStyle = document.createElement('style');
            document.head.appendChild(bodyStyle);
        }

        // Add our CSS to the style element (appending, not replacing)
        bodyStyle.textContent = `
        
        #abort-button {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            z-index: 999999 !important;
            padding: 12px 24px !important;
            background-color: #ff4444 !important;
            color: white !important;
            border: none !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 16px !important;
            font-weight: bold !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            transition: all 0.3s ease !important;
        }
        
        #abort-button:hover {
            transform: scale(1.05) !important;
        }
        
        #abort-button.aborted {
            background-color: #00cc00 !important;
        }
        
        #abort-button.aborted:hover {
            background-color: #00aa00 !important;
        }
    `;

        // Check if abort button already exists
        let abortButton = document.getElementById('abort-button');
        if (!abortButton) {
            abortButton = document.createElement("button");
            abortButton.id = "abort-button";
            abortButton.innerText = "Abort";
            document.body.appendChild(abortButton);
        }

        // Set up click handler
        abortButton.addEventListener("click", () => {
            if (!isAborted) {
                isAborted = true;
                document.body.classList.add('aborted');
                abortButton.classList.add('aborted');
                abortButton.innerText = "Restart";
                abort();
            } else {
                isAborted = false;
                document.body.classList.remove('aborted');
                abortButton.classList.remove('aborted');
                abortButton.innerText = "Abort";
                if (typeof restart === 'function') {
                    window.location.reload();
                }
            }
        });

        // Set up hover effects
        abortButton.addEventListener('mouseenter', () => {
            if (!isAborted) {
                abortButton.style.backgroundColor = '#cc0000';
            } else {
                abortButton.style.backgroundColor = '#00aa00';
            }
        });

        abortButton.addEventListener('mouseleave', () => {
            if (!isAborted) {
                abortButton.style.backgroundColor = '#ff4444';
            } else {
                abortButton.style.backgroundColor = '#00cc00';
            }
        });
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

    const validate = (await chrome.storage.local.get("validate")).validate?.flag || 0;

    if (validate === 0) {
        no_of_Followers_Achived = validate.followers;
    } else {
        chrome.storage.local.set({
            validate: {
                flag: 0,
                followers: 0
            }
        })
    }

    console.log("script3 injected");

    const limit = Math.floor((Math.random() * (upperLimit - lowerLimit) + lowerLimit) - BulkFollowArgument.Todays_Followers);
    console.log(limit);

    while (data.size <= limit) {

        const previous = document.querySelector("main").clientHeight;

        document.querySelectorAll("main ul button").forEach(value => value.textContent.trim() === "Follow" && data.add(value));

        [...data][data.size - 1].scrollIntoView({
            behavior: "smooth"
        })

        await new Promise((resolve) => setTimeout(resolve, Math.floor((Math.random() * 2000) + 3000)));

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

    GUI();

    for (const value of data) {

        if (value.textContent.trim() === "Follow") {

            const time = no_of_Followers_Achived === 1 ? Math.floor((Math.random() * 5000) + 8000) : humanDelay(true);

            await new Promise(resolve => setTimeout(resolve, time));

            value.scrollIntoView({ behavior: "smooth", block: "center" });
            humanClick(value);
            ++no_of_Followers_Achived;

            chrome.storage.local.set(({
                validate: {
                    flag: 0,
                    followers: no_of_Followers_Achived
                }
            }))

            const email_Notifications = document.querySelectorAll("div[tabindex='-1'] ul li:nth-child(3) button");

            if (email_Notifications.length === 0) {

                chrome.storage.local.set(({
                    validate: {
                        flag: 1,
                        followers: no_of_Followers_Achived
                    }
                }))

                return { no_of_Followers_Achived, limit };

            }

            for (const value2 of email_Notifications) {

                await new Promise(resolve => setTimeout(resolve, humanDelay(true)));

                if (value2.textContent.trim() === "Email notifications off") humanClick(value2);

            }

        }

    }

    function abort() {

        chrome.storage.local.set(({
            validate: {
                flag: 1,
                followers: no_of_Followers_Achived
            }
        }))

        return { no_of_Followers_Achived, limit };

    }

    abort();

}
