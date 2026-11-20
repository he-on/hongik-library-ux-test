import { configured, watchUser, suggestId, enterWithId, leaveId, listenBookmarks, removeBookmark, friendlyError } from "./firebase-service.js?v=20261120-details-fix";
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
function safeDetailUrl(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" &&
      url.hostname === "hongik.primo.exlibrisgroup.com" &&
      url.pathname === "/discovery/fulldisplay" &&
      url.searchParams.has("docid") ? url.href : "";
  } catch { return ""; }
}
function paintBooks(books) {
  const list = $("bookmarks");
  list.replaceChildren();
  $("list-empty").hidden = books.length > 0;
  $("list-empty").textContent = books.length ? "" : "아직 찜한 도서가 없습니다.";
  books.sort((a,b) => a.title.localeCompare(b.title, "ko"));
  books.forEach(book => {
    const li = document.createElement("li");
    li.className = "saved-book";
    const heading = document.createElement("div");
    heading.className = "book-entry";
    const info = document.createElement("div");
    const title = document.createElement("a");
    title.className = "book-title";
    title.href = safeSource(book.sourceUrl);
    title.textContent = book.title;
    const author = document.createElement("div");
    author.className = "book-by";
    author.textContent = book.author || "저자 정보 없음";
    info.append(title,author);

    const del = document.createElement("button");
    del.className = "btn";
    del.type = "button";
    del.textContent = "찜 해제";
    del.setAttribute("aria-label",book.title + " 찜 해제");
    del.addEventListener("click",async () => {
      if (!currentUser) return;
      del.disabled = true;
      try { await removeBookmark(currentUser,book.id); }
      catch(error) { msg(friendlyError(error),true); del.disabled = false; }
    });
    heading.append(info,del);
    li.append(heading);

    const details = book.details && typeof book.details === "object" ? book.details : null;
    const grid = document.createElement("dl");
    grid.className = "book-meta";
    const attributes = details ? [
      ["자료유형",details.materialType],
      ["소장 도서관",details.library],
      ["자료 위치",details.location],
      ["청구기호",details.callNumber],
      ["대출 상태",details.availability],
      ["발행사항",details.publication]
    ] : [];
    attributes.forEach(([label,value]) => {
      if (!value || !String(value).trim()) return;
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = String(value);
      grid.append(dt,dd);
    });
    if (grid.childElementCount) li.append(grid);

    if (details?.holdingsText?.trim()) {
      const holdings = document.createElement("div");
      holdings.className = "book-holdings";
      const label = document.createElement("strong");
      label.textContent = "소장정보";
      const rows = document.createElement("div");
      rows.textContent = details.holdingsText;
      holdings.append(label,rows);
      li.append(holdings);
    }
    if (!details || (!grid.childElementCount && !details.holdingsText?.trim())) {
      const hint = document.createElement("p");
      hint.className = "muted";
      hint.textContent = "이 항목에는 저장된 상세정보가 없습니다. 검색 결과에서 찜 해제 후 다시 찜하면 제공되는 소장정보가 함께 저장됩니다.";
      li.append(hint);
    }
    const actions = document.createElement("div");
    actions.className = "book-links";
    const source = document.createElement("a");
    source.href = safeSource(book.sourceUrl);
    source.textContent = "검색 결과로 이동";
    actions.append(source);
    const detailUrl = safeDetailUrl(details?.detailUrl);
    if (detailUrl) {
      const detail = document.createElement("a");
      detail.href = detailUrl;
      detail.target = "_blank";
      detail.rel = "noopener noreferrer";
      detail.textContent = "도서관 상세정보";
      actions.append(detail);
    }
    li.append(actions);
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
