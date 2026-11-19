import { configured, watchUser, suggestId, enterWithId, leaveId, listenBookmarks, removeBookmark, friendlyError } from "./firebase-service.js";
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
let currentUser = "";
let unsubscribeBooks = () => {};
$("id-input").value = suggestId();
if (!configured) {
  $("setup-message").hidden = false;
  $("auth-forms").hidden = true;
  msg("Firebase 연결 정보가 없어 아이디 등록 및 찜 목록을 사용할 수 없습니다.", true);
}
$("suggest").addEventListener("click", () => {
  $("id-input").value = suggestId();
  $("id-input").focus();
  msg("");
});
$("account-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!configured || !$("account-form").reportValidity()) return;
  $("start").disabled = $("suggest").disabled = true;
  msg("아이디를 확인하는 중...");
  try {
    const { id, existed } = await enterWithId($("id-input").value);
    msg(existed ? "기존 아이디로 찜 목록을 불러왔습니다." : "새 아이디를 등록했습니다. 다른 기기에서도 이 아이디를 사용하세요.");
    $("id-input").value = id;
  } catch (error) {
    msg(friendlyError(error), true);
  } finally {
    $("start").disabled = $("suggest").disabled = false;
  }
});
$("switch-id").addEventListener("click", () => {
  leaveId();
  $("id-input").value = suggestId();
  msg("이전 아이디를 다시 입력하면 기존 찜 목록에 접근할 수 있습니다.");
});
$("copy-id").addEventListener("click", async () => {
  if (!currentUser) return;
  try {
    await navigator.clipboard.writeText(currentUser);
    msg("아이디를 복사했습니다. 휴대폰에서도 동일하게 입력하세요.");
  } catch {
    msg("현재 아이디: " + currentUser + " — 선택해서 복사해 주세요.");
  }
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
      catch (error) { msg(friendlyError(error), true); del.disabled = false; }
    });
    li.append(info, del);
    list.append(li);
  });
}
watchUser(user => {
  currentUser = user || "";
  $("auth-forms").hidden = !!user || !configured;
  $("signed-in").hidden = !user;
  $("account-id").textContent = user || "";
  $("session-heading").textContent = user ? "내 아이디" : "아이디로 시작하기";
  unsubscribeBooks();
  paintBooks([]);
  if (!user) {
    $("list-empty").textContent = "아이디를 입력하면 찜한 도서가 표시됩니다.";
    return;
  }
  $("list-empty").textContent = "찜 목록을 불러오는 중...";
  unsubscribeBooks = listenBookmarks(user, variant, paintBooks, error => {
    msg(friendlyError(error), true);
    $("list-empty").textContent = "목록을 불러오지 못했습니다.";
  });
});
