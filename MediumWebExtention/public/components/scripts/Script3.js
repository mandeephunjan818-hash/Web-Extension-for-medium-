export default async function BulkFollow(BulkFollowArgument) {
    // Abort controller to break out of loops
    let abortController = {
        shouldAbort: false,
        abortData: null
    };

    function humanDelay(fast = false) {
        const r = Math.random();
        if (fast && r < 0.3) return 1500 + Math.random() * 1000;
        if (r < 0.2) return 3000 + Math.random() * 2000;
        if (r < 0.4) return 5000 + Math.random() * 2000;
        return 8000 + Math.random() * 2000;
    }

    function humanClick(element) {
        try {
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

            // Actually click the element
            element.click();
            console.log(`🖱️ Clicked Follow button`);
        } catch (error) {
            console.log('Click failed, continuing...');
        }
    }

    function abort() {
        const abortButton = document.getElementById('abort-button');
        chrome.storage.local.set({
            validate: {
                flag: 1,
                followers: no_of_Followers_Achived
            }
        });

        if (abortButton) {
            abortButton.classList.add('aborted');
            abortButton.innerText = "Restart";
        }

        console.log("Process completed/aborted");
        return { no_of_Followers_Achived, limit, result: true };
    }

    function GUI() {
        let isAborted = false;

        // FIX: Only add passive event listener to abort button, not to entire document
        // Check if style element already exists
        let bodyStyle = document.querySelector('style#bulk-follow-style');
        if (!bodyStyle) {
            bodyStyle = document.createElement('style');
            bodyStyle.id = 'bulk-follow-style';
            document.head.appendChild(bodyStyle);
        }

        // Add our CSS to the style element
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
        } else {
            abortButton.classList.remove('aborted');
            abortButton.innerText = "Abort";
        }

        // Set up click handler - FIX: Don't add event listeners to entire document
        abortButton.addEventListener("click", () => {
            if (!isAborted) {
                isAborted = true;
                abortController.shouldAbort = true;
                abortController.abortData = abort();
                console.log("Abort signal sent");
            } else {
                isAborted = false;
                abortButton.classList.remove('aborted');
                abortButton.innerText = "Abort";
                window.location.reload();
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

    // FIX: Correct storage logic - don't reset when flag is 0
    const validate = (await chrome.storage.local.get("validate")).validate;

    if (validate) {
        if (validate.flag === 0) {
            // Only resume if flag is 0 (in progress)
            no_of_Followers_Achived = validate.followers;
            console.log(`Resuming with ${no_of_Followers_Achived} followers`);
        } else {
            // Reset only if flag is 1 (completed/aborted previously)
            await chrome.storage.local.set({
                validate: {
                    flag: 0,
                    followers: 0
                }
            });
            console.log("Starting fresh session");
        }
    } else {
        // First time running
        await chrome.storage.local.set({
            validate: {
                flag: 0,
                followers: 0
            }
        });
        console.log("Initializing new session");
    }

    console.log("script3 injected");

    GUI();

    const limit = Math.floor((Math.random() * (upperLimit - lowerLimit) + lowerLimit) - BulkFollowArgument.Todays_Followers);
    console.log(`Target: ${limit} followers`);

    // Scrolling and collecting Follow buttons
    while (data.size <= limit) {
        // Check for abort signal
        if (abortController.shouldAbort) {
            return abortController.abortData;
        }

        const previous = document.querySelector("main").clientHeight;
        var last = null;

        document.querySelectorAll("main ul button").forEach(value => {
            if (value.textContent.trim() === "Follow") {
                data.add(value);
            }
            last = value;
        });

        if (last) {
            last.scrollIntoView({
                behavior: "smooth"
            });
        }

        await new Promise((resolve) => setTimeout(resolve, Math.floor((Math.random() * 2000) + 3000)));

        // Check for abort signal after delay
        if (abortController.shouldAbort) {
            return abortController.abortData;
        }

        const current = document.querySelector("main").clientHeight;

        if (previous >= current) {
            console.log("Scroll stopped because of interrupt or we reached the end");
            break;
        }
    }

    if (data.size < limit) {
        console.log("Aborting because the data is less than limit = ", data.size);
        return abort();
    }

    // Following users
    for (const value of data) {
        // Check for abort signal
        if (abortController.shouldAbort) {
            return abortController.abortData;
        }

        if (value.textContent.trim() === "Follow") {
            // Check for abort signal after delay
            if (abortController.shouldAbort) {
                return abortController.abortData;
            }

            value.scrollIntoView({ behavior: "smooth", block: "center" });

            // FIX: Make sure click actually happens
            setTimeout(() => {
                humanClick(value);
            }, 100);

            ++no_of_Followers_Achived;

            await chrome.storage.local.set({
                validate: {
                    flag: 0,
                    followers: no_of_Followers_Achived
                }
            });

            await new Promise(resolve => setTimeout(resolve, humanDelay(true)));

            const email_Notifications = document.querySelectorAll("div[tabindex='-1'] ul li:nth-child(3) button");

            if (email_Notifications.length === 0) return abort();

            for (const value2 of email_Notifications) {
                // Check for abort signal
                if (abortController.shouldAbort) {
                    return abortController.abortData;
                }

                await new Promise(resolve => setTimeout(resolve, humanDelay(true)));

                // Check for abort signal after delay
                if (abortController.shouldAbort) {
                    return abortController.abortData;
                }

                if (value2.textContent.trim() === "Email notifications off") {
                    setTimeout(() => {
                        humanClick(value2);
                    }, 100);
                }
            }
        }
    }

    return abort();
}