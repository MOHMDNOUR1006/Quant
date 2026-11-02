// ─── QUANT AI — Firebase Realtime Sync Layer ───────────────────────────────
// Replaces the old BroadcastChannel/localStorage approach, which only worked
// between tabs of the SAME browser on the SAME device and could never sync
// two different users' devices. Firebase Realtime Database gives us actual
// cross-device, cross-network sync: a friend on a different computer joining
// the room now really does appear live in the owner's member list.
//
// This file only opens the connection and exposes a small pub/sub API
// (FirebaseSync.write / .on / .remove / .onDisconnectRemove). All the
// co-op room *logic* (member lists, modals, task queue, etc.) stays in
// app.js's CoopRoomManager exactly as before — only the transport changed.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
    getDatabase,
    ref,
    set,
    update,
    remove,
    onValue,
    onDisconnect,
    push,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

// Same project the user already created and confirmed access to.
const firebaseConfig = {
    apiKey: "AIzaSyAd-ziQmhbhIl8AC3spzoKDqWSCUKM8cH4",
    authDomain: "device-streaming-84872243.firebaseapp.com",
    databaseURL: "https://device-streaming-84872243-default-rtdb.firebaseio.com",
    projectId: "device-streaming-84872243",
    storageBucket: "device-streaming-84872243.firebasestorage.app",
    messagingSenderId: "575066904003",
    appId: "1:575066904003:web:a0b260c31eac504db15976"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// All co-op data lives under /coop_rooms/{roomCode}/... in the database tree.
function roomPath(roomCode, ...segments) {
    return ['coop_rooms', roomCode, ...segments].join('/');
}

const FirebaseSync = {
    /** Overwrite a path completely (used for room state, member entries). */
    async write(roomCode, subPath, value) {
        await set(ref(db, roomPath(roomCode, subPath)), value);
    },

    /** Merge fields into a path without touching siblings. */
    async patch(roomCode, subPath, value) {
        await update(ref(db, roomPath(roomCode, subPath)), value);
    },

    /** Push an item onto a list-like path (used for the chat message log). */
    async push(roomCode, subPath, value) {
        const listRef = ref(db, roomPath(roomCode, subPath));
        await set(push(listRef), { ...value, ts: serverTimestamp() });
    },

    /** Remove a path (used to clean up a member entry, or delete a room). */
    async remove(roomCode, subPath = '') {
        await remove(ref(db, roomPath(roomCode, subPath)));
    },

    /**
     * Subscribe to live changes at a path. Fires immediately with current
     * value, then again on every change. Returns an unsubscribe function.
     */
    on(roomCode, subPath, callback) {
        const nodeRef = ref(db, roomPath(roomCode, subPath));
        const unsubscribe = onValue(nodeRef, (snapshot) => {
            callback(snapshot.val(), snapshot.key);
        });
        return unsubscribe;
    },

    /**
     * Registers a server-side cleanup that fires automatically if this
     * client disconnects unexpectedly (closes tab, loses network, crashes)
     * without ever calling remove() itself — e.g. so a friend who closes
     * their laptop mid-session doesn't linger in the members list forever.
     */
    removeOnDisconnect(roomCode, subPath) {
        const nodeRef = ref(db, roomPath(roomCode, subPath));
        onDisconnect(nodeRef).remove();
    }
};

window.FirebaseSync = FirebaseSync;
