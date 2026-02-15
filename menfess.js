// Menfess Logic (Firebase Version)
import { db, collection, addDoc, onSnapshot, orderBy, query, doc, deleteDoc } from './firebase-config.js';

const form = document.getElementById('menfessForm');
const wall = document.getElementById('menfess-wall');

// Save Message (to Firestore)
form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const to = document.getElementById('toInput').value;
    const msg = document.getElementById('msgInput').value;
    let from = document.getElementById('fromInput').value;

    if (!from) from = 'Anonymous';

    try {
        await addDoc(collection(db, "menfess"), {
            to: to,
            msg: msg,
            from: from,
            timestamp: Date.now(), // Use server timestamp ideally, but simple Date.now is fine
            date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            color: getRandomColorClass()
        });

        // No need to manually reload, onSnapshot handles it!
        form.reset();
    } catch (e) {
        console.error("Error sending menfess: ", e);
        alert("Gagal mengirim pesan. Cek koneksi internet.");
    }
});

// Load Messages (Realtime)
function loadMenfess() {
    // Query ordered by timestamp descending (newest first)
    const q = query(collection(db, "menfess"), orderBy("timestamp", "desc"));

    onSnapshot(q, (querySnapshot) => {
        wall.innerHTML = '';

        let messages = [];
        querySnapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });

        if (messages.length === 0) {
            wall.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-envelope-open fs-1 text-white-50 opacity-25"></i>
                    <p class="text-white-50 mt-3">Belum ada pesan rahasia.</p>
                </div>
            `;
            return;
        }

        messages.forEach(m => {
            const card = `
                <div class="col-md-6 fade-in">
                    <div class="glass-card h-100 position-relative" style="border-left: 4px solid var(--${m.color});">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="badge bg-dark border border-secondary text-secondary">To: ${m.to}</span>
                            
                            <div class="d-flex align-items-center gap-2">
                                <small class="text-white-50" style="font-size: 0.7rem;">${m.date}</small>
                                <button onclick="deleteMenfess('${m.id}')" class="btn btn-link text-white-50 p-0" style="font-size: 0.8rem; text-decoration: none;">
                                    <i class="bi bi-trash-fill text-danger opacity-50 hover-opacity-100"></i>
                                </button>
                            </div>
                        </div>
                        <p class="mb-3" style="font-style: italic; font-size: 1.1rem;">"${m.msg}"</p>
                        <div class="mt-auto pt-2 border-top border-secondary border-opacity-25 d-flex align-items-center">
                            <i class="bi bi-person-fill text-white-50 me-2"></i>
                            <span class="small fw-bold text-${m.color}">${m.from}</span>
                        </div>
                    </div>
                </div>
            `;
            wall.insertAdjacentHTML('beforeend', card);
        });
    });
}

// Global scope for HTML onclick
window.deleteMenfess = async function (id) {
    if (!confirm('Hapus pesan ini?')) return;

    try {
        await deleteDoc(doc(db, "menfess", id));
    } catch (e) {
        console.error("Error deleting msg: ", e);
        alert("Gagal menghapus.");
    }
}

function getRandomColorClass() {
    const colors = ['primary', 'info', 'success', 'warning', 'danger', 'light'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Init
window.addEventListener('load', loadMenfess);
