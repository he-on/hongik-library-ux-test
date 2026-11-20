import { configured, watchUser, listenBookmarks, bookKey, toggleBookmark, friendlyError } from "./firebase-service.js";

const variant = location.pathname.includes("/improved/") ? "improved" : "original";
const accountUrl = new URL("../account/?ui=" + variant, import.meta.url).href;
let currentUser = null;
let unsubscribeBooks = () => {};
let saved = new Set();
let scheduled = false;

const style = document.createElement("style");
style.textContent = [
  ".ux-bookmark-btn{margin-top:10px;border:1px solid #697fbb!important;border-radius:6px!important;padding:7px 12px!important;font-size:13px!important;background:#fff!important;color:#193c93!important;cursor:pointer}",
  ".ux-bookmark-btn[aria-pressed=true]{background:#edf2ff!important;font-weight:700}",
  ".ux-bookmark-btn:disabled{opacity:.55;cursor:progress}",
  ".ux-account-link{font-size:13px;white-space:nowrap;color:#193c93;text-decoration:underline}"
].join("");
document.head.appendChild(style);

function accountLink(label) {
  const link = document.createElement("a");
  link.href = accountUrl + "#bookmarks";
  link.className = "ux-account-link";
  link.textContent = label;
  return link;
}
function setAccountHeader() {
  if (variant === "original") {
    const loginButton = document.querySelector(".tools button.login");
    if (loginButton && !loginButton.dataset.uxAccount) {
      loginButton.dataset.uxAccount = "1";
      loginButton.removeAttribute("data-info");
      loginButton.addEventListener("click", () => location.assign(accountUrl));
      loginButton.textContent = currentUser ? "내 계정" : "LOGIN";
      loginButton.insertAdjacentElement("afterend", accountLink("My Library"));
    } else if (loginButton) {
      loginButton.textContent = currentUser ? "내 계정" : "LOGIN";
    }
  } else {
    const nav = document.querySelector("header nav");
    if (!nav) return;
    const spans = [...nav.querySelectorAll("span")];
    const shelf = spans.find(el => el.textContent.includes("내 서재"));
    const login = spans.find(el => el.textContent.includes("로그인"));
    if (shelf) shelf.replaceWith(accountLink("내 서재"));
    if (login) {
      const link = accountLink(currentUser ? "내 계정" : "로그인");
      link.href = accountUrl;
      link.dataset.uxAuthLink = "1";
      login.replaceWith(link);
    }
    const link = nav.querySelector("[data-ux-auth-link]");
    if (link) link.textContent = currentUser ? "내 계정" : "로그인";
  }
}
function extractBook(card) {
  const isImproved = variant === "improved";
  if (isImproved && card.querySelector(".cover.alt")) return null;
  const title = card.querySelector("h3")?.textContent?.trim() || "";
  const authorNode = isImproved ?
    card.querySelector(".by") : card.querySelector(".live-book-body > p, .book > div > p");
  const author = authorNode?.firstChild?.textContent?.trim() || "";
  if (!title) return null;
  // Reuse the same parsed records that populate the search result and its detail view.
  // No invented call number, location, or availability when the catalog lacks it.
  const record = isImproved
    ? window.HongikImprovedCatalog?.bookmarkRecord(card.dataset.uxRow)
    : window.HongikLiveSearch?.bookmarkRecord(card.dataset.uxSection,card.dataset.uxIndex);
  const clean = (value,max) => String(value ?? "").replace(/\r/g,"").trim().slice(0,max);
  const details = {
    materialType:clean(record?.materialType || "",80),
    publication:clean(record?.publication || "",300),
    availability:clean(record?.availability || "",80),
    library:clean(record?.library || "",120),
    location:clean(record?.location || "",250),
    callNumber:clean(record?.callNumber || "",140),
    holdingsText:clean(record?.holdingsText || "",1500),
    detailUrl:clean(record?.detailUrl || "",500)
  };
  return {
    title:record?.title || title,
    author:record?.author || author,
    sourceUrl:location.origin + location.pathname + location.search,
    details
  };
}
function paintButtons() {
  document.querySelectorAll(".ux-bookmark-btn").forEach(btn => {
    const isSaved = saved.has(btn.dataset.uxKey);
    if (btn.getAttribute("aria-pressed") !== String(isSaved)) {
      btn.setAttribute("aria-pressed", String(isSaved));
    }
    const label = isSaved ? "♥ 찜 해제" : "♡ 찜하기";
    if (btn.textContent !== label) btn.textContent = label;
    btn.setAttribute("aria-label", btn.dataset.uxTitle + (isSaved ? " 찜 해제" : " 찜하기"));
  });
}
function injectButtons() {
  const selector = variant === "original" ? "#main article.book" : "#list article.card";
  document.querySelectorAll(selector).forEach(card => {
    if (card.querySelector(".ux-bookmark-btn")) return;
    const book = extractBook(card);
    if (!book) return;
    const target = variant === "original" ?
      (card.querySelector(".live-book-body") || card.querySelector(".book > div:last-child")) :
      card.querySelector(".actions");
    if (!target) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ux-bookmark-btn";
    button.dataset.uxKey = bookKey(book.title, book.author);
    button.dataset.uxTitle = book.title;
    button.setAttribute("aria-pressed", "false");
    button.textContent = "♡ 찜하기";
    button.addEventListener("click", async () => {
      if (!configured || !currentUser) {
        location.assign(accountUrl);
        return;
      }
      button.disabled = true;
      try {
        await toggleBookmark(currentUser, variant, book);
      } catch (error) {
        alert(friendlyError(error));
      } finally {
        button.disabled = false;
      }
    });
    target.appendChild(button);
  });
  paintButtons();
}
function scheduleInject() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { scheduled = false; injectButtons(); });
}
setAccountHeader();
const observedRoot = variant === "original" ?
  document.querySelector("#main") : document.querySelector("#list");
if (observedRoot) {
  new MutationObserver(scheduleInject).observe(observedRoot, { childList: true, subtree: true });
  scheduleInject();
}
watchUser(user => {
  currentUser = user;
  setAccountHeader();
  unsubscribeBooks();
  saved = new Set();
  paintButtons();
  if (!user) return;
  unsubscribeBooks = listenBookmarks(user, variant, books => {
    saved = new Set(books.map(book => bookKey(book.title, book.author)));
    paintButtons();
  }, error => console.error("Bookmark sync failed:", friendlyError(error)));
}, error => console.error("Auth initialization failed:", friendlyError(error)));
