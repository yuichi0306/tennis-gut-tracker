import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase のウェブアプリ設定。apiKey は秘密情報ではなく、公開されても問題ない。
// データの保護は Firestore のセキュリティルール（本人のみ読み書き可）で行う。
const firebaseConfig = {
  apiKey: 'AIzaSyDnz757hRVDiXgLsw2Oqy3-XmSeEfirKZg',
  authDomain: 'tennis-gut-tracker.firebaseapp.com',
  projectId: 'tennis-gut-tracker',
  storageBucket: 'tennis-gut-tracker.firebasestorage.app',
  messagingSenderId: '768776263156',
  appId: '1:768776263156:web:d3c7ffc587b7460d9215a1',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
