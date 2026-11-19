import { configured, watchUser, register, login, logout, listenBookmarks, removeBookmark, friendlyError } from "./firebase-service.js";
const params = new URLSearchParams(location.search);
const variant = params.get("ui") === "improved" ? "improved" : "original";
const $ = id => document.getElementById(id);
const msg = (text, error = false) => {
  $("message").textContent = text;
  $("message").classList.toggle("error", error);
};
const searchUrl = "../" + variant + "/";
$("return-link").href = searchUrl;
$("original-tab").setAttribute("aria-current", variant === "original" ? "page" : "false");
$("improved-tab").setAttribute("aria-current", variant === "improved" ? "page" : "false");
let currentUser = null;
let unsubscribeBooks = () => {};
if (!configured) {
  $("setup-message").hidden = false;
  $("auth-forms").hidden = true;
  msg("Firebase 연결 정보가 없어 회원가입을 사용할 수 없습니다.", true);
}
async function submitAuth(mode) {
  const form = $("account-form");
  if (!form.reportValidity()) return;
  const email = $("email").value.trim();
  const password = $("password").value;
  $("signin").disabled = $("signup").disabled = true;
  msg(mode === "register" ? "계정을 생성하는 중..." : "로그인 중...");
  try {
    if (mode === "register") await register(email, password);
    else await login(email, password);
    $("password").value = "";
    msg(mode === "register" ? "회원가입 및 로그인이 완료되었습니다." : "로그인되었습니다.");
  } catch (e) {
    msg(friendlyError(e), true);
  } finally {
    $("signin").disabled = $("signup").disabled = false;
  }
}
$("account-form").addEventListener("submit", e => { e.preventDefault(); submitAuth("login"); });
$("signup").addEventListener("click", () => submitAuth("register"));
$("signout").addEventListener("click", async () => {
  try { await logout(); msg("로그아웃되었습니다."); }
  catch (e) { msg(friendlyError(e), true); }
});
function safeSource(url) {
  try {
    const source = new URL(url);
    const root = new URL("../", location.href);
    if (source.origin === location.origin && source.pathname.startsWith(root.pathname)) return source.href;
  } catch {}
  return searchUrl;
}
function paintBooks(books) {
  const list = $("bookmarks");
  list.replaceChildren();
  $("list-empty").hidden = books.length > 0;
  $("list-empty").textContent = books.length ? "" : "아직 찜한 도서가 없습니다.";
  books.sort((a, b) => a.title.localeCompare(b.title, "ko"));
  books.forEach(book => {
    const li = document.createElement("li");
    const info = document.createElement("div");
    const title = document.createElement("a");
    title.className = "book-title";
    title.href = safeSource(book.sourceUrl);
    title.textContent = book.title;
    const author = document.createElement("div");
    author.className = "book-by";
    author.textContent = book.author || "저자 정보 없음";
    info.append(title, author);
    const del = document.createElement("button");
    del.className = "btn";
    del.type = "button";
    del.textContent = "찜 해제";
    del.setAttribute("aria-label", book.title + " 찜 해제");
    del.addEventListener("click", async () => {
      if (!currentUser) return;
      del.disabled = true;
      try { await removeBookmark(currentUser, book.id); }
      catch (e) { msg(friendlyError(e), true); del.disabled = false; }
    });
    li.append(info, del);
    list.append(li);
  });
}
watchUser(user => {
  currentUser = user;
  $("auth-forms").hidden = Boolean(user) || !configured;
  $("signed-in").hidden = !user;
  $("user-email").textContent = user?.email || "";
  $("session-heading").textContent = user ? "내 계정" : "회원가입 / 로그인";
  unsubscribeBooks();
  paintBooks([]);
  if (!user) {
    $("list-empty").textContent = "로그인하면 찜한 도서가 표시됩니다.";
    return;
  }
  $("list-empty").textContent = "찜 목록을 불러오는 중...";
  unsubscribeBooks = listenBookmarks(user, variant, paintBooks, error => {
    msg(friendlyError(error), true);
    $("list-empty").textContent = "목록을 불러오지 못했습니다.";
  });
}, e => msg(friendlyError(e), true));
