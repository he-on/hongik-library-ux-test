/* Shared, non-intrusive UX task panel for the original/improved GitHub Pages prototypes. */
(() => {
  "use strict";
  const script = document.currentScript;
  const scriptBase = new URL(".", script && script.src ? script.src : location.href);
  const pathMatch = location.pathname.match(/\/(original|improved)(?:\/|$)/);
  const variant = pathMatch ? pathMatch[1] :
    (/\/account\/?(?:index\.html)?$/.test(location.pathname)
      ? (new URLSearchParams(location.search).get("ui") === "original" ? "original" : "improved") : "");
  if (!variant || document.querySelector("[data-ux-task-panel]")) return;

  const stateKey = "hongik-ux-task-state-v1:" + variant;
  const resultsKey = "hongik-ux-task-responses-v1";
  const participantKey = "hongik-ux-task-participant-v1";
  const taskId = "library-hours-today-v1";

  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", weekday: "long"
  }).formatToParts(new Date());
  const getPart = type => (parts.find(p => p.type === type) || {}).value || "";
  const dateKey = getPart("year") + "-" + getPart("month") + "-" + getPart("day");
  const dateLabel = getPart("year") + "년 " + Number(getPart("month")) + "월 " +
    Number(getPart("day")) + "일 " + getPart("weekday");

  const read = (storage, key, fallback) => {
    try {
      const value = storage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (_) { return fallback; }
  };
  const write = (storage, key, value) => {
    try { storage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  };
  const escape = value => String(value == null ? "" : value).replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const newId = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, n => n.toString(16).padStart(2, "0")).join("");
  };
  let participant = "";
  try { participant = localStorage.getItem(participantKey) || ""; } catch (_) {}
  if (!participant) {
    participant = "uxp-" + newId().replace(/-/g, "").slice(0, 12);
    try { localStorage.setItem(participantKey, participant); } catch (_) {}
  }
  let state = read(sessionStorage, stateKey, { stage: "intro" });
  if (!["intro", "task", "difficulty", "done"].includes(state.stage)) state = { stage: "intro" };
  let collapsed = false;

  const host = document.createElement("div");
  host.setAttribute("data-ux-task-panel", variant);
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = [
    ":host{position:fixed;right:18px;top:92px;z-index:2147482000;font:14px/1.55 Arial,'Malgun Gothic',sans-serif;color:#1b2941;box-sizing:border-box;}",
    "*{box-sizing:border-box;}button,textarea,input{font:inherit;}button{cursor:pointer;}button:focus-visible,textarea:focus-visible,input:focus-visible{outline:3px solid #f4a43b;outline-offset:2px;}",
    ".panel{width:330px;max-width:calc(100vw - 28px);max-height:calc(100dvh - 112px);display:flex;flex-direction:column;overflow:hidden;background:white;border:1px solid #bcc9dc;border-radius:15px;box-shadow:0 12px 44px #121c3850;}",
    ".head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:14px 17px;background:#182b51;color:white;}",
    ".head strong{display:block;font-size:14px;}.head small{display:block;font-size:11px;color:#cbd8ec;letter-spacing:.06em;}",
    ".head button{border:1px solid #7b8ea9;background:transparent;color:white;border-radius:6px;padding:5px 9px;font-size:12px;}",
    ".main{padding:17px;overflow-y:auto;overscroll-behavior:contain;}",
    ".variant{margin:0 0 8px;color:#536783;font-weight:bold;font-size:12px;}",
    "h2{margin:0 0 10px;font-size:18px;line-height:1.5;color:#122245;word-break:keep-all;}",
    "p{margin:0 0 12px;word-break:keep-all;}.sub{color:#64748b;font-size:12px;}.instruction{border-left:3px solid #335dcc;background:#f2f5ff;padding:12px;border-radius:5px;line-height:1.7;}",
    ".step{font-size:12px;color:#4363ac;font-weight:bold;margin:0 0 8px;}",
    "label.field{display:block;font-weight:bold;margin:14px 0 7px;font-size:13px;}",
    "textarea{display:block;width:100%;min-height:96px;resize:vertical;border:1px solid #b9c8db;border-radius:8px;padding:10px;color:#18243a;background:#fff;}",
    ".actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px;}.primary{background:#254bd0;color:#fff;border:1px solid #254bd0;border-radius:8px;padding:10px 12px;font-weight:bold;flex:1;}",
    ".secondary{background:white;color:#38547e;border:1px solid #c4cede;border-radius:8px;padding:9px 11px;font-size:12px;}.primary:disabled{opacity:.45;cursor:not-allowed;}",
    ".rating{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin:12px 0 10px;}",
    ".rating label{position:relative;cursor:pointer;}.rating input{position:absolute;opacity:0;width:1px;height:1px;}.rating span{display:grid;place-items:center;border-radius:8px;border:1px solid #b9c8db;background:#f7f9fd;height:48px;font-weight:bold;font-size:18px;}",
    ".rating input:checked+span{background:#254bd0;color:white;border-color:#254bd0;}.rating input:focus-visible+span{outline:3px solid #f4a43b;outline-offset:2px;}",
    ".scale{display:flex;justify-content:space-between;gap:8px;color:#596c86;font-size:11px;}",
    ".message{margin:11px 0 0;padding:10px;background:#f2f5ff;border-radius:7px;color:#334b7e;font-size:12px;word-break:break-word;}",
    ".message.error{color:#994327;background:#fff3ea;}.foot{border-top:1px solid #e0e6ee;padding:10px 17px;color:#687991;font-size:11px;background:#fafbfd;}",
    ".reopen{display:none;border:1px solid #ccd8e8;box-shadow:0 6px 24px #18233a44;padding:12px 14px;background:#182b51;color:white;font-weight:bold;border-radius:11px;}",
    ":host([data-collapsed]) .panel{display:none;}:host([data-collapsed]) .reopen{display:block;}",
    "@media(max-width:600px){:host{top:auto;bottom:12px;right:12px;}.panel{max-height:min(70dvh,550px);width:min(330px,calc(100vw - 24px));}.main{padding:14px;}}",
    "@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;}}"
  ].join("");
  shadow.appendChild(style);
  const shell = document.createElement("div");
  shell.innerHTML = '<button class="reopen" type="button" data-action="expand" aria-label="사용성 테스트 안내 열기">📝 테스트 안내 열기</button>' +
    '<section class="panel" role="complementary" aria-label="사용성 테스트 과업 및 응답 입력">' +
    '<div class="head"><div><small>UX USABILITY TEST</small><strong>중앙도서관 사용성 테스트</strong></div>' +
    '<button type="button" data-action="collapse" aria-label="테스트 패널 접기">접기 −</button></div>' +
    '<div class="main" id="taskBody" aria-live="polite"></div>' +
    '<div class="foot">이 패널은 UX 조사용이며 도서관 홈페이지 기능이 아닙니다.</div></section>';
  shadow.appendChild(shell);

  function saveState() { write(sessionStorage, stateKey, state); }
  function results() { return read(localStorage, resultsKey, []); }
  function saveResult(item) {
    const list = results();
    const index = list.findIndex(row => row.id === item.id);
    if (index >= 0) list[index] = item;
    else list.push(item);
    return write(localStorage, resultsKey, list.slice(-100));
  }
  function activeResult() { return results().find(row => row.id === state.responseId); }
  const body = shell.querySelector("#taskBody");
  function render() {
    let html = '<div class="variant">' + (variant === "original" ? "기존 UI · ORIGINAL" : "개선 UI · IMPROVED") + '</div>';
    if (state.stage === "intro") {
      html += '<p class="step">과업 안내</p><h2>오늘 중앙도서관 이용 시간 찾기</h2>' +
        '<p class="instruction"><b>' + escape(dateLabel) + '</b> 기준, 중앙도서관을 방문할 수 있는 시간대를 홈페이지에서 찾아 주세요.</p>' +
        '<p>찾은 이용 가능 시간대를 직접 입력한 다음, 정보를 찾는 과정의 난이도를 평가해 주세요.</p>' +
        '<p class="sub">웹사이트를 자유롭게 탐색하세요. 정답은 이 패널에 미리 표시되지 않습니다. 과업 시작 후 패널이 자동으로 접히며, 답을 찾으면 오른쪽의 답변 입력 버튼을 눌러 주세요.</p>' +
        '<p class="sub">연구용 익명 식별자, 답변, 난이도, 소요 시간을 저장합니다. 이름·학번 등 개인정보는 입력하지 마세요.</p>' +
        '<div class="actions"><button class="primary" type="button" data-action="start">과업 시작</button></div>';
    } else if (state.stage === "task") {
      html += '<p class="step">1 / 2 · 과업 수행 및 답변</p><h2>오늘 중앙도서관에 방문 가능한 시간대는?</h2>' +
        '<p class="instruction">홈페이지에서 <b>' + escape(state.dateLabel || dateLabel) + '</b>의 이용 가능 시간대를 찾아 적어 주세요.</p>' +
        '<label class="field" for="taskAnswer">확인한 이용 가능 시간대</label>' +
        '<textarea id="taskAnswer" maxlength="300" placeholder="홈페이지에서 확인한 시간대를 입력해 주세요.">' + escape(state.draft || "") + '</textarea>' +
        '<p class="sub">답변 제출 시 과업 수행 시간이 기록됩니다.</p>' +
        '<div class="actions"><button class="primary" type="button" data-action="answer">답변 제출</button>' +
        '<button class="secondary" type="button" data-action="notfound">정보를 찾지 못했어요</button></div>' +
        '<p class="message" id="validation" hidden></p>';
    } else if (state.stage === "difficulty") {
      html += '<p class="step">2 / 2 · 체감 난이도 평가</p><h2>시간 정보를 찾는 과정은 얼마나 어려웠나요?</h2>' +
        '<p class="sub">실제 정보 탐색 과정에서 느꼈던 난이도를 선택해 주세요.</p>' +
        '<div class="rating" role="radiogroup" aria-label="체감 난이도">' +
        [1,2,3,4,5].map(n => '<label aria-label="' + n + '점"><input name="difficulty" type="radio" value="' + n +
          '" ' + (Number(state.difficulty) === n ? 'checked' : '') + '><span>' + n + '</span></label>').join("") +
        '</div><div class="scale"><span>1점 · 매우 쉬움</span><span>5점 · 매우 어려움</span></div>' +
        '<div class="actions"><button class="primary" id="finish" type="button" data-action="finish" ' +
        (state.difficulty ? '' : 'disabled') + '>평가 제출</button></div>' +
        '<p class="sub" style="margin-top:10px">답변: ' + escape(state.answer) + '</p>';
    } else {
      const record = activeResult();
      html += '<p class="step">과업 완료</p><h2>평가가 완료되었습니다</h2>' +
        '<p>답변과 체감 난이도가 기록되었습니다.</p>' +
        '<p class="sub">난이도: <b>' + escape(record ? record.difficulty : state.difficulty || "-") + '점</b> / 5점</p>';
      if (state.sendState === "sent" || (record && record.synced)) {
        html += '<p class="message" role="status">✓ 서버에 응답이 저장되었습니다.</p>';
      } else if (state.sendState === "sending") {
        html += '<p class="message" role="status">서버에 응답을 저장하고 있습니다…</p>';
      } else {
        html += '<p class="message error" role="status">중앙 수집 서버 전송이 완료되지 않았습니다. 브라우저에 임시 보관된 응답을 재전송해 주세요.' +
          (state.error ? '<br>오류: ' + escape(state.error) : '') + '</p>' +
          '<div class="actions"><button class="primary" type="button" data-action="retry">재전송</button></div>';
      }
      html += '<div class="actions"><button class="secondary" type="button" data-action="restart">같은 화면 다시 평가하기</button></div>';
    }
    body.innerHTML = html;
    const reopen = shell.querySelector(".reopen");
    if (reopen) {
      reopen.textContent = state.stage === "task" ? "✎ 답변 입력하기" : "📝 테스트 안내 열기";
      reopen.setAttribute("aria-label", reopen.textContent);
    }
  }
  function updateState(changes) { Object.assign(state, changes); saveState(); render(); }

  async function upload(record) {
    if (!record) { updateState({ sendState: "failed", error: "임시 응답을 찾을 수 없음" }); return; }
    updateState({ sendState: "sending", error: "" });
    try {
      const [appLib, authLib, dbLib, configuration] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js"),
        import(new URL("firebase-config.js", scriptBase).href)
      ]);
      const app = appLib.getApps().length ? appLib.getApp() : appLib.initializeApp(configuration.firebaseConfig);
      const auth = authLib.getAuth(app);
      await auth.authStateReady();
      if (!auth.currentUser) await authLib.signInAnonymously(auth);
      const db = dbLib.getFirestore(app);
      await dbLib.setDoc(dbLib.doc(db, "uxTaskResponses", record.id), {
        anonymousUid: auth.currentUser.uid,
        participantId: record.participantId,
        variant: record.variant,
        taskId: record.taskId,
        taskDate: record.taskDate,
        answer: record.answer,
        difficulty: record.difficulty,
        elapsedSeconds: record.elapsedSeconds,
        startedAt: new Date(record.startedAt),
        answeredAt: new Date(record.answeredAt),
        completedAt: dbLib.serverTimestamp()
      });
      record.synced = true;
      saveResult(record);
      updateState({ sendState: "sent", error: "" });
    } catch (error) {
      updateState({ sendState: "failed", error: String(error.code || error.message || "전송 오류").slice(0, 90) });
    }
  }

  shell.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    event.stopPropagation();
    const action = button.dataset.action;
    if (action === "collapse") {
      collapsed = true; host.setAttribute("data-collapsed", "");
    } else if (action === "expand") {
      collapsed = false; host.removeAttribute("data-collapsed");
    } else if (action === "start") {
      updateState({ stage: "task", startedAt: Date.now(), taskDate: dateKey, dateLabel, draft: "", answer: "", difficulty: null });
      collapsed = true;
      host.setAttribute("data-collapsed", "");
      shell.querySelector(".reopen").focus();
    } else if (action === "answer" || action === "notfound") {
      const answer = action === "notfound" ? "정보를 찾지 못함" :
        String((body.querySelector("#taskAnswer") || {}).value || "").trim();
      if (!answer) {
        const warning = body.querySelector("#validation");
        if (warning) { warning.hidden = false; warning.textContent = "시간대를 입력하거나 '정보를 찾지 못했어요'를 선택해 주세요."; }
        return;
      }
      updateState({ stage: "difficulty", answer: answer.slice(0, 300), answeredAt: Date.now(), draft: "" });
    } else if (action === "finish") {
      if (!(state.difficulty >= 1 && state.difficulty <= 5)) return;
      const response = {
        id: newId(), participantId: participant, variant, taskId,
        taskDate: state.taskDate || dateKey, answer: String(state.answer || "").slice(0, 300),
        difficulty: Number(state.difficulty),
        elapsedSeconds: Math.max(0, Math.min(86400, Math.round((state.answeredAt - state.startedAt) / 1000))),
        startedAt: state.startedAt, answeredAt: state.answeredAt, synced: false
      };
      const locallySaved = saveResult(response);
      updateState({ stage: "done", responseId: response.id, sendState: locallySaved ? "sending" : "failed",
        error: locallySaved ? "" : "브라우저 저장이 허용되지 않음" });
      if (locallySaved) upload(response);
    } else if (action === "retry") {
      upload(activeResult());
    } else if (action === "restart") {
      state = { stage: "intro" }; saveState(); render();
    }
  });
  shell.addEventListener("input", event => {
    if (event.target.id === "taskAnswer") {
      state.draft = event.target.value;
      saveState();
    }
  });
  shell.addEventListener("change", event => {
    if (event.target.name === "difficulty") {
      state.difficulty = Number(event.target.value);
      saveState();
      const finish = body.querySelector("#finish");
      if (finish) finish.disabled = false;
    }
  });
  document.body.appendChild(host);
  if (state.stage === "task") {
    collapsed = true;
    host.setAttribute("data-collapsed", "");
  }
  render();
  if (state.stage === "done" && state.sendState === "sending") {
    upload(activeResult());
  }
})();