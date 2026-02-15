
// Social Logic (Firebase Version)
import { db, collection, doc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from './firebase-config.js';

let currentUser = localStorage.getItem('username');

// Initialize Follows (Called by auth.js after login)
window.initFollows = async function () {
    currentUser = localStorage.getItem('username');
    if (!currentUser) return;
    renderSocialList();
    initProfileStats();
};

function getLevel(rank) {
    if (!rank) return 'GM';
    if (rank === 'Mythic') return 'M';
    if (rank === 'Legend') return 'L';
    if (rank === 'Epic') return 'E';
    if (rank === 'Grandmaster') return 'GM';
    if (rank === 'Master') return 'M';
    if (rank === 'Elite') return 'El';
    if (rank === 'Warrior') return 'W';
    return rank.substring(0, 1);
}


// Render the ML Style List (Firebase Users)
async function renderSocialList() {
    const listContainer = document.getElementById('social-list');
    if (!listContainer) return;

    currentUser = localStorage.getItem('username');
    if (!currentUser) {
        listContainer.innerHTML = '<p class="text-white-50 text-center p-3">Please login to see friends.</p>';
        return;
    }

    // Listen to real-time updates for all users
    const usersCollectionRef = collection(db, "users");

    // We also need to know MY current following list to render buttons correctly.
    // Ideally we listen to MY user doc. But for simplicity, we'll get it from the full list snapshot since I am in there too.

    onSnapshot(usersCollectionRef, (querySnapshot) => {
        listContainer.innerHTML = '';

        let allUsers = [];
        querySnapshot.forEach((doc) => {
            allUsers.push({ id: doc.id, ...doc.data() });
        });

        const myUser = allUsers.find(u => u.id === currentUser);
        const myFollowing = myUser ? (myUser.following || []) : [];

        const otherUsers = allUsers.filter(user => user.id !== currentUser);

        if (otherUsers.length === 0) {
            listContainer.innerHTML = `
            <div class="text-center text-white-50 p-5">
                <i class="bi bi-person-slash fs-1 opacity-50 mb-3"></i>
                <p>No other players found online.</p>
                <small class="opacity-50">Tell your friends to login!</small>
            </div>`;
            return;
        }

        otherUsers.forEach(user => {
            const img = user.img || 'img/default-profile.png';

            const itemHtml = `
                <div class="ml-player-item align-items-center">
                    <div class="ml-player-avatar">
                        <img src="${img}" alt="${user.username}" onerror="this.src='https://source.unsplash.com/random/200x200/?game'">
                    </div>
                    <div class="ml-player-info">
                        <div class="ml-player-name mb-0" style="font-size: 1rem;">${user.username}</div>
                    </div>
                    <div class="ms-auto">
                        <a href="profile.html?u=${user.id}" class="btn btn-ml-primary btn-sm px-3 text-decoration-none">
                            View Profile
                        </a>
                    </div>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', itemHtml);
        });
    });
}


// Stats Logic for profile.html (Exported)
// Profile Stats Logic (Supports viewing other users)
export async function initProfileStats(targetUser) {
    const username = targetUser || localStorage.getItem('username');
    if (!username) return;

    const followingEl = document.getElementById('ig-following-count');
    const followersEl = document.getElementById('ig-followers-count');

    if (!followingEl || !followersEl) return;

    try {
        const userRef = doc(db, 'users', username);
        onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const followers = data.followers ? data.followers.length : 0;
                const following = data.following ? data.following.length : 0;

                followersEl.textContent = followers;
                followingEl.textContent = following;
            }
        });
    } catch (e) {
        console.error("Error loading stats:", e);
    }
}

