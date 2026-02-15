
// WhatsApp Style Chat Logic (Firebase Direct Messages)
import { db, collection, addDoc, onSnapshot, query, orderBy, where, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, getDoc } from './firebase-config.js';

const contactList = document.getElementById('contact-list');
const messageList = document.getElementById('message-list');
const chatForm = document.getElementById('chat-form');
const msgInput = document.getElementById('message-input');

// New Selectors for WhatsApp UI
const noChatSelected = document.getElementById('no-chat-selected');
const activeChatInterface = document.getElementById('active-chat-interface');
const headerAvatar = document.getElementById('header-avatar');
const headerName = document.getElementById('header-name');
const imageInput = document.getElementById('image-input');
const docInput = document.getElementById('document-input');
const audioInput = document.getElementById('audio-input');
const attachBtn = document.getElementById('attach-btn');
const cameraBtn = document.getElementById('camera-btn');
const imagePreviewBar = document.getElementById('image-preview-bar');
const attachmentMenu = document.getElementById('attachment-menu');
const sendBtn = document.getElementById('send-btn');
const sendIcon = sendBtn.querySelector('i');

let selectedImages = [];
let selectedDoc = null;
let selectedAudio = null;

let currentUser = localStorage.getItem('username');
let activeChatPartner = null;
let unsubscribeChat = null;
let allUsersData = [];

// Initialize
function initChat() {
    currentUser = localStorage.getItem('username');
    if (!currentUser) {
        alert('Please login first to use chat!');
        window.location.href = 'index.html';
        return;
    }
    loadContacts();
    console.log("Chat initialized for user:", currentUser);

    // Check for shareProfile params
    const urlParams = new URLSearchParams(window.location.search);
    const shareProfileUser = urlParams.get('shareProfile');
    if (shareProfileUser) {
        msgInput.value = `Lihat profil ini: profile.html?u=${shareProfileUser}`;
        toggleSendButton();

        // Optional: Highlight or select a contact if possible, 
        // but for now just having it in the input is good.
        // Or wait for user to select a contact to send to.
        activeChatInterface.classList.remove('d-none');
        activeChatInterface.classList.add('d-flex');
        noChatSelected.classList.add('d-none');
        noChatSelected.classList.remove('d-flex');

        // Since we don't know WHO to send to, we might just open the chat UI 
        // and let them pick a contact from the list, 
        // causing the sidebar to be visible (on mobile handling might be needed).
        if (window.innerWidth <= 991) {
            document.getElementById('sidebar').classList.remove('hidden');
            document.getElementById('main-chat').classList.remove('active');
            alert(`Silakan pilih kontak untuk mengirim profil ${shareProfileUser}`);
        } else {
            alert(`Silakan pilih kontak untuk mengirim profil ${shareProfileUser}`);
        }
    }
}



// Load Contacts (Realtime from Users collection)
function loadContacts() {
    const q = collection(db, "users");

    onSnapshot(q, (querySnapshot) => {
        contactList.innerHTML = '';
        allUsersData = [];
        querySnapshot.forEach((doc) => {
            allUsersData.push({ id: doc.id, ...doc.data() });
        });

        const currentLower = currentUser?.toLowerCase();
        const myData = allUsersData.find(u => u.username?.toLowerCase() === currentLower);
        const following = myData?.following || [];
        const followers = myData?.followers || [];

        const visibleUsers = allUsersData.filter(user =>
            user.username !== currentUser &&
            (following.includes(user.username) || followers.includes(user.username))
        );

        if (visibleUsers.length === 0) {
            contactList.innerHTML = `
                <div class="text-center mt-5">
                    <div class="mb-3">
                        <i class="bi bi-people text-secondary" style="font-size: 3rem;"></i>
                    </div>
                    <p class="text-white-50">Belum ada teman chat.</p>
                    <a href="anggota.html" class="btn btn-premium-secondary btn-sm">Cari Teman</a>
                </div>
            `;
            return;
        }

        visibleUsers.forEach((user) => {
            const el = document.createElement('div');
            el.className = 'contact-item' + (activeChatPartner === user.username ? ' active' : '');
            el.onclick = () => selectContact(user);

            const isOnline = user.isOnline || (Date.now() - (user.lastSeen || 0) < 60000);
            const statusText = isOnline ? 'online' : 'offline';
            const statusColor = isOnline ? '#4ade80' : '#8696a0';

            el.innerHTML = `
                 <div class="contact-avatar">
                   <img src="${user.img || 'img/default-profile.png'}" 
                        class="avatar-premium-sm"
                        onerror="this.src='img/default-profile.png'">
                   ${isOnline ? '<div class="online-dot position-absolute bottom-0 end-0 bg-success rounded-circle border border-dark border-2" style="width:12px;height:12px;"></div>' : ''}
                </div>
                <div class="contact-info">
                    <div class="contact-name">${user.username}</div>
                    <div class="contact-status" style="color: ${statusColor}">${statusText}</div>
                </div>
            `;
            contactList.appendChild(el);
        });
    });
}

