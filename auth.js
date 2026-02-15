
import { db, doc, setDoc, getDoc } from './firebase-config.js';

// Expose to window for HTML onclick
window.login = async function () {
    const username = document.getElementById('username-input').value.trim();
    if (username === '') {
        alert('Please enter a username.');
        return;
    }
    localStorage.setItem('username', username);
    await applyLogin(username);
}

window.applyLogin = async function (username) {
    // Hide login form
    document.getElementById('login-wrapper').classList.add('d-none');
    // Show profile
    const profile = document.getElementById('user-profile');
    if (profile) {
        profile.classList.remove('d-none');
        profile.classList.add('d-flex');
    }
    // Set profile data
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = username;

    // Load saved picture or use default
    const savedPic = localStorage.getItem('profilePicture');
    const profileImg = document.getElementById('user-picture');
    const bottomProfileImg = document.getElementById('bottom-nav-profile');

    if (profileImg) {
        profileImg.onerror = function () { this.src = 'img/default-profile.png'; };
        profileImg.src = savedPic || 'img/default-profile.png';
    }
    if (bottomProfileImg) {
        bottomProfileImg.onerror = function () { this.src = 'img/default-profile.png'; };
        bottomProfileImg.src = savedPic || 'img/default-profile.png';
    }

    // --- Firebase User Registration ---
    try {
        const userRef = doc(db, 'users', username);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // Create new user profile with random ML attributes
            const roles = ['Mage', 'Assassin', 'Tank', 'Marksman', 'Fighter', 'Support'];
            const ranks = ['Mythic', 'Legend', 'Epic', 'Grandmaster', 'Master'];
            const randomRole = roles[Math.floor(Math.random() * roles.length)];
            const randomRank = ranks[Math.floor(Math.random() * ranks.length)];

            await setDoc(userRef, {
                username: username,
                role: randomRole,
                rank: randomRank,
                img: 'img/default-profile.png',
                followers: [],
                following: [],
                lastLogin: Date.now()
            });
        } else {
            // Update last login
            await setDoc(userRef, { lastLogin: Date.now() }, { merge: true });
        }

        // Init Social if function exists
        if (window.initFollows) window.initFollows();

    } catch (e) {
        console.error("Error registering user: ", e);
    }
}

// Auto-login check
window.addEventListener('load', () => {
    const savedUser = localStorage.getItem('username');
    if (savedUser) {
        applyLogin(savedUser);
    }
});
