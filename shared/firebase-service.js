// Browser-module imports: no Node.js server or build step required on GitHub Pages.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const configured = ["apiKey", "authDomain", "projectId", "appId"]
  .every(key => typeof firebaseConfig[key] === "string" && firebaseConfig[key].trim() !== "");
const app = configured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

export function watchUser(callback, onError) {
  if (!auth) { callback(null); return () => {}; }
  return onAuthStateChanged(auth, callback, onError);
}
export function register(email, password) {
  if (!auth) return Promise.reject(new Error("Firebase 설정이 아직 완료되지 않았습니다."));
  return createUserWithEmailAndPassword(auth, email, password);
}
export function login(email, password) {
  if (!auth) return Promise.reject(new Error("Firebase 설정이 아직 완료되지 않았습니다."));
  return signInWithEmailAndPassword(auth, email, password);
}
export function logout() {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}
export function listenBookmarks(user, variant, callback, onError) {
  if (!user || !db) { callback([]); return () => {}; }
  const ref = collection(db, "users", user.uid, "bookmarks");
  return onSnapshot(query(ref, where("variant", "==", variant)), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, onError);
}
export function bookKey(title, author) {
  const normalize = value => String(value || "").normalize("NFKC")
    .toLowerCase().replace(/\s+/g, " ").trim();
  return normalize(title) + "\n" + normalize(author);
}
async function documentFor(user, variant, book) {
  const input = new TextEncoder().encode(variant + "\n" + bookKey(book.title, book.author));
  const sha = await crypto.subtle.digest("SHA-256", input);
  const id = Array.from(new Uint8Array(sha), b => b.toString(16).padStart(2, "0")).join("");
  return doc(db, "users", user.uid, "bookmarks", id);
}
export async function toggleBookmark(user, variant, book) {
  if (!user || !db) throw new Error("로그인 후 이용할 수 있습니다.");
  if (!["original", "improved"].includes(variant)) throw new Error("잘못된 화면 정보입니다.");
  const ref = await documentFor(user, variant, book);
  if ((await getDoc(ref)).exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, {
    title: String(book.title).slice(0, 250),
    author: String(book.author || "").slice(0, 250),
    sourceUrl: String(book.sourceUrl || "").slice(0, 500),
    variant,
    savedAt: serverTimestamp()
  });
  return true;
}
export async function removeBookmark(user, id) {
  if (!user || !db) throw new Error("로그인 후 이용할 수 있습니다.");
  await deleteDoc(doc(db, "users", user.uid, "bookmarks", id));
}
export function friendlyError(e) {
  const translations = {
    "auth/email-already-in-use": "이미 가입된 이메일입니다.",
    "auth/invalid-email": "이메일 형식을 확인해 주세요.",
    "auth/weak-password": "비밀번호는 6자 이상 입력해 주세요.",
    "auth/invalid-credential": "이메일 또는 비밀번호를 확인해 주세요.",
    "auth/too-many-requests": "시도 횟수가 많습니다. 잠시 후 다시 진행해 주세요.",
    "permission-denied": "접근 권한이 없습니다. Firestore 보안 규칙을 확인해 주세요."
  };
  return translations[e?.code] || e?.message || "요청 처리 중 문제가 발생했습니다.";
}
