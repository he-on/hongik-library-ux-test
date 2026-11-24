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

  const stateKey = "hongik-ux-task-state-v2:" + variant;
  // Keep a dismissed panel minimized across refreshes and page navigation for each UI variant.
  const dismissedKey = "hongik-ux-task-panel-dismissed-v1:" + variant;
  const resultsKey = "hongik-ux-task-responses-v1";
  const participantKey = "hongik-ux-task-participant-v1";
  const taskId = "library-hours-access-facility-v2";
  const scenarioKey = "hongik-ux-hours-scenario-v2";
  const rotationKey = "hongik-ux-hours-facility-rotation-v2";
  // These four facility names occur in both prototype reading-hours tables.
  const facilities = [
    "중앙도서관 대출자료실",
    "중앙도서관 정기간행물실",
    "중앙도서관 학위논문실",
    "중앙도서관 일반열람실"
  ];
  function koreanTimestamp(date) {
    const parts = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
      weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(date);
    const get = type => (parts.find(part => part.type === type) || {}).value || "";
    return {
      dateKey: get("year") + "-" + get("month") + "-" + get("day"),
      dateLabel: get("year") + "년 " + Number(get("month")) + "월 " +
        Number(get("day")) + "일 (" + get("weekday") + ")",
      timeLabel: get("hour") + ":" + get("minute")
    };
  }
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
  // A participant receives one access-time / facility scenario shared by both
  // variants, even when the second prototype is opened several minutes later.
  let scenario = read(localStorage, scenarioKey, null);
  function createScenario() {
    const previous = read(localStorage, rotationKey, -1);
    const index = (Number.isInteger(previous) ? previous + 1 : 0) % facilities.length;
    write(localStorage, rotationKey, index);
    const date = new Date();
    return {
      participantId: participant, facility: facilities[index], facilityIndex: index,
      accessedAt: date.toISOString(), ...koreanTimestamp(date)
    };
  }
  if (!scenario || scenario.participantId !== participant ||
      !facilities.includes(scenario.facility) || !scenario.timeLabel ||
      !scenario.dateLabel || !scenario.accessedAt) {
    scenario = createScenario();
    write(localStorage, scenarioKey, scenario);
  }
  let state = read(sessionStorage, stateKey, { stage: "intro", taskNumber:1 });
  if (!["intro", "task", "difficulty", "done"].includes(state.stage) ||
      (state.participantId && state.participantId !== participant)) {
    state = { stage: "intro", participantId: participant, taskNumber:1 };
  }
  function taskPrompt(record) {
    const data = record || scenario;
    return escape(data.dateLabel) + " <b>" + escape(data.timeLabel) +
      "</b>에 <b>" + escape(data.facility) +
      "</b>을 이용하려고 합니다. 그 시간에 이용할 수 있는지와 운영시간을 알려주세요.";
  }

  const taskSpecs = [
    {
      id:"library-hours-access-facility-v2", title:"운영시간 확인",
      label:"이용 가능 여부 및 운영시간",
      placeholder:"예: 이용 가능 / 운영시간 09:00~20:00",
      prompt:()=>taskPrompt(scenario)
    },
    {
      id:"library-loan-status-v1", title:"대출 상태 확인",
      label:"확인한 대출 상태 및 반납 예정일",
      placeholder:"예: 하이데거 / 대출 가능 (반납 예정일이 표시되면 함께 작성)",
      prompt:()=>'"<b>하이데거</b>"의 <b>종이책</b>을 지금 빌릴 수 있는지 확인해 주세요. 대출 중이라면 화면에 표시된 반납 예정일도 알려주세요.'
    },
    {
      id:"library-revisit-books-v1", title:"도서 재탐색",
      label:"두 도서의 소장 위치 및 X를 다시 찾은 방법",
      placeholder:"예: 하이데거 위치 확인 → 디자인 매거진 CA 검색 → 이전 화면으로 돌아가 하이데거 재확인",
      prompt:()=>'<b>하이데거</b>의 위치를 확인한 다음 <b>디자인 매거진 CA</b>를 찾아주세요. 마지막으로 <b>하이데거</b>의 위치를 다시 확인해 주세요.'
    },
    {
      id:"library-bookmark-v1", title:"찜하기",
      label:"책을 저장한 방법 및 확인 결과",
      placeholder:"예: 하이데거를 찜하고 My Library에서 저장 여부 확인",
      prompt:()=>'<b>하이데거</b>를 나중에 다시 쉽게 찾을 수 있도록 웹사이트에서 해보세요. 저장 결과도 확인해 주세요.'
    }
  ];
  const currentNumber=()=>Math.min(variant==="improved"?4:3,Math.max(1,Number(state.taskNumber)||1));
  const currentTask=()=>taskSpecs[currentNumber()-1];
  const versionDone=(v,n)=>results().some(row=>
    row.participantId===participant && row.variant===v && row.taskId===taskSpecs[n-1].id
  );
  const nextCommon=v=>[1,2,3].find(n=>!versionDone(v,n))||null;
  function nextDestination(){
    const n=currentNumber();
    if(n<3)return {variant,number:n+1};
    if(n===3){
      const other=variant==="original"?"improved":"original";
      const needOther=nextCommon(other);
      if(needOther)return {variant:other,number:needOther};
      if(!versionDone("improved",4))return {variant:"improved",number:4};
      return null;
    }
    return null;
  }
  const introState=n=>({stage:"intro",participantId:participant,taskNumber:n});
  const homeHref=v=>new URL("../"+v+"/",scriptBase).href;
  function goNext(destination){
    if(!destination)return;
    const targetState=introState(destination.number);
    // "Next task" is an explicit user action opening the next instruction.
    // Normal page navigation still respects the user's previously closed panel.
    write(localStorage,"hongik-ux-task-panel-dismissed-v1:"+destination.variant,false);
    if(destination.variant===variant){
      collapsed=false;
      host.removeAttribute("data-collapsed");
    }
    const targetKey="hongik-ux-task-state-v2:"+destination.variant;
    write(sessionStorage,targetKey,targetState);
    if(destination.variant===variant){
      state=targetState; saveState(); render();
    }
    const home=homeHref(destination.variant);
    const here=location.pathname.replace(/index\.html$/,"");
    const homePath=new URL(home).pathname;
    if(destination.variant!==variant || here!==homePath)location.assign(home);
  }

  // Once dismissed, open only through the explicit reopen button (including after navigation).
  let collapsed = read(localStorage, dismissedKey, false) === true || state.stage === "task";
  function dismissPanel() {
    collapsed = true;
    write(localStorage, dismissedKey, true);
    host.setAttribute("data-collapsed", "");
  }

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
    ".next-task{margin-top:17px;border-top:1px solid #d8e2f2;padding-top:16px}.next-task .instruction{font-size:13px}.next-task h2{font-size:17px}.next-task .actions{margin-top:10px}",
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
    const number=currentNumber();
    const task=currentTask();
    const total=variant==="improved"?4:3;
    let html='<div class="variant">'+(variant==="original"?"기존 UI · ORIGINAL":"개선 UI · IMPROVED")+
      ' · 과업 '+number+' / '+total+'</div>';
    if(state.stage==="intro"){
      html+='<p class="step">과업 '+number+' · '+task.title+'</p><h2>'+task.title+'</h2>'+
        '<p class="instruction">'+task.prompt()+'</p>'+
        '<p class="sub">진행자가 안내하면 과업을 시작하세요. 과업을 수행하는 동안 테스트 패널은 접혀 있습니다.</p>'+
        '<p class="sub">과업 1과 2는 홈에서 시작합니다. 과업 3은 X → Y → X 순서로 이어서 진행합니다.</p>'+
        '<div class="actions"><button class="primary" type="button" data-action="start">과업 '+number+' 시작</button></div>';
      if(number===1)html+='<div class="actions"><button class="secondary" type="button" data-action="nextparticipant">진행자: 새 참가자 설정</button></div>';
    }else if(state.stage==="task"){
      html+='<p class="step">과업 '+number+' 진행 중</p><h2>'+task.title+'</h2>'+
        '<p class="instruction">'+task.prompt()+'</p>'+
        '<label class="field" for="taskAnswer">'+task.label+'</label>'+
        '<textarea id="taskAnswer" maxlength="300" placeholder="'+escape(task.placeholder)+'">'+escape(state.draft||"")+'</textarea>'+
        '<p class="sub">정보를 확인한 뒤 답변을 제출하면 수행 시간이 기록됩니다.</p>'+
        '<div class="actions"><button class="primary" type="button" data-action="answer">답변 제출</button>'+
        '<button class="secondary" type="button" data-action="notfound">완료하지 못했어요</button></div>'+
        '<p class="message" id="validation" hidden></p>';
    }else if(state.stage==="difficulty"){
      html+='<p class="step">과업 '+number+' · 마지막 단계</p><h2>이 과업을 수행하는 데 얼마나 어려움이 있었나요?</h2>'+
        '<p class="sub">체감 난이도를 선택해 주세요.</p>'+
        '<div class="rating" role="radiogroup" aria-label="체감 난이도">'+
        [1,2,3,4,5].map(n=>'<label aria-label="'+n+'점"><input name="difficulty" type="radio" value="'+n+
          '" '+(Number(state.difficulty)===n?'checked':'')+'><span>'+n+'</span></label>').join("")+
        '</div><div class="scale"><span>1점 · 매우 쉬움</span><span>5점 · 매우 어려움</span></div>'+
        '<div class="actions"><button class="primary" id="finish" type="button" data-action="finish" '+
        (state.difficulty?'':'disabled')+'>과업 '+number+' 완료</button></div>'+
        '<p class="sub" style="margin-top:10px">작성한 답변: '+escape(state.answer||"")+'</p>';
    }else{
      const record=activeResult(),next=nextDestination();
      html+='<p class="step">과업 '+number+' 완료</p><h2>'+task.title+' 과업을 마쳤습니다</h2>'+
        '<p class="sub">답변과 난이도를 기록했습니다. 난이도: <b>'+
        escape(record?record.difficulty:state.difficulty||"-")+'점 / 5점</b></p>';
      if(state.sendState==="sent"||(record&&record.synced)){
        html+='<p class="message" role="status">✓ 테스트 응답이 서버에 저장되었습니다.</p>';
      }else if(state.sendState==="sending"){
        html+='<p class="message" role="status">서버에 응답을 전송하는 중입니다. 브라우저에 저장된 기록은 유지됩니다.</p>';
      }else{
        html+='<p class="message error" role="status">서버 전송이 완료되지 않았습니다. 이 브라우저에 임시 저장된 응답을 재전송할 수 있습니다.'+
          (state.error?'<br>오류: '+escape(state.error):'')+'</p>'+
          '<div class="actions"><button class="secondary" type="button" data-action="retry">응답 재전송</button></div>';
      }
      if(next){
        const nextTask=taskSpecs[next.number-1];
        html+='<div class="next-task"><p class="step">다음 과업 안내</p><h2>과업 '+next.number+' · '+nextTask.title+'</h2>'+
          '<p class="instruction">'+(next.number===1?taskPrompt(scenario):nextTask.prompt())+'</p>'+
          '<p class="sub">'+(next.variant===variant?"같은 사이트에서 계속 진행합니다.":"이제 "+(next.variant==="original"?"기존 UI(original)":"개선 UI(improved)")+"에서 진행합니다.")+
          '</p><div class="actions"><button class="primary" type="button" data-action="nexttask">'+
          (next.variant===variant?"과업 "+next.number+(next.number===3?"으로":"로")+" 이동":"다음 사이트에서 과업 "+next.number+" 진행")+'</button></div></div>';
      }else{
        html+='<p class="message">공통 과업 1~3과 개선안 찜하기 과업까지 모두 완료했습니다.</p>'+
          '<div class="actions"><button class="secondary" type="button" data-action="nextparticipant">진행자: 다음 참가자 설정</button></div>';
      }
    }
    const pending=results().filter(record=>!record.synced);
    if(state.stage!=="done"&&pending.length){
      html+='<div class="message error" role="status">서버에 아직 전송되지 않은 응답 '+pending.length+
        '건이 이 브라우저에 보관돼 있습니다.'+
        '<div class="actions"><button type="button" class="secondary" data-action="retryall">미전송 응답 재전송</button></div></div>';
    }
    body.innerHTML=html;
    const reopen=shell.querySelector(".reopen");
    if(reopen){
      reopen.textContent=state.stage==="task"?"✎ 과업 "+number+" 답변 입력":"📝 과업 "+number+" 안내 열기";
      reopen.setAttribute("aria-label",reopen.textContent);
    }
  }
  function updateState(changes) { Object.assign(state, changes); saveState(); render(); }

  async function upload(record) {
    if(!record)return;
    if(state.responseId===record.id&&state.stage==="done")updateState({sendState:"sending",error:""});
    try{
      const [appLib,authLib,dbLib,configuration]=await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js"),
        import(new URL("firebase-config.js",scriptBase).href)
      ]);
      const app=appLib.getApps().length?appLib.getApp():appLib.initializeApp(configuration.firebaseConfig);
      const auth=authLib.getAuth(app);
      await auth.authStateReady();
      if(!auth.currentUser)await authLib.signInAnonymously(auth);
      const db=dbLib.getFirestore(app);
      const payload={
        anonymousUid:auth.currentUser.uid,
        participantId:record.participantId,variant:record.variant,taskId:record.taskId,
        taskDate:record.taskDate,answer:record.answer,
        difficulty:record.difficulty,elapsedSeconds:record.elapsedSeconds,
        startedAt:new Date(record.startedAt),answeredAt:new Date(record.answeredAt),
        completedAt:dbLib.serverTimestamp()
      };
      // Task 1 keeps the existing stricter facility/time schema.
      if(record.taskNumber===1){
        payload.taskTime=record.taskTime;
        payload.facility=record.facility;
        payload.scenarioAccessedAt=new Date(record.scenarioAccessedAt);
      }
      await dbLib.setDoc(dbLib.doc(db,"uxTaskResponses",record.id),payload);
      record.synced=true;
      saveResult(record);
      if(state.responseId===record.id&&state.stage==="done")updateState({sendState:"sent",error:""});
    }catch(error){
      if(state.responseId===record.id&&state.stage==="done")
        updateState({sendState:"failed",error:String(error.code||error.message||"전송 오류").slice(0,90)});
    }
  }

  shell.addEventListener("click",event=>{
    const button=event.target.closest("button[data-action]");
    if(!button)return;
    event.stopPropagation();
    const action=button.dataset.action;
    if(action==="collapse"){
      dismissPanel();
    }else if(action==="expand"){
      collapsed=false;
      host.removeAttribute("data-collapsed");
    }else if(action==="start"){
      const n=currentNumber();
      updateState({
        stage:"task",participantId:participant,taskNumber:n,
        startedAt:Date.now(),taskDate:scenario.dateKey,
        dateLabel:scenario.dateLabel,timeLabel:scenario.timeLabel,
        facility:scenario.facility,scenarioAccessedAt:scenario.accessedAt,
        draft:"",answer:"",difficulty:null,responseId:null,error:"",sendState:""
      });
      dismissPanel();
      shell.querySelector(".reopen").focus();
    }else if(action==="answer"||action==="notfound"){
      const answer=action==="notfound"?"과업을 완료하지 못함":
        String((body.querySelector("#taskAnswer")||{}).value||"").trim();
      if(!answer){
        const warning=body.querySelector("#validation");
        if(warning){warning.hidden=false;warning.textContent="답변을 입력하거나 '완료하지 못했어요'를 선택해 주세요."}
        return;
      }
      updateState({stage:"difficulty",answer:answer.slice(0,300),answeredAt:Date.now(),draft:""});
    }else if(action==="finish"){
      if(!(state.difficulty>=1&&state.difficulty<=5))return;
      const n=currentNumber(), task=taskSpecs[n-1];
      const response={
        id:newId(),participantId:participant,variant,taskNumber:n,taskId:task.id,
        taskDate:state.taskDate||scenario.dateKey,
        taskTime:state.timeLabel||scenario.timeLabel,
        facility:state.facility||scenario.facility,
        scenarioAccessedAt:state.scenarioAccessedAt||scenario.accessedAt,
        answer:String(state.answer||"").slice(0,300),
        difficulty:Number(state.difficulty),
        elapsedSeconds:Math.max(0,Math.min(86400,Math.round((state.answeredAt-state.startedAt)/1000))),
        startedAt:state.startedAt,answeredAt:state.answeredAt,synced:false
      };
      const saved=saveResult(response);
      updateState({stage:"done",taskNumber:n,responseId:response.id,sendState:saved?"sending":"failed",
        error:saved?"":"브라우저 저장이 허용되지 않음"});
      if(saved)upload(response);
    }else if(action==="retry"){
      const existing=activeResult();
      if(existing&&!existing.synced)upload(existing);
    }else if(action==="retryall"){
      (async()=>{
        for(const entry of results().filter(row=>!row.synced))await upload(entry);
        render();
      })();
    }else if(action==="nexttask"){
      goNext(nextDestination());
    }else if(action==="nextparticipant"){
      participant="uxp-"+newId().replace(/-/g,"").slice(0,12);
      try{localStorage.setItem(participantKey,participant)}catch(_){}
      scenario=createScenario();
      write(localStorage,scenarioKey,scenario);
      try{
        sessionStorage.removeItem("hongik-ux-task-state-v2:original");
        sessionStorage.removeItem("hongik-ux-task-state-v2:improved");
      }catch(_){}
      state=introState(1);saveState();render();
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
  if (collapsed) host.setAttribute("data-collapsed", "");
  render();
  if (state.stage === "done" && state.sendState === "sending") {
    upload(activeResult());
  }
})();