// Select User to Chat
function selectContact(user) {
    if (activeChatPartner === user.username) return;

    activeChatPartner = user.username;

    noChatSelected.classList.add('d-none');
    noChatSelected.classList.remove('d-flex');
    activeChatInterface.classList.remove('d-none');
    activeChatInterface.classList.add('d-flex');

    headerAvatar.src = user.img || 'img/default-profile.png';
    headerName.textContent = user.username;

    const sidebar = document.getElementById('sidebar');
    const mainChat = document.getElementById('main-chat');
    if (window.innerWidth <= 991) {
        console.log("Mobile view: Hiding sidebar, showing chat for", user.username);
        sidebar.classList.add('hidden');
        mainChat.classList.add('active');
        document.body.classList.add('chat-active');
        // Force height set for mobile
        if (typeof window.setMobileHeight === 'function') window.setMobileHeight();
    }

    document.querySelectorAll('.contact-item').forEach(el => {
        el.classList.remove('active');
        if (el.querySelector('.contact-name').textContent === user.username) {
            el.classList.add('active');
        }
    });

    loadMessages();
}

function getChatId(user1, user2) {
    const users = [user1, user2].sort();
    return `chat_${users[0]}_${users[1]}`;
}

// Load Messages
function loadMessages() {
    if (unsubscribeChat) unsubscribeChat();

    const chatID = getChatId(currentUser, activeChatPartner);
    const messagesRef = collection(db, 'chats', chatID, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    unsubscribeChat = onSnapshot(q, (snapshot) => {
        console.log(`Loaded ${snapshot.size} messages for chat with ${activeChatPartner}`);
        messageList.innerHTML = '';

        const currentLower = currentUser?.toLowerCase();
        const myData = allUsersData.find(u => u.username?.toLowerCase() === currentLower);
        const myFollowing = myData?.following || [];

        snapshot.forEach((docSnap) => {
            const msg = docSnap.data();
            const messageId = docSnap.id;
            const isMine = msg.from === currentUser;
            const msgClass = isMine ? 'outgoing' : 'incoming';

            let mediaHtml = '';

            // Image Logic
            if (msg.images && msg.images.length > 0) {
                const count = msg.images.length;
                let gridClass = 'msg-image-grid';
                if (count === 1) gridClass += ' grid-1';
                mediaHtml += `<div class="${gridClass}">`;
                msg.images.slice(0, 4).forEach((imgSrc, index) => {
                    let className = 'msg-image-item';
                    if (count === 1) className += ' full-width';
                    mediaHtml += `<div class="${className}"><img src="${imgSrc}" loading="lazy" onclick="window.open('${imgSrc}', '_blank')"></div>`;
                });
                mediaHtml += '</div>';
            }

            // Document Logic
            if (msg.type === 'document') {
                mediaHtml += `
                    <a href="${msg.fileUrl}" target="_blank" class="msg-doc">
                        <i class="bi bi-file-earmark-pdf-fill"></i>
                        <div class="overflow-hidden">
                            <div class="text-truncate" style="font-size: 14px;">${msg.fileName}</div>
                            <div class="small text-white-50">${msg.fileSize || ''}</div>
                        </div>
                    </a>
                `;
            }

            // Audio Logic
            if (msg.type === 'audio') {
                mediaHtml += `
                    <div class="msg-audio">
                        <audio controls src="${msg.fileUrl}"></audio>
                    </div>
                `;
            }





            const textHtml = msg.text ? `<span>${msg.text}</span>` : '';

            // Delete button for own messages
            const deleteBtnHtml = isMine ? `
                <button class="msg-delete-btn" onclick="deleteMessage('${chatID}', '${messageId}')" title="Hapus Pesan">
                    <i class="bi bi-trash-fill"></i>
                </button>
            ` : '';

            const html = `
                <div class="msg ${msgClass} position-relative group-hover">
                    ${mediaHtml}
                    ${textHtml}
                    <span class="msg-time">
                        ${msg.time} 
                        ${isMine ? '<i class="bi bi-check2-all text-info ms-1"></i>' : ''}
                    </span>
                    ${deleteBtnHtml}
                </div>
            `;
            messageList.insertAdjacentHTML('beforeend', html);
        });
        messageList.scrollTop = messageList.scrollHeight;
    });
}

// Delete Message Function
window.deleteMessage = async function (chatID, messageId) {
    if (confirm('Hapus pesan ini?')) {
        try {
            await deleteDoc(doc(db, 'chats', chatID, 'messages', messageId));
        } catch (e) {
            console.error("Error deleting message:", e);
            alert('Gagal menghapus pesan.');
        }
    }
};

function toggleSendButton() {
    if (msgInput.value.trim() || selectedImages.length > 0 || selectedDoc || selectedAudio) {
        sendIcon.className = 'bi bi-send-fill fs-5 text-white';
    } else {
        sendIcon.className = 'bi bi-mic-fill fs-5 text-white';
    }
}

msgInput.addEventListener('input', toggleSendButton);

sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (msgInput.value.trim() || selectedImages.length > 0 || selectedDoc || selectedAudio) {
        chatForm.requestSubmit();
    }
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeChatPartner) return;

    const chatID = getChatId(currentUser, activeChatPartner);
    const data = {
        from: currentUser,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (msgInput.value.trim()) data.text = msgInput.value.trim();
    if (selectedImages.length > 0) data.images = [...selectedImages];

    if (selectedDoc) {
        data.type = 'document';
        data.fileUrl = selectedDoc.base64;
        data.fileName = selectedDoc.name;
        data.fileSize = selectedDoc.size;
    } else if (selectedAudio) {
        data.type = 'audio';
        data.fileUrl = selectedAudio.base64;
    }

    // Reset early
    msgInput.value = '';
    selectedImages = [];
    selectedDoc = null;
    selectedAudio = null;
    renderImagePreview();
    toggleSendButton();

    try {
        await addDoc(collection(db, 'chats', chatID, 'messages'), data);
    } catch (e) {
        console.error(e);
    }
});

