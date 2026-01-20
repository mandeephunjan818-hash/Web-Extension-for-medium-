export default function FindFollowers() {

    const data = document.querySelectorAll("a[rel='noopener follow']");

    if (data.length === 0) return { Followers: 0, FollowersUrl: null };

    for (const value of data) {

        const follow = value.textContent.trim() || null;
        if (follow === null || !follow.includes("followers") || value.href === null) continue;

        return { Followers: follow, FollowersUrl: value.href };

    }

    return { Followers: 0, FollowersUrl: null };

}