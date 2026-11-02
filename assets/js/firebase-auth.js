import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithPopup,
    signOut
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { doc, getDoc, getFirestore } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const FIREBASE_APP_NAME = 'mn-subscriptions';
const firebaseConfig = {
    apiKey: 'AIzaSyCpz_NPX4eVYrXx2Yc1YbuzA4DLP4cDBc4',
    authDomain: 'subscriptions-88ad4.firebaseapp.com',
    projectId: 'subscriptions-88ad4',
    storageBucket: 'subscriptions-88ad4.firebasestorage.app',
    messagingSenderId: '488372429688',
    appId: '1:488372429688:web:bff07fb5dcaacdf54f9e8d'
};

const firebaseApp = getApps().some((app) => app.name === FIREBASE_APP_NAME)
    ? getApp(FIREBASE_APP_NAME)
    : initializeApp(firebaseConfig, FIREBASE_APP_NAME);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let resolveInitialAuthState;
let initialAuthStateResolved = false;
const initialAuthState = new Promise((resolve) => {
    resolveInitialAuthState = resolve;
});

onAuthStateChanged(auth, (user) => {
    if (!initialAuthStateResolved) {
        initialAuthStateResolved = true;
        resolveInitialAuthState(user);
    }
});

export async function getCurrentUser() {
    await initialAuthState;
    return auth.currentUser;
}

export async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
}

export async function signInWithGoogleCredential(idToken, accessToken) {
    if (!idToken && !accessToken) throw new Error('Google returned no sign-in token.');
    const credential = GoogleAuthProvider.credential(idToken || null, accessToken || null);
    const result = await signInWithCredential(auth, credential);
    return result.user;
}

export async function signOutCurrentUser() {
    if (auth.currentUser) await signOut(auth);
}

export async function getSubscriptionForCurrentUser(uid) {
    const user = await getCurrentUser();
    if (!user || !uid || user.uid !== uid) {
        throw new Error('Sign in with the account that owns this subscription.');
    }

    const snapshot = await getDoc(doc(db, 'subscriptions', user.uid));
    if (!snapshot.exists()) return { uid: user.uid, plan: 'free', status: 'inactive' };

    const data = snapshot.data();
    const plan = String(data.plan || 'free').toLowerCase();
    const allowedPlans = new Set(['plus', 'pro', 'ultra']);
    const expiresValue = data.expiresAt;
    const expiresAt = expiresValue && typeof expiresValue.toDate === 'function'
        ? expiresValue.toDate()
        : (expiresValue instanceof Date ? expiresValue : new Date(expiresValue));
    const active = String(data.status || '').toLowerCase() === 'active'
        && allowedPlans.has(plan)
        && Number.isFinite(expiresAt.getTime())
        && expiresAt.getTime() > Date.now();

    if (!active) return { ...data, uid: user.uid, plan: 'free', status: 'inactive' };
    return { ...data, uid: user.uid, plan, expiresAt: expiresAt.toISOString() };
}
