import { configured, watchUser, listenBookmarks, bookKey, toggleBookmark, updateBookmarkDetails, friendlyError } from "./firebase-service.js?v=20261120-details-fix";

const variant = location.pathname.includes("/improved/") ? "improved" : "original";
const accountUrl = new URL("../account/?ui=" + variant, import.meta.url).href;
let currentUser = null;
let unsubscribeBooks = () => {};
let saved = new Set();
let scheduled = false;
let legacyBookmarks = new Map();
const upgrading = new Set();

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
function detailsFromCard(card, isImproved) {
  // Existing browser caches may still supply an older search script.
  // Read only information actually rendered in the result card as a fallback.
  const text = node => node?.textContent?.trim() || "";
  if (isImproved) {
    const values = new Map();
    card.querySelectorAll(".cols dt").forEach(dt => {
      const label = text(dt), value = text(dt.nextElementSibling);
      if (value && dt.nextElementSibling?.tagName === "DD") values.set(label,value);
    });
    const badges = [...card.querySelectorAll(".badges .badge")];
    const library = text(badges[0]);
    const availability = text(badges[1]);
    const location = values.get("위치") || "";
    const callNumber = values.get("청구기호") || "";
    return {
      materialType:card.querySelector(".cover.alt")?.textContent?.includes("학술논문") ? "학술논문" : card.querySelector(".cover.alt") ? "전자자료" : "단행본",
      publication:["출판사","출판연도","발행정보","발행연도"].filter(k=>values.get(k))
        .map(k=>k+": "+values.get(k)).join(" · "),
      availability,library,location,callNumber,holdingsText:"",detailUrl:""
    };
  }
  const tags = [...card.querySelectorAll(".live-book-body > .tag")];
  const authorAndPublication = card.querySelector(".live-book-body > p");
  const publication = text(authorAndPublication?.querySelector("br")?.nextSibling);
  const rows = [...card.querySelectorAll(".live-holding-row")].map(row => {
    const location = text(row.querySelector(".live-holding-location"));
    const status = text(row.querySelector(".live-holding-badge"));
    return location + (status ? " (" + status + ")" : "");
  }).filter(Boolean);
  const first = rows[0] || "";
  const withoutStatus = first.replace(/\s*\((이용가능|이용불가|대출중)\)\s*$/, "").trim();
  const callMatch = withoutStatus.match(/\(([^()]+)\)\s*$/);
  const location = callMatch ? withoutStatus.slice(0,callMatch.index).trim() : withoutStatus;
  return {
    materialType:text(tags[0]),
    publication,
    availability:text(tags[1]) === "상태 미확인" ? "" : text(tags[1]),
    library:(location.match(/중앙도서관|문정도서관|법학도서관|대학로도서관/) || [])[0] || "",
    location,callNumber:callMatch?.[1]?.trim() || "",
    holdingsText:rows.join("\n"),
    detailUrl:card.querySelector(".live-title-link")?.href || ""
  };
}
function extractBook(card) {
  const isImproved = variant === "improved";
  const title = card.querySelector("h3")?.textContent?.trim() || "";
  const authorNode = isImproved ?
    card.querySelector(".by") : card.querySelector(".live-book-body > p, .book > div > p");
  const author = authorNode?.firstChild?.textContent?.trim() || "";
  if (!title) return null;
  const record = isImproved ?
    window.HongikImprovedCatalog?.bookmarkRecord?.(card.dataset.uxRow) :
    window.HongikLiveSearch?.bookmarkRecord?.(card.dataset.uxSection,card.dataset.uxIndex);
  const visible = detailsFromCard(card,isImproved);
  const clean = (value,max) => String(value ?? "").replace(/\r/g,"").trim().slice(0,max);
  const placeholders = new Set(["미제공","정보 없음","위치 정보 없음","원문 상세정보 참고"]);
  const fields = ["materialType","publication","availability","library","location","callNumber","holdingsText","detailUrl"];
  const limits = [80,300,80,120,250,140,1500,500];
  const details = Object.fromEntries(fields.map((field,i) => {
    const fromRecord = clean(record?.[field],limits[i]);
    const fromVisible = clean(visible[field],limits[i]);
    const value = !placeholders.has(fromRecord) && fromRecord ? fromRecord : fromVisible;
    return [field,placeholders.has(value) ? "" : value];
  }));
  return {
    title:record?.title || title,
    author:record?.author || author,
    sourceUrl:location.origin + location.pathname + location.search,
    details
  };
}
function hasMeaningfulDetails(details) {
  return Boolean(details && ["materialType","publication","availability","library","location","callNumber","holdingsText"]
    .some(key => String(details[key] || "").trim()));
}
function upgradeLegacyBookmarks() {
  if (!currentUser || legacyBookmarks.size === 0) return;
  const selector = variant === "original" ? "#main article.book" : "#list article.card";
  document.querySelectorAll(selector).forEach(card => {
    const book = extractBook(card);
    if (!book || !hasMeaningfulDetails(book.details)) return;
    const old = legacyBookmarks.get(bookKey(book.title,book.author));
    if (!old || upgrading.has(old.id)) return;
    // Only update when a real new catalog value exists; preserve any older fields.
    const fields = ["materialType","publication","availability","library","location","callNumber","holdingsText","detailUrl"];
    const merged = Object.fromEntries(fields.map(key =>
      [key,String(book.details?.[key] || old.details?.[key] || "")]));
    if (!fields.some(key => merged[key] && !old.details?.[key])) return;
    upgrading.add(old.id);
    updateBookmarkDetails(currentUser,old.id,merged)
      .catch(e => console.warn("기존 찜 상세정보 보완 실패:",friendlyError(e)))
      .finally(() => upgrading.delete(old.id));
  });
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
  if (variant !== "improved") return;
  document.querySelectorAll("#list article.card").forEach(card => {
    const book = extractBook(card);
    if (!book) return;
    const target = card.querySelector(".actions");
    if (!target) return;
    // Improved UI renders the button as part of the result card, so it stays visible
    // even before the Firebase module initializes. Attach behavior only once.
    let button = card.querySelector(".ux-bookmark-btn");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "ux-bookmark-btn";
      target.appendChild(button);
    }
    if (button.dataset.uxBound === "1") return;
    button.dataset.uxBound = "1";
    button.dataset.uxKey = bookKey(book.title,book.author);
    button.dataset.uxTitle = book.title;
    button.setAttribute("aria-pressed","false");
    button.textContent = "♡ 찜하기";
    button.addEventListener("click",async () => {
      if (!configured || !currentUser) {
        location.assign(accountUrl);
        return;
      }
      button.disabled = true;
      try {
        const latest = extractBook(card);
        if (!latest || !hasMeaningfulDetails(latest.details)) {
          alert("검색 결과에서 도서 정보를 읽지 못했습니다. 페이지를 새로고침한 후 다시 시도해 주세요.");
          return;
        }
        await toggleBookmark(currentUser,variant,latest);
      } catch(error) {
        alert(friendlyError(error));
      } finally {
        button.disabled = false;
      }
    });
  });
  paintButtons();
  upgradeLegacyBookmarks();
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
  legacyBookmarks = new Map();
  upgrading.clear();
  paintButtons();
  if (!user) return;
  unsubscribeBooks = listenBookmarks(user, variant, books => {
    saved = new Set(books.map(book => bookKey(book.title, book.author)));
    // Including partial details allows upgrading records created with older scripts.
    legacyBookmarks = new Map(books.map(book => [bookKey(book.title,book.author),book]));
    paintButtons();
    upgradeLegacyBookmarks();
  }, error => console.error("Bookmark sync failed:", friendlyError(error)));
}, error => console.error("Auth initialization failed:", friendlyError(error)));
