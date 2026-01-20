export default function extractArticleData() {

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

    const follow = (element) => {
        try {
            humanClick(element);
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