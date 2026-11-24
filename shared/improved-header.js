/* Consistent improved UI header across home, search, shelf map and My Library. */
(() => {
  "use strict";
  if (window.__improvedTopbarInstalled) return;
  const isAccount=/\/account\/?(?:index\.html)?$/.test(location.pathname);
  const isImproved=/\/improved\/(?:index\.html|search\.html|shelf-map\.html)?$/.test(location.pathname);
  const isReading=/\/improved\/community\/library-introduction\/reading-time\/(?:index\.html)?$/.test(location.pathname);
  if (!isImproved && !isAccount && !isReading) return;
  if (isAccount && new URLSearchParams(location.search).get("ui")==="original") return;
  const existing=document.querySelector("body > header");
  if (!existing) return;
  window.__improvedTopbarInstalled=true;
  const home=isAccount?"../improved/":isReading?"../../../":"./";
  const search=isAccount?"../improved/search.html":isReading?"../../../search.html":"./search.html";
  const account=isAccount?"./?ui=improved":isReading?"../../../../account/?ui=improved":"../account/?ui=improved";
  const readingHref=isAccount?"../improved/community/library-introduction/reading-time/":isReading?"./":"./community/library-introduction/reading-time/";
  // Cropped directly from the original-header screenshot supplied by the user.
  const brandImage=isReading?"../../../../shared/assets/hongik-library-brand-crop.png":"../shared/assets/hongik-library-brand-crop.png";
  const style=document.createElement("style");
  style.id="shared-improved-topbar-style";
  style.textContent=[
    '#ux-improved-header{position:relative;z-index:100;background:white;border-bottom:1px solid #dce3f2;font-family:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;font-size:15px;line-height:1.5;color:#121931}',
    '#ux-improved-header *{box-sizing:border-box}',
    '#ux-improved-header .header-line{height:89px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0 32px;width:100%;max-width:none;margin:0}',
    '#ux-improved-header .logo{color:#0033d7;font-size:24px;font-weight:900;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;letter-spacing:-.05em;text-decoration:none;line-height:1.5;flex:0 0 auto;min-width:0;overflow:visible}',
    '#ux-improved-header .logo span{color:inherit}#ux-improved-header .logo .library-name{font-weight:500}',
    '#ux-improved-header .logo .logo-icon{width:24px;height:17px;display:block;flex:none;color:#0033d7}',
    '#ux-improved-header .header-tools{display:flex;align-items:center;gap:18px;flex:0 0 auto}',
    '#ux-improved-header .header-tool{height:42px;width:36px;border:0;background:none;display:grid;place-items:center;color:#475877;cursor:pointer;padding:0;text-decoration:none;flex:none}',
    '#ux-improved-header .header-tool svg{width:25px;height:25px}',
    '#ux-improved-header .header-lang{height:48px;width:48px;border:0;border-radius:50%;background:#0033d7;color:#fff;font-weight:800;cursor:pointer;flex:none;padding:0;font-size:14px}',
    '#ux-improved-header .hours-anchor{position:relative}',
    '#ux-improved-header .hours-toggle{border:1.5px solid #cbd5e9;border-radius:40px;height:46px;padding:0 16px;display:flex;align-items:center;gap:9px;background:#fff;color:#121931;white-space:nowrap;cursor:pointer;font-family:inherit}',
    '#ux-improved-header .hours-toggle .hint{color:#51617c;font-size:14px;font-weight:700}',
    '#ux-improved-header .hours-toggle .clock{font-size:18px;font-weight:900;color:#11172d}',
    '#ux-improved-header .hours-toggle svg{height:18px;width:18px;color:#475877;transition:transform .2s}',
    '#ux-improved-header .hours-toggle[aria-expanded=true] svg{transform:rotate(180deg)}',
    '#ux-improved-header .hours-popup{position:fixed;right:32px;top:98px;width:min(490px,calc(100vw - 20px));background:#0733d6;border-radius:17px;padding:24px 17px 18px;box-shadow:0 16px 25px #101a3f55,0 2px 40px #0002;z-index:155;color:#fff;text-align:left}',
    '#ux-improved-header .hours-popup[hidden]{display:none!important}',
    '#ux-improved-header .hours-popup-title{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:0 10px 17px}',
    '#ux-improved-header .hours-popup-title h2{font-size:24px;line-height:1.35;color:#fff;font-weight:900;margin:0;padding:0}',
    '#ux-improved-header .hours-popup-title time{font-size:15px;font-weight:600;color:#fff}',
    '#ux-improved-header .hours-popup-body{background:#fff;border-radius:13px;padding:10px 24px 17px;color:#222}',
    '#ux-improved-header .hour-item{display:flex;justify-content:space-between;align-items:center;gap:10px;min-height:63px;border-bottom:2px solid #dce3f2}',
    '#ux-improved-header .hour-item:last-child{border:0}',
    '#ux-improved-header .hour-item strong{color:#0034dc;font-size:20px;font-weight:800;white-space:nowrap}',
    '#ux-improved-header .hour-item time{color:#666;font-size:22px;white-space:nowrap;font-variant-numeric:tabular-nums}',
    '#ux-improved-header .hours-popup-body p{color:#666;font-size:14px;line-height:1.5;margin:10px 1px 15px}',
    '#ux-improved-header .hours-popup-body a{display:block;text-align:right;color:#0034dc;font-weight:700;font-size:14px;text-decoration:none}',
    '#ux-improved-header button:focus-visible,#ux-improved-header a:focus-visible{outline:3px solid #2453fa;outline-offset:3px}',
    '@media(max-width:1100px){#ux-improved-header .logo{font-size:21px}#ux-improved-header .header-line{padding:0 18px}#ux-improved-header .header-tools{gap:9px}}',
    '@media(max-width:800px){#ux-improved-header .header-line{height:72px}#ux-improved-header .logo{font-size:18px}#ux-improved-header .hours-toggle{height:38px;padding:0 8px;gap:5px}#ux-improved-header .hours-toggle .hint{display:none}#ux-improved-header .hours-toggle .clock{font-size:13px}#ux-improved-header .header-tool{width:28px}#ux-improved-header .header-tool svg{width:20px;height:20px}#ux-improved-header .header-tool.help,#ux-improved-header .header-tool.search-top{display:none}#ux-improved-header .header-lang{width:35px;height:35px;font-size:11px}#ux-improved-header .hours-popup{top:78px;right:12px}}',
    '@media(max-width:600px){#ux-improved-header .header-line{padding:0 10px;gap:5px}#ux-improved-header .logo{font-size:15px;gap:2px}#ux-improved-header .logo .logo-icon{width:17px;height:13px}#ux-improved-header .hours-toggle{height:32px;padding:0 7px}#ux-improved-header .hours-toggle .clock{font-size:11px}#ux-improved-header .header-tool.user-top{display:none}#ux-improved-header .header-lang{width:30px;height:30px}#ux-improved-header .hours-popup{top:72px;right:8px;width:calc(100vw - 16px);padding:15px 10px}#ux-improved-header .hours-popup-title h2{font-size:19px}#ux-improved-header .hours-popup-title time{font-size:13px}#ux-improved-header .hours-popup-body{padding:8px 16px 14px}#ux-improved-header .hour-item{min-height:51px}#ux-improved-header .hour-item strong{font-size:14px}#ux-improved-header .hour-item time{font-size:16px}#ux-improved-header .hours-popup-body p,#ux-improved-header .hours-popup-body a{font-size:12px}}',
    '#ux-improved-header{position:relative!important;margin:0!important;width:100%!important;max-width:none!important;padding:0!important;border:0!important;border-bottom:1px solid #e5e7ef!important;background:#fff!important;box-shadow:none!important;border-radius:0!important;min-height:0!important}',
    '#ux-improved-header .header-line{height:80px!important;min-height:80px!important;max-width:none!important;padding:0 48px!important;display:flex!important;justify-content:space-between!important;align-items:center!important;gap:16px!important;background:#fff!important}',
    '#ux-improved-header .logo{display:flex!important;align-items:center!important;flex:0 1 auto!important;min-width:0!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;text-decoration:none!important;background:transparent!important}',
    '#ux-improved-header .brand-cropped{display:block!important;width:309px!important;height:34px!important;max-width:100%!important;object-fit:contain!important;object-position:left center!important;image-rendering:auto!important;mix-blend-mode:normal!important}',
    '#ux-improved-header .header-tools{display:flex!important;flex:0 0 auto!important;align-items:center!important;justify-content:flex-end!important;gap:12px!important;margin:0!important;padding:0!important}',
    '#ux-improved-header .header-tool{display:grid!important;place-items:center!important;color:#4a546a!important;width:27px!important;height:32px!important;min-height:32px!important;flex:none!important;border:0!important;background:transparent!important;padding:0!important}',
    '#ux-improved-header .header-tool svg{width:17px!important;height:17px!important;display:block!important}',
    '#ux-improved-header .header-lang{display:grid!important;place-items:center!important;width:32px!important;height:32px!important;padding:0!important;border:0!important;border-radius:50%!important;background:#002be1!important;color:#fff!important;font-size:11px!important;line-height:1!important;font-weight:750!important}',
    '#ux-improved-header .hours-toggle{height:33px!important;min-height:33px!important;padding:0 11px!important;border:1.5px solid #0033d7!important;border-radius:99px!important;background:#fff!important;display:flex!important;gap:8px!important;align-items:center!important;justify-content:center!important}',
    '#ux-improved-header .hours-toggle .hint{font-size:10px!important;font-weight:600!important;color:#273859!important}',
    '#ux-improved-header .hours-toggle .clock{font-size:12px!important;font-weight:700!important;letter-spacing:0!important;color:#273859!important}',
    '#ux-improved-header .hours-toggle svg{width:13px!important;height:13px!important;color:#0033d7!important}',
    '#ux-improved-header,#ux-improved-header *{font-family:Arial,"Malgun Gothic",sans-serif!important}',
    '#ux-improved-header .hours-popup{top:calc(80px + 8px)!important;right:24px!important}',
    '@media(max-width:1100px){#ux-improved-header .header-line{height:53px!important;min-height:53px!important;padding:0 27px!important;gap:12px!important}#ux-improved-header .brand-cropped{width:213px!important;height:auto!important;aspect-ratio:309/34!important}#ux-improved-header .header-tools{gap:9px!important}#ux-improved-header .header-tool{height:25px!important;min-height:25px!important;width:23px!important}#ux-improved-header .header-tool svg{width:16px!important;height:16px!important}#ux-improved-header .header-lang{width:26px!important;height:26px!important;font-size:9px!important}#ux-improved-header .hours-toggle{height:27px!important;min-height:27px!important;padding:0 8px!important;gap:6px!important}#ux-improved-header .hours-toggle .hint{font-size:9px!important;display:inline!important}#ux-improved-header .hours-toggle .clock{font-size:10px!important}#ux-improved-header .hours-popup{top:60px!important;right:10px!important}}',
    '@media(max-width:720px){#ux-improved-header .header-line{height:58px!important;min-height:58px!important;padding:0 12px!important;gap:7px!important}#ux-improved-header .brand-cropped{width:185px!important}#ux-improved-header .header-tools{gap:4px!important}#ux-improved-header .hours-toggle .hint{display:none!important}#ux-improved-header .header-tool.help{display:none!important}#ux-improved-header .header-tool.search-top{display:grid!important}#ux-improved-header .header-tool.user-top{display:grid!important}}',
    '@media(max-width:460px){#ux-improved-header .brand-cropped{width:150px!important}#ux-improved-header .header-line{padding:0 9px!important}#ux-improved-header .header-tools{gap:3px!important}#ux-improved-header .hours-toggle{padding:0 5px!important;gap:3px!important}#ux-improved-header .hours-toggle .clock{font-size:9px!important}#ux-improved-header .header-tool.user-top{display:none!important}#ux-improved-header .header-tool.search-top{display:none!important}}'
  ].join("");
  document.head.appendChild(style);
  const header=document.createElement("header");
  header.id="ux-improved-header";
  header.className="top";
  header.innerHTML=
    '<div class="header-line"><a class="logo" href="'+home+'" aria-label="홍익대학교 중앙도서관 홈">'+
    '<img class="brand-cropped" src="'+brandImage+'" alt="홍익대학교 | 중앙도서관" width="309" height="34" decoding="async"></a>'+
    '<div class="header-tools"><div class="hours-anchor" id="hours">'+
    '<button class="hours-toggle" type="button" id="hours-toggle" aria-expanded="false" aria-controls="hours-popup" aria-label="시설 운영 시간 펼치기">'+
    '<span class="hint" id="hours-date-label">중앙도서관 오늘</span><strong class="clock" id="hours-summary">09:00 - 20:00</strong>'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>'+
    '<aside class="hours-popup" id="hours-popup" hidden aria-label="시설 운영 시간">'+
    '<div class="hours-popup-title"><h2>시설 운영 시간</h2><time id="today"></time></div>'+
    '<div class="hours-popup-body"><div id="hl"></div><p>학기 중 기준 시간으로, 시험기간, 방학, 공휴일에는 달라질 수 있습니다.</p>'+
    '<a href="'+readingHref+'">자세히보기</a></div></aside></div>'+
    '<button type="button" class="header-tool help" aria-label="도움말"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M10 9c0-3 5-3 5 .5 0 2-3 2-3 4M12 17h.01"/></svg></button>'+
    '<a class="header-tool user-top" href="'+account+'" aria-label="내 계정"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-8 16-8 16 0"/></svg></a>'+
    '<button type="button" class="header-lang" aria-label="언어 선택">EN</button>'+
    '<button type="button" class="header-tool search-top" id="focus-search" aria-label="검색창으로 이동"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg></button>'+
    '</div></div>';
  existing.replaceWith(header);
  const $=s=>header.querySelector(s);
  const toggle=$("#hours-toggle"),popup=$("#hours-popup"),pad=n=>String(n).padStart(2,"0");
  const schedule=[
    ["중앙도서관",[9,20],[9,18],[9,18]],
    ["자료열람실",[9,20],[9,13],null],
    ["일반열람실",[6,23],[6,23],[6,23]],
    ["법학도서관",[9,20],null,null],
    ["The H Reading Lounge",[9,20],[10,18],[10,18]],
    ["대출·반납 데스크",[9,20],[9,13],null]
  ];
  const parts=new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",month:"numeric",day:"numeric",weekday:"short"}).formatToParts(new Date());
  const part=k=>(parts.find(p=>p.type===k)||{}).value||"";
  const weekday=part("weekday").replace(/[()]/g,"").trim().slice(0,1);
  const date=Number(part("month"))+"월 "+Number(part("day"))+"일 ("+weekday+")";
  const dayNum="일월화수목금토".indexOf(weekday),kind=dayNum===0?3:dayNum===6?2:1;
  const mainTime=schedule[0][kind];
  $("#hours-date-label").textContent="중앙도서관 "+date;
  $("#today").textContent=date;
  $("#hours-summary").textContent=mainTime?pad(mainTime[0])+":00 - "+pad(mainTime[1])+":00":"오늘 휴실";
  $("#hl").innerHTML=schedule.map(row=>{const r=row[kind];return '<div class="hour-item"><strong>'+row[0]+'</strong><time>'+(r?pad(r[0])+":00 – "+pad(r[1])+":00":"오늘 휴실")+'</time></div>'}).join("");
  function syncTestGuide(){
    const host=document.querySelector('[data-ux-task-panel="improved"]');
    if(!host)return;
    const panel=host.shadowRoot?.querySelector(".panel");
    if(!popup.hidden && window.innerWidth>800){
      const y=Math.ceil(popup.getBoundingClientRect().bottom+12);
      host.style.setProperty("top",y+"px","important");
      if(panel)panel.style.maxHeight="max(120px,calc(100dvh - "+(y+12)+"px))";
    }else{
      host.style.removeProperty("top");
      if(panel)panel.style.removeProperty("max-height");
    }
  }
  function close(){
    popup.hidden=true;
    toggle.setAttribute("aria-expanded","false");
    toggle.setAttribute("aria-label","시설 운영 시간 펼치기");
    syncTestGuide();
  }
  toggle.addEventListener("click",()=>{
    const opening=popup.hidden;
    popup.hidden=!opening;
    toggle.setAttribute("aria-expanded",String(opening));
    toggle.setAttribute("aria-label",opening?"시설 운영 시간 접기":"시설 운영 시간 펼치기");
    syncTestGuide();
  });
  document.addEventListener("click",event=>{if(!event.target.closest("#ux-improved-header .hours-anchor"))close()});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!popup.hidden){close();toggle.focus()}});
  window.addEventListener("resize",syncTestGuide);
  $("#focus-search").addEventListener("click",()=>{
    const input=document.querySelector("#sf input") || document.querySelector('main input[type="search"],main #q');
    if(input){input.focus();input.scrollIntoView({behavior:"smooth",block:"center"})}
    else location.href=search;
  });
  function unavailable(){
    let message=document.querySelector("#ux-improved-header-message");
    if(!message){
      message=document.createElement("div");
      message.id="ux-improved-header-message";
      message.setAttribute("role","status");
      message.style.cssText="position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:1000;padding:10px 15px;border-radius:9px;background:#1b2941;color:white;font:14px Arial,sans-serif;box-shadow:0 4px 12px #0003";
      document.body.appendChild(message);
    }
    message.textContent="시연용 화면에서는 제공되지 않는 기능입니다.";
    message.hidden=false;
    clearTimeout(unavailable.timer);
    unavailable.timer=setTimeout(()=>{message.hidden=true},2000);
  }
  $(".header-tool.help").addEventListener("click",unavailable);
  $(".header-lang").addEventListener("click",unavailable);
})();