/* Shared homepage snapshot content for the original and improved UX prototypes.
   Both variants intentionally display the same November 2026 content set.
   Visual cards are UI recreations; unsupported destinations show a small notice. */
(function(){
"use strict";
if(window.HongikHomeContent)return;
const noticeData=[
 ["","학생회관 출입 통제에 따른 도서관 시설 이용 제한 안내","2026.11.23"],
 ["","2027 홍익대 도서관 달력 디자인 공모전 수상작 발표","2026.11.20"],
 ["","의심행동자 신고 안내","2026.11.19"],
 ["","2026 KSDC DB 활용 사례 공모전 (총 상금 120만원!!)","2026.11.17"],
 ["일반","분실물 정리 안내 2차 (The H Reading Lounge)","2026.11.19"],
 ["학술","IOP(영국물리학회) 출판사 사이트 유지보수로 인한 일시 원문 이용 중단 안내","2026.11.19"],
 ["일반","dCollection 서비스 일시 중단 안내(11/25)","2026.11.18"],
 ["일반","[직무박람회] 도서관 x 취업 레벨업 커피 쿠폰 당첨자 안내","2026.11.18"]
];
const posts=[
 ["학생 작품 전시 접수","작품 전시 신청","arts"],
 ["정부/공공기관 간행물 아카이빙","간행물 열람","archives"],
 ["홍익대 전자책 이용가이드","전자책 이용","ebook"],
 ["이러닝(해커스, 박문각, 러닝 365, 아이티고)","이러닝 이용","elearn"]
];
const papers=[
 ["신소재공학과","이원규 교수 연구팀","materials"],
 ["전자전기공학부","강동우 교수 연구팀","ieee"],
 ["기계시스템디자인공학과","김현철 교수","small"],
 ["화학공학과","최수형 교수 연구팀","science"],
 ["AI·실감미디어콘텐츠학과","한정엽 교수 연구팀","access"]
];
const books=[
 ["오래 곁에 두어 좋은 말","light"],
 ["에이전트 워크플로우","lime"],
 ["끝나지 않는 노래","dark"],
 ["오늘도 고쳤습니다","blue"],
 ["살 것인가, 팔 것인가, 버틸 것인가","black"]
];
const quick=[
 ["도서관 소식","news","megaphone"],
 ["이용자별 안내","","users"],
 ["자료 구입 신청","","cart"],
 ["추천도서/큐레이션","new","pictures"],
 ["교외접속","","layers"],
 ["주요 전자자료","","monitor"],
 ["전자책·이러닝·전자잡지","","headphones"],
 ["도서관 시설 안내","","building"],
 ["연체료 온라인 납부","","chevron"]
];
const svgShapes={
 megaphone:'<path d="M4 9h5l9-5v16l-9-5H4zM9 15l2 5M21 9c2 2 2 4 0 6"/>',
 users:'<circle cx="12" cy="6" r="3"/><circle cx="4" cy="11" r="2"/><circle cx="20" cy="11" r="2"/><path d="M5 22v-3c0-8 14-8 14 0v3M1 21v-5M23 21v-5"/>',
 cart:'<path d="M4 4h16v8H4zM8 12v7m8-7v7M3 20h18"/><text x="12" y="10" font-size="5" text-anchor="middle" fill="currentColor" stroke="none">BOOK</text>',
 pictures:'<rect x="3" y="3" width="14" height="14" rx="1"/><path d="m4 16 5-5 3 3 4-5M10 6h.02"/><rect x="8" y="8" width="13" height="13" rx="1"/>',
 layers:'<path d="m2 8 10-5 10 5-10 5zM2 13l10 5 10-5M2 18l10 5 10-5"/>',
 monitor:'<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M9 22h6M12 19v3M7 8h10M7 12h6"/>',
 headphones:'<path d="M4 14V12a8 8 0 0 1 16 0v2M4 15h4v6H6a2 2 0 0 1-2-2zM20 15h-4v6h2a2 2 0 0 0 2-2z"/>',
 building:'<path d="M3 21V9l9-6 9 6v12zM8 21v-7h8v7M7 10h.01M17 10h.01M4 21h16"/>',
 chevron:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7 10 5 5 5-5"/>'
};
function glyph(name){
 return '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">'+svgShapes[name]+'</svg>';
}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const styleText=[
'.ux-home-snapshot{--s-blue:#0034dc;--s-deep:#1c4f2f;--s-bg:#fff;max-width:1150px;width:100%;margin:0 auto;padding:0 15px 30px;color:#171717;font:14px/1.48 Arial,"Malgun Gothic",sans-serif}',
'.ux-home-snapshot *{box-sizing:border-box}',
'.ux-home-snapshot button,.ux-home-snapshot a{font:inherit;cursor:pointer}',
'.ux-home-snapshot .snap-hero{position:relative;background:#f0eee1;border-radius:7px;height:320px;margin:0 0 20px;overflow:hidden;border:1px solid #d8e0d2;color:#1c4f2f}',
'.ux-home-snapshot .snap-hero::before{content:"";position:absolute;inset:0;border:24px solid #1d522f;clip-path:polygon(0 0,100% 0,100% 100%,0 100%,0 0,4% 0,4% 20%,0 20%,0 80%,8% 80%,8% 100%,90% 100%,90% 80%,100% 80%,100% 20%,96% 20%,96% 0);pointer-events:none}',
'.ux-home-snapshot .snap-hero:after{content:"✳";position:absolute;left:7%;top:14px;font-size:35px;font-weight:400;color:#1d522f}',
'.ux-home-snapshot .snap-hero-title{position:absolute;left:4.5%;right:4%;top:50px;font-size:clamp(38px,6.8vw,81px);line-height:1.03;letter-spacing:-.085em;font-weight:950;white-space:nowrap;color:#205330}',
'.ux-home-snapshot .snap-hero-second{position:absolute;left:21%;right:10%;top:152px;font-size:clamp(36px,7vw,79px);line-height:1.16;font-weight:950;letter-spacing:-.08em;white-space:nowrap}',
'.ux-home-snapshot .snap-hero-outline{color:#f0eee1;-webkit-text-stroke:2px #1d522f;text-shadow:none;margin-right:18px}',
'.ux-home-snapshot .snap-hero-cats{position:absolute;bottom:8px;left:11%;right:11%;display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:15px;font-weight:900;white-space:nowrap}',
'.ux-home-snapshot .snap-hero-cta{position:absolute;bottom:0;left:45%;transform:translateX(-50%);background:#1d522f;color:#fff;border-radius:18px 18px 0 0;border:0;min-height:43px;padding:8px 18px;font-weight:800}',
'.ux-home-snapshot .snap-star{position:absolute;color:#1d522f;font-size:33px}.ux-home-snapshot .star-1{left:20%;bottom:48px}.ux-home-snapshot .star-2{left:74%;bottom:60px}',
'.ux-home-snapshot .snap-quick{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:0;border-top:0;border-bottom:1px solid #dedede;margin-bottom:24px;height:auto;min-height:112px;position:static;align-items:stretch;justify-content:initial}',
'.ux-home-snapshot .snap-quick a{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:12px;min-height:110px;padding:9px 2px 18px;color:#707070;text-decoration:none;text-align:center;font-size:12px;font-weight:750;line-height:1.45;border-bottom:4px solid transparent}',
'.ux-home-snapshot .snap-quick a:first-child{border-color:#0034dc;color:#222}.ux-home-snapshot .snap-quick a:hover,.ux-home-snapshot .snap-quick a:focus-visible{color:#0034dc;border-color:#0034dc}',
'.ux-home-snapshot .snap-quick svg{flex:none;height:43px;width:43px;stroke-width:1.2}',
'.ux-home-snapshot .snap-panels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;align-items:stretch}',
'.ux-home-snapshot .snap-panel{background:#fff;border:1px solid #c7c7c7;border-radius:8px;padding:21px 24px 22px;min-width:0;min-height:367px;overflow:hidden}',
'.ux-home-snapshot .snap-section-heading{margin:0;min-height:34px;font-size:18px;color:#151515;display:flex;justify-content:space-between;align-items:center;font-weight:900;border-bottom:1px solid #e22c2c;padding-bottom:12px}',
'.ux-home-snapshot .snap-section-heading button{border:0;background:none;font-size:20px;color:#6a6a6a;line-height:1;padding:0 3px}',
'.ux-home-snapshot .snap-tabs{display:flex;gap:8px;margin:17px 0 10px}',
'.ux-home-snapshot .snap-tabs button{border:0;border-radius:4px;background:#f0f0f2;color:#777;font-size:11px;padding:5px 12px;font-weight:650}',
'.ux-home-snapshot .snap-tabs button[aria-pressed=true]{background:#0034dc;color:#fff}',
'.ux-home-snapshot .snap-notices{padding:0;margin:0;list-style:none;display:flex;flex-direction:column;gap:1px}',
'.ux-home-snapshot .snap-notices li{display:flex;align-items:center;gap:8px;min-height:25px;font-size:11px;line-height:1.25}',
'.ux-home-snapshot .snap-notices li .kind{flex:none;font-size:10px;border-radius:2px;padding:1px 3px;background:#fb4545;color:#fff;font-weight:800}',
'.ux-home-snapshot .snap-notices li .kind.academic{background:#7951ea}',
'.ux-home-snapshot .snap-notices li .speaker{color:#0034dc;flex:none;font-weight:900;font-size:13px}',
'.ux-home-snapshot .snap-notices li .n-title{flex:1 1 auto;min-width:0;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;font-size:11px;font-weight:650;text-decoration:none;color:#1b1b1b}',
'.ux-home-snapshot .snap-notices li time{font-size:10px;flex:none;letter-spacing:-.03em;color:#555}',
'.ux-home-snapshot .snap-rapid{padding:10px;background:#294582;border-radius:7px;display:flex;align-items:stretch;border:0}',
'.ux-home-snapshot .snap-rapid-inner{width:100%;height:100%;background:#f2eee0;border-radius:4px;padding:16px 15px;color:#234579;position:relative;overflow:hidden}',
'.ux-home-snapshot .rapid-logo{font-size:37px;font-weight:950;color:#26447d;letter-spacing:-.07em;line-height:1.2;display:flex;justify-content:space-between;gap:5px;align-items:center;white-space:nowrap}',
'.ux-home-snapshot .rapid-logo small{font-size:12px;line-height:1.4;letter-spacing:0;text-align:right}',
'.ux-home-snapshot .rapid-pill{display:inline-block;border-radius:99px;background:#224784;color:white;font-size:10px;font-weight:800;padding:4px 13px;margin:14px 0 5px}',
'.ux-home-snapshot .rapid-description{font-size:10px;line-height:1.75;color:#224476;margin:0}',
'.ux-home-snapshot .rapid-perks{font-size:10px;line-height:1.65;color:#224476;margin:7px 0 3px;display:grid;grid-template-columns:1fr 1fr}',
'.ux-home-snapshot .rapid-footer{font-size:10px;white-space:normal;margin:0;color:#244879}',
'.ux-home-snapshot .rapid-dots{position:absolute;bottom:2px;display:flex;gap:9px;color:white}.ux-home-snapshot .rapid-dots i{width:8px;height:8px;background:#fff;border-radius:50%}',
'.ux-home-snapshot .snap-infographic .snap-section-heading{margin-bottom:20px}',
'.ux-home-snapshot .snap-graph-title{font-weight:800;font-size:12px;margin:0 0 11px}',
'.ux-home-snapshot .snap-graph{display:grid;grid-template-columns:74px minmax(0,1fr);height:235px;gap:8px;align-items:stretch;font-size:10px;color:#888}',
'.ux-home-snapshot .snap-graph-labels{display:grid;grid-template-rows:repeat(10,1fr);gap:2px;text-align:right;white-space:nowrap;overflow:hidden}',
'.ux-home-snapshot .snap-graph-labels span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.ux-home-snapshot .snap-graph-bars{display:grid;grid-template-rows:repeat(10,1fr);gap:2px;background:repeating-linear-gradient(to right,transparent 0,transparent 19.5%,#e2e2e2 19.5%,#e2e2e2 20%)}',
'.ux-home-snapshot .snap-graph-bars i{display:block;background:#8bb7d7;height:100%;max-width:100%;box-shadow:inset 0 -1px #fff}',
'.ux-home-snapshot .snap-rails{margin:33px 0 2px;padding:0 18px;position:relative}',
'.ux-home-snapshot .snap-rail-heading{display:flex;align-items:center;justify-content:space-between;margin:0 0 10px;font-size:17px;color:#1c1c1c;font-weight:900}',
'.ux-home-snapshot .snap-rail-heading button{font-size:19px;color:#777;background:transparent;border:0}',
'.ux-home-snapshot .snap-rail{display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - 42px)/4);gap:14px;overflow-x:auto;scrollbar-width:none;scroll-snap-type:x mandatory}',
'.ux-home-snapshot .snap-rail::-webkit-scrollbar{display:none}',
'.ux-home-snapshot .snap-rail.paper-rail,.ux-home-snapshot .snap-rail.book-rail{grid-auto-columns:calc((100% - 56px)/5)}',
'.ux-home-snapshot .snap-thumb{min-width:0;scroll-snap-align:start}',
'.ux-home-snapshot .snap-thumb a{display:block;color:inherit;text-decoration:none}',
'.ux-home-snapshot .snap-thumb .snap-graphic{height:153px;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;position:relative;padding:12px}',
'.ux-home-snapshot .snap-thumb .snap-graphic strong{position:relative;z-index:1;font-size:18px;line-height:1.24;letter-spacing:-.035em}',
'.ux-home-snapshot .snap-thumb .snap-thumb-category{display:block;font-size:10px;color:#0034dc;font-weight:850;margin:9px 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.ux-home-snapshot .snap-thumb .snap-thumb-title{display:block;font-size:12px;color:#151515;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
'.ux-home-snapshot .snap-graphic.arts{background:radial-gradient(circle at 95% 5%,#ee4453 0 17%,transparent 17%),radial-gradient(circle at 0% 0%,#197f60 0 18%,transparent 18%),#fff2d7;color:#171717}',
'.ux-home-snapshot .snap-graphic.arts:before{content:"홍익대 중앙도서관";position:absolute;top:24px;left:13px;right:13px;font-size:12px;background:#f5e8bd;padding:5px}',
'.ux-home-snapshot .snap-graphic.arts strong{top:12px}',
'.ux-home-snapshot .snap-graphic.archives{background:linear-gradient(130deg,#45652e,#235823);color:white}',
'.ux-home-snapshot .snap-graphic.archives:after{content:"▥　▦　▤";position:absolute;bottom:8px;font-size:26px;color:#f4f6e4}',
'.ux-home-snapshot .snap-graphic.ebook{background:linear-gradient(125deg,#f8f8f8,#fff);color:#111;border:1px solid #dcdcdc}',
'.ux-home-snapshot .snap-graphic.ebook strong{background:#f3e631;padding:16px 5px;border:3px solid #111;transform:rotate(-6deg)}',
'.ux-home-snapshot .snap-graphic.elearn{background:#ffc92c;color:#ffeb00}',
'.ux-home-snapshot .snap-graphic.elearn strong{background:#6442bc;color:#fff;padding:15px 7px;font-size:19px}',
'.ux-home-snapshot .snap-graphic.materials{background:radial-gradient(ellipse at 50% 78%,#92cf68,#f07c42 25%,#533020 60%,#a35732);color:#fff}',
'.ux-home-snapshot .snap-graphic.ieee{background:linear-gradient(180deg,#fff 15%,#cdf9ee 35%,#2e7277 70%,#f8f8f8);color:#1c676b}',
'.ux-home-snapshot .snap-graphic.small{background:radial-gradient(ellipse at 65% 70%,#bc4fe4,#008dd0 40%,#151753 70%);color:white}',
'.ux-home-snapshot .snap-graphic.science{background:linear-gradient(135deg,#090a16,#23233d 35%,#eb9d4c 55%,#111 70%);color:#fff}',
'.ux-home-snapshot .snap-graphic.access{background:linear-gradient(180deg,#fff 12%,#55c9ee 32%,#0068bc 75%,#80dafa);color:#fff}',
'.ux-home-snapshot .snap-graphic.paper-graphic{height:210px;align-items:flex-start;justify-content:flex-start;padding:9px 8px;font-family:Arial,sans-serif}',
'.ux-home-snapshot .snap-graphic.paper-graphic strong{font-size:20px;text-align:left;line-height:1}',
'.ux-home-snapshot .snap-graphic.paper-graphic:after{content:"";position:absolute;bottom:12px;right:15px;width:48%;height:55px;background:linear-gradient(#fff,#dee5f0);border:2px solid #ddd;box-shadow:-55px 4px 0 -9px #eeeeed}',
'.ux-home-snapshot .snap-graphic.light{background:linear-gradient(180deg,#fafafa 0,#f3f0ec 70%,#ebd2d7);color:#555}',
'.ux-home-snapshot .snap-graphic.lime{background:linear-gradient(115deg,#0fff51,#baf7a6);color:#023c20}',
'.ux-home-snapshot .snap-graphic.dark{background:radial-gradient(ellipse at 50% 70%,#fafefb 0 21%,transparent 22%),#15171a;color:#fff}',
'.ux-home-snapshot .snap-graphic.blue{background:linear-gradient(135deg,#0a9ad2,#0071ab);color:#fff39b}',
'.ux-home-snapshot .snap-graphic.black{background:linear-gradient(180deg,#06070a,#000);color:#f44}',
'.ux-home-snapshot .snap-graphic.book-graphic{height:190px;margin:0 15px;border-radius:5px;box-shadow:2px 3px 6px #0002;align-items:flex-start;justify-content:center}',
'.ux-home-snapshot .snap-graphic.book-graphic strong{font-size:15px;writing-mode:vertical-rl;letter-spacing:.01em;line-height:1.6;max-height:90%}',
'.ux-home-snapshot .snap-rail-arrows{position:absolute;left:-5px;right:-5px;top:48%;display:flex;justify-content:space-between;pointer-events:none}',
'.ux-home-snapshot .snap-rail-arrows button{pointer-events:auto;background:transparent;color:#222;font-size:32px;line-height:1;border:0;padding:0 4px}',
'@media(max-width:900px){.ux-home-snapshot .snap-panels{gap:12px}.ux-home-snapshot .snap-panel{padding:16px 12px}.ux-home-snapshot .snap-hero{height:285px}.ux-home-snapshot .snap-hero-title{top:70px}.ux-home-snapshot .snap-hero-second{top:153px}.ux-home-snapshot .snap-hero-cats{font-size:11px}.ux-home-snapshot .rapid-logo{font-size:27px}.ux-home-snapshot .rapid-logo small{font-size:9px}.ux-home-snapshot .snap-notices li{font-size:10px}.ux-home-snapshot .snap-notices li time{font-size:9px}}',
'@media(max-width:680px){.ux-home-snapshot{padding:0 12px}.ux-home-snapshot .snap-hero{height:225px}.ux-home-snapshot .snap-hero-title{top:65px;font-size:clamp(25px,6.2vw,42px)}.ux-home-snapshot .snap-hero-second{top:122px;font-size:clamp(27px,6.6vw,42px);left:13%}.ux-home-snapshot .snap-hero-outline{margin-right:6px}.ux-home-snapshot .snap-hero-cats{font-size:8px;left:6%;right:5%;bottom:8px}.ux-home-snapshot .snap-hero-cta{bottom:29px;font-size:10px;min-height:26px;padding:3px 10px}.ux-home-snapshot .snap-quick{grid-template-columns:repeat(3,1fr)}.ux-home-snapshot .snap-quick a{min-height:100px}.ux-home-snapshot .snap-panels{grid-template-columns:1fr}.ux-home-snapshot .snap-panel{min-height:300px}.ux-home-snapshot .snap-rail{grid-auto-columns:calc((100% - 15px)/2)}.ux-home-snapshot .snap-rail.paper-rail,.ux-home-snapshot .snap-rail.book-rail{grid-auto-columns:calc((100% - 20px)/2.5)}.ux-home-snapshot .snap-rails{padding:0 13px}.ux-home-snapshot .snap-rapid{min-height:350px}.ux-home-snapshot .snap-notices li{min-height:30px}}'
].join('\n');
function mount(target,options){
 if(!target || target.dataset.snapshotMounted==="1")return;
 target.dataset.snapshotMounted="1";
 const isOriginal=options&&options.variant==="original";
 const searchHref=title=>isOriginal?'./?q='+encodeURIComponent(title)+'&view=results':'./search.html?q='+encodeURIComponent(title);
 const imgPosts=posts.map(p=>'<article class="snap-thumb"><a href="#" data-snap-sample="'+escape(p[1])+'"><div class="snap-graphic '+p[2]+'"><strong>'+escape(p[0])+'</strong></div><span class="snap-thumb-category">'+escape(p[0])+'</span><span class="snap-thumb-title">'+escape(p[1])+'</span></a></article>').join('');
 const imgPapers=papers.map(p=>'<article class="snap-thumb"><a href="#" data-snap-sample="'+escape(p[1])+'"><div class="snap-graphic paper-graphic '+p[2]+'"><strong>'+({materials:'ADVANCED MATERIALS',ieee:'IEEE TRANSACTIONS',small:'small',science:'ADVANCED SCIENCE',access:'IEEE Access'}[p[2]])+'</strong></div><span class="snap-thumb-category">'+escape(p[0])+'</span><span class="snap-thumb-title">'+escape(p[1])+'</span></a></article>').join('');
 const imgBooks=books.map(p=>'<article class="snap-thumb"><a href="'+searchHref(p[0])+'"><div class="snap-graphic book-graphic '+p[1]+'"><strong>'+escape(p[0])+'</strong></div><span class="snap-thumb-title">'+escape(p[0])+'</span></a></article>').join('');
 const notices=filter=>noticeData.filter(n=>!filter||n[0]===filter).map(n=>
 '<li>'+(n[0]?'<span class="kind '+(n[0]==="학술"?'academic':'')+'">'+escape(n[0])+'</span>':'<span class="speaker" aria-hidden="true">◖))</span>')+
 '<a class="n-title" href="#" data-snap-sample="'+escape(n[1])+'" title="'+escape(n[1])+'">'+escape(n[1])+'</a><time>'+escape(n[2])+'</time></li>').join('');
 target.classList.add('ux-home-snapshot');
 target.innerHTML='<section class="snap-hero" aria-label="신입생 추천 도서 안내 배너">'+
   '<span class="snap-star star-1" aria-hidden="true">✳</span><span class="snap-star star-2" aria-hidden="true">✳</span>'+
   '<div class="snap-hero-title">보법이 다른 대학생활을 위한</div>'+
   '<div class="snap-hero-second"><span class="snap-hero-outline">신입생</span> 추천 도서</div>'+
   '<div class="snap-hero-cats"><span>인문/법/역사</span><span>소설/에세이/자기계발/취미</span><span>경제/경영/과학/공학</span><span>디자인/미술</span><span>예술/음악</span></div>'+
   '<button type="button" class="snap-hero-cta" data-snap-sample="신입생 추천 도서">바로가기</button></section>'+
   '<nav class="snap-quick" aria-label="도서관 주요 바로가기">'+quick.map((q,i)=>
    '<a href="'+(q[1]?'#'+q[1]:'#')+'" aria-label="'+escape(q[0])+'"'+(!q[1]?' data-snap-sample="'+escape(q[0])+'"':'')+(i===0?' aria-current="page"':'')+'>'+glyph(q[2])+'<span>'+escape(q[0])+'</span></a>').join('')+'</nav>'+
   '<div class="snap-panels">'+
    '<section class="snap-panel" id="news"><h2 class="snap-section-heading">공지사항 <button type="button" aria-label="공지사항 더보기" data-snap-sample="공지사항 더보기">···</button></h2>'+
     '<div class="snap-tabs" role="group" aria-label="공지사항 유형"><button type="button" aria-pressed="true" data-snap-filter="">전체</button><button type="button" aria-pressed="false" data-snap-filter="일반">일반공지</button><button type="button" aria-pressed="false" data-snap-filter="학술">학술공지</button></div>'+
     '<ul class="snap-notices">'+notices('')+'</ul></section>'+
    '<section class="snap-panel snap-rapid"><div class="snap-rapid-inner"><div class="rapid-logo">RapidILL <small>외국학술논문<br>무료원문복사서비스</small></div>'+
     '<span class="rapid-pill">RapidILL 서비스란?</span><p class="rapid-description">국내에서 구할 수 없는 외국학술지 논문을 협력기관으로부터 24시간 이내로<br>신속하게 제공받을 수 있는 외국학술논문 무료원문복사서비스</p>'+
     '<div class="rapid-perks"><span>☑ 150만 건의 자료 요청</span><span>☑ 평균 처리 시간 11.2시간</span><span>☑ 95% 요청 처리율</span><span>☑ 500개 도서관 협력 네트워크</span></div>'+
     '<span class="rapid-pill">신청방법</span><p class="rapid-footer">도서관 홈페이지 로그인 › 자료이용 › 원문복사 › RapidILL 신청하기</p>'+
     '<span class="rapid-pill">문의</span><p class="rapid-footer">열람팀 참고자료실 02-320-1306</p><div class="rapid-dots"><i></i><i></i><i></i><i></i></div></div></section>'+
    '<section class="snap-panel snap-infographic"><h2 class="snap-section-heading">인포그래픽 <button type="button" aria-label="인포그래픽 더보기" data-snap-sample="인포그래픽 더보기">···</button></h2>'+
    '<p class="snap-graph-title">인기대출 도서 현황(최근 1개월간)</p><div class="snap-graph">'+
    '<div class="snap-graph-labels">'+['몬슨: 양...','현대미술의...','궁정학자...','철학: 구...','정통 이론...','중의 기원...','한율 수업...','프로젝트 해...','데미안','행동 사유...'].map(v=>'<span>'+escape(v)+'</span>').join('')+'</div>'+
    '<div class="snap-graph-bars">'+[94,78,69,62,61,59,57,53,49,47].map(v=>'<i style="width:'+v+'%"></i>').join('')+'</div></div></section></div>'+
   '<section class="snap-rails" aria-label="신규 포스트"><h2 class="snap-rail-heading">신규 포스트 <button type="button" data-snap-sample="신규 포스트 전체 보기" aria-label="신규 포스트 더보기">···</button></h2>'+
     '<div class="snap-rail" data-snap-rail="posts">'+imgPosts+'</div><div class="snap-rail-arrows"><button type="button" data-snap-move="posts:-1" aria-label="이전 신규 포스트">‹</button><button type="button" data-snap-move="posts:1" aria-label="다음 신규 포스트">›</button></div></section>'+
   '<section class="snap-rails" aria-label="홍익 Hot Paper"><h2 class="snap-rail-heading">홍익 Hot Paper <button type="button" data-snap-sample="홍익 Hot Paper 전체 보기" aria-label="홍익 Hot Paper 더보기">···</button></h2>'+
     '<div class="snap-rail paper-rail" data-snap-rail="papers">'+imgPapers+'</div><div class="snap-rail-arrows"><button type="button" data-snap-move="papers:-1" aria-label="이전 Hot Paper">‹</button><button type="button" data-snap-move="papers:1" aria-label="다음 Hot Paper">›</button></div></section>'+
   '<section class="snap-rails" id="new" aria-label="신착 자료"><h2 class="snap-rail-heading">신착 자료 <button type="button" data-snap-sample="신착 자료 전체 보기" aria-label="신착 자료 더보기">···</button></h2>'+
     '<div class="snap-rail book-rail" data-snap-rail="books">'+imgBooks+'</div><div class="snap-rail-arrows"><button type="button" data-snap-move="books:-1" aria-label="이전 신착 자료">‹</button><button type="button" data-snap-move="books:1" aria-label="다음 신착 자료">›</button></div></section>';
 target.addEventListener('click',e=>{
  const filter=e.target.closest('[data-snap-filter]');
  if(filter){
   const key=filter.dataset.snapFilter;
   target.querySelector('.snap-notices').innerHTML=notices(key);
   target.querySelectorAll('[data-snap-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===filter)));
  }
  const arrow=e.target.closest('[data-snap-move]');
  if(arrow){
   const [name,step]=arrow.dataset.snapMove.split(':');
   const rail=target.querySelector('[data-snap-rail="'+name+'"]');
   if(rail)rail.scrollBy({left:Number(step)*Math.max(220,rail.clientWidth*.75),behavior:'smooth'});
  }
  const sample=e.target.closest('[data-snap-sample]');
  if(sample){
   e.preventDefault();
   const info=sample.dataset.snapSample;
   if(window.uxNotice)window.uxNotice(info+' · 시연용 화면입니다.');
   else{
    let msg=target.querySelector('.snap-message');
    if(!msg){msg=document.createElement('span');msg.className='snap-message';msg.setAttribute('role','status');msg.style.cssText='display:block;margin-top:15px;color:#0034dc;font-size:12px';target.appendChild(msg);}
    msg.textContent=info+' · 시연용 화면입니다.';
   }
  }
 });
}
const stylesheet=document.createElement('style');stylesheet.id='shared-home-content-style';stylesheet.textContent=styleText;document.head.appendChild(stylesheet);
window.HongikHomeContent={mount,noticeData,posts,papers,books};
})();