// Attachment Actions
attachBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    attachmentMenu.classList.toggle('show');
});

cameraBtn.addEventListener('click', () => imageInput.click());

document.addEventListener('click', (e) => {
    if (!attachmentMenu.contains(e.target) && !attachBtn.contains(e.target)) {
        attachmentMenu.classList.remove('show');
    }
});

window.handleAttachAction = function (type) {
    attachmentMenu.classList.remove('show');

    switch (type) {
        case 'gallery':
        case 'camera':
            imageInput.click();
            break;
        case 'document':
            docInput.click();
            break;
        case 'audio':
            audioInput.click();
            break;


    }
}

// File Input Listeners
imageInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
        selectedImages.push(await fileToBase64(file));
    }
    renderImagePreview();
    toggleSendButton();
});

docInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedDoc = {
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            base64: await fileToBase64(file)
        };
        renderImagePreview();
        toggleSendButton();
    }
});

audioInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedAudio = { base64: await fileToBase64(file) };
        renderImagePreview();
        toggleSendButton();
    }
});

function renderImagePreview() {
    imagePreviewBar.innerHTML = '';

    selectedImages.forEach((img, i) => addPreviewItem(img, () => { selectedImages.splice(i, 1); renderImagePreview(); }));
    if (selectedDoc) addPreviewItem('https://cdn-icons-png.flaticon.com/512/2991/2991108.png', () => { selectedDoc = null; renderImagePreview(); }, selectedDoc.name);
    if (selectedAudio) addPreviewItem('https://cdn-icons-png.flaticon.com/512/2995/2995101.png', () => { selectedAudio = null; renderImagePreview(); }, 'Audio File');

    msgInput.placeholder = (selectedImages.length || selectedDoc || selectedAudio) ? 'Tambahkan keterangan...' : 'Pesan';
    toggleSendButton();
}

function addPreviewItem(src, onRemove, label = '') {
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.innerHTML = `
        <img src="${src}">
        ${label ? `<div class="small text-white text-center position-absolute bottom-0 w-100 bg-black bg-opacity-50 text-truncate" style="font-size:10px">${label}</div>` : ''}
        <button class="remove-preview"><i class="bi bi-x"></i></button>
    `;
    item.querySelector('.remove-preview').onclick = onRemove;
    imagePreviewBar.appendChild(item);
}





function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

window.addEventListener('load', initChat);
