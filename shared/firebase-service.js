// UX prototype: ID-only shared bookmarks. The ID IS NOT a secure identity.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const configured = ["apiKey", "authDomain", "projectId", "appId"]
  .every(key => typeof firebaseConfig[key] === "string" && firebaseConfig[key].trim());
const app = configured ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const storageKey = "hongik-library-ux-id-v1";

export function currentId() {
  try { return localStorage.getItem(storageKey) || ""; }
  catch { return ""; }
}
export function suggestId() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const random = crypto.getRandomValues(new Uint8Array(9));
  return "book-" + Array.from(random, n => chars[n % chars.length]).join("");
}
function validId(value) {
  const id = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{4,29}$/.test(id)) {
    throw new Error("아이디는 영문 소문자·숫자·하이픈으로 5~30자 입력해 주세요.");
  }
  return id;
}
async function ensureAnonymous() {
  if (!auth) throw new Error("Firebase 연결 설정이 필요합니다.");
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser;
}
function broadcastId() { window.dispatchEvent(new Event("ux-id-changed")); }
export function watchUser(callback) {
  const changed = () => callback(currentId());
  window.addEventListener("ux-id-changed", changed);
  window.addEventListener("storage", changed);
  changed();
  return () => {
    window.removeEventListener("ux-id-changed", changed);
    window.removeEventListener("storage", changed);
  };
}
export async function enterWithId(input) {
  const id = validId(input);
  await ensureAnonymous();
  const ref = doc(db, "profiles", id);
  const existed = (await getDoc(ref)).exists();
  if (!existed) {
    try { await setDoc(ref, { createdAt: serverTimestamp() }); }
    catch (error) {
      // Simultaneous first visits can race; read the record before reporting a failure.
      if (!(await getDoc(ref)).exists()) throw error;
    }
  }
  localStorage.setItem(storageKey, id);
  broadcastId();
  return { id, existed };
}
export function leaveId() {
  try { localStorage.removeItem(storageKey); }
  finally { broadcastId(); }
}
export function bookKey(title, author) {
  const normalized = v => String(v || "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  return normalized(title) + "\n" + normalized(author);
}
async function bookmarkRef(id, variant, book) {
  const value = new TextEncoder().encode(variant + "\n" + bookKey(book.title, book.author));
  const sha = await crypto.subtle.digest("SHA-256", value);
  const key = Array.from(new Uint8Array(sha), b => b.toString(16).padStart(2, "0")).join("");
  return doc(db, "profiles", validId(id), "bookmarks", key);
}
export function listenBookmarks(id, variant, callback, onError) {
  if (!id || !db) { callback([]); return () => {}; }
  let active = true;
  let unsubscribe = () => {};
  ensureAnonymous().then(() => {
    if (!active) return;
    unsubscribe = onSnapshot(
      query(collection(db, "profiles", validId(id), "bookmarks"), where("variant", "==", variant)),
      snapshot => callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
      onError
    );
  }).catch(onError);
  return () => { active = false; unsubscribe(); };
}
export async function toggleBookmark(id, variant, book) {
  if (!id) throw new Error("아이디를 먼저 선택해 주세요.");
  if (!["original", "improved"].includes(variant)) throw new Error("잘못된 화면 정보입니다.");
  await ensureAnonymous();
  const ref = await bookmarkRef(id, variant, book);
  if ((await getDoc(ref)).exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, {
    title: String(book.title).slice(0, 250),
    author: String(book.author || "").slice(0, 250),
    sourceUrl: String(book.sourceUrl || "").slice(0, 500),
    // Catalog metadata is a snapshot at the time the user bookmarked the item.
    // Missing fields remain empty instead of being filled with invented values.
    details: {
      materialType:String(book.details?.materialType || "").slice(0,80),
      publication:String(book.details?.publication || "").slice(0,300),
      availability:String(book.details?.availability || "").slice(0,80),
      library:String(book.details?.library || "").slice(0,120),
      location:String(book.details?.location || "").slice(0,250),
      callNumber:String(book.details?.callNumber || "").slice(0,140),
      holdingsText:String(book.details?.holdingsText || "").slice(0,1500),
      detailUrl:String(book.details?.detailUrl || "").slice(0,500)
    },
    variant, savedAt: serverTimestamp()
  });
  return true;
}
// Fill in metadata for older saved books without deleting or re-adding the bookmark.
export async function updateBookmarkDetails(id, savedDocId, details) {
  if (!id || !/^[0-9a-f]{64}$/.test(String(savedDocId))) {
    throw new Error("찜한 도서의 저장 정보를 확인할 수 없습니다.");
  }
  await ensureAnonymous();
  const limits = {
    materialType:80, publication:300, availability:80, library:120,
    location:250, callNumber:140, holdingsText:1500, detailUrl:500
  };
  const safe = Object.fromEntries(Object.entries(limits).map(([key,length]) =>
    [key, String(details?.[key] || "").slice(0,length)]));
  await updateDoc(doc(db, "profiles", validId(id), "bookmarks", savedDocId), { details:safe });
}
export async function removeBookmark(id, bookmarkId) {
  if (!id) throw new Error("아이디를 먼저 선택해 주세요.");
  await ensureAnonymous();
  await deleteDoc(doc(db, "profiles", validId(id), "bookmarks", bookmarkId));
}
export function friendlyError(error) {
  const codes = {
    "auth/operation-not-allowed": "Firebase Authentication에서 익명 로그인(Anonymous)을 켜 주세요.",
    "auth/too-many-requests": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
    "permission-denied": "Firestore 보안 규칙을 확인해 주세요."
  };
  return codes[error?.code] || error?.message || "요청 처리 중 문제가 발생했습니다.";
}
