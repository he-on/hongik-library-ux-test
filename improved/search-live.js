/* W02 improved UI: use Hongik library's public JSONP API, with a clearly labelled
   saved response only for the test term '아몬드'. No credentials or backend needed. */
(function(){
  'use strict';
  const api='https://honors.hongik.ac.kr/n2prema/public/searchapi/';
  const typeMap={'book':'단행본','articles':'학술논문','ebook':'전자자료'};
  const labels={'book':'소장자료','articles':'학술논문','ebook':'전자책'};
  const fallback=window.HongikCatalogFallback || null;
  const status=document.getElementById('api-status');
  const tabButtons=Array.from(document.querySelectorAll('.tabs .tab'));
  const dialog=document.getElementById('book-detail');
  let activeTab='통합검색',currentPage=1,requestVersion=0,bySection={},runningJobs=[];
  const $id=id=>document.getElementById(id);
  const text=node=>node ? String(node.textContent||'').replace(/\s+/g,' ').trim() : '';
  function note(message,error){
    status.textContent=message;
    status.classList.toggle('error',Boolean(error));
  }
  function trustedUrl(candidate){
    if(!candidate)return '';
    try{
      const u=new URL(candidate,'https://honors.hongik.ac.kr');
      if(u.protocol!=='https:')return '';
      if(u.hostname==='honors.hongik.ac.kr'&&u.pathname==='/site-linker/'){
        const nested=u.searchParams.get('url');
        return nested ? trustedUrl(nested) : '';
      }
      if(u.hostname==='hongik.primo.exlibrisgroup.com'&&u.pathname==='/discovery/fulldisplay'&&u.searchParams.get('docid'))return u.href;
      return '';
    }catch(e){return ''}
  }
  function normalize(record,key){
    const pub=String(record.publication||'').trim();
    const yr=(pub.match(/(?:19|20)\d{2}/)||[])[0]||'정보 없음';
    const publisher=(pub.split(':').slice(1).join(':').split(',')[0]||pub).trim()||'정보 없음';
    const holdings=Array.isArray(record.holdings)?record.holdings:[];
    const physical=holdings.find(h=>h.includes('중앙도서관')) || holdings.find(h=>h.includes('문정도서관')) || holdings[0] || '';
    const location=String(physical).replace(/\s*\((?:이용가능|이용불가|대출중)\)\s*$/,'').trim();
    const branch=location.includes('문정도서관')?'문정도서관':location.includes('중앙도서관')?'중앙도서관':'전자도서관';
    const no=(location.match(/\(([^()]+)\)\s*$/)||[])[1]||'미제공';
    const statusText=String(record.availability||'');
    const available=statusText.includes('이용가능') ? true :
      (statusText.includes('이용불가')||statusText.includes('대출중') ? false : null);
    const kind=typeMap[key]||'단행본';
    const common={
      t:String(record.title||''),by:String(record.author||'저자 정보 없음'),type:kind,
      lib:key==='book'?branch:'전자도서관',st:available===null?'확인 필요':available?'이용 가능':'대출 중',
      sourceUrl:trustedUrl(record.originalLink),holdings:holdings,availabilityRaw:statusText,
      originalType:record.type||'',fromSection:key
    };
    if(kind==='단행본'){
      common.L='판본 정보';common.l=[['출판사',publisher],['출판연도',yr],['판차','원문 상세정보 참고'],['번역','원문 상세정보 참고']];
      common.R='소장 정보';common.r=[['위치',location||'위치 정보 없음'],['청구기호',no]];
    }else{
      common.L=kind==='학술논문'?'논문 정보':'자료 정보';
      common.l=[['발행정보',pub||'정보 없음'],['발행연도',yr]];
      common.R='이용 정보';common.r=[['이용 방법','온라인 이용 여부는 원문 확인']];
    }
    return common;
  }
  function parseResponse(response,key){
    if(!response||response.success!==true||typeof response.html!=='string')throw Error('검색 응답 형식 오류');
    const dom=new DOMParser().parseFromString(response.html,'text/html');
    const nodes=Array.from(dom.querySelectorAll('.serp-item'));
    const items=nodes.map(n=>{
      const title=n.querySelector('h4.title a, h4.title, h3.title a');
      const parts=Array.from(n.querySelectorAll('.pubinfo')).map(text).filter(Boolean);
      const misc=text(n.querySelector('.misc'));
      return{
        title:text(title),author:parts[0]||'',publication:parts.slice(1).join(' · '),
        availability:misc.includes('이용불가')||misc.includes('대출중')?'이용불가':
          misc.includes('이용가능')?'이용가능':'상태 미확인',
        holdings:Array.from(n.querySelectorAll('.status-item h5')).map(text).filter(Boolean),
        originalLink:title?title.getAttribute('href'):''
      };
    }).filter(x=>x.title);
    const hitcount=Math.max(0,Number(String(response.hitcount||0).replace(/,/g,''))||0);
    if(hitcount>0&&!items.length)throw Error('검색 결과 파싱 실패');
    return {items:items.map(x=>normalize(x,key)),hitcount,page:Number(response.pg)||1,totalPages:Number(response.totpage)||1,cached:false};
  }
  function savedResponse(key,q){
    if(!fallback||q!==fallback.query||!fallback.sections||!fallback.sections[key])return null;
    const f=fallback.sections[key];
    return{items:f.items.map(x=>normalize(x,key)),hitcount:f.hitcount,page:1,totalPages:1,cached:true};
  }
  function request(key,query,page){
    let callback='',script=null,timer=null,finished=false,rejectPromise=null;
    const promise=new Promise((resolve,reject)=>{
      rejectPromise=reject;
      callback='jQuery'+Date.now()+'_'+Math.floor(Math.random()*1000000000);
      const u=new URL(api);
      u.searchParams.set('section',key);
      u.searchParams.set('site_id','1');
      u.searchParams.set('q',query);
      u.searchParams.set('pg',String(page));
      u.searchParams.set('callback',callback);
      u.searchParams.set('_',String(Date.now()));
      const finish=(error,payload)=>{
        if(finished)return;
        finished=true;clearTimeout(timer);
        if(script&&script.parentNode)script.parentNode.removeChild(script);
        try{delete window[callback]}catch(_){window[callback]=undefined}
        if(error)reject(error);else resolve(payload);
      };
      window[callback]=data=>finish(null,data);
      script=document.createElement('script');
      script.async=true;script.src=u.href;
      script.onerror=()=>finish(Error('공개 API 요청 실패'));
      timer=setTimeout(()=>finish(Error('연결 제한시간 초과')),9000);
      document.head.appendChild(script);
      runningJobs.push(()=>finish(Error('이전 검색 취소')));
    });
    return promise;
  }
  const sectionKeys=()=>activeTab==='소장자료'?['book']:activeTab==='전자자료'?['articles','ebook']:['book','articles','ebook'];
  function selectCategory(){
    sel.type.clear();
    if(activeTab==='소장자료')sel.type.add('단행본');
    if(activeTab==='전자자료'){sel.type.add('학술논문');sel.type.add('전자자료')}
  }
  function updateList(){
    const keys=sectionKeys(),combined=keys.flatMap(k=>bySection[k]?bySection[k].items:[]);
    DATA.splice(0,DATA.length,...combined);
    render();
    const total=keys.reduce((a,k)=>a+(bySection[k]?Number(bySection[k].hitcount):0),0);
    const countLabel=$id('count');
    if(countLabel)countLabel.innerHTML='검색 결과 '+DATA.length+'건<span>현재 불러온 자료 · 전체 '+total.toLocaleString('ko-KR')+'건 중</span>';
    const nav=$id('pager');
    if(keys.length===1&&bySection[keys[0]]&&!bySection[keys[0]].cached){
      const data=bySection[keys[0]];
      nav.innerHTML='<button type="button" class="btn btn-line" data-pg="'+(currentPage-1)+'"'+(currentPage===1?' disabled':'')+'>이전 페이지</button>'+
        '<button type="button" class="btn btn-line" data-pg="'+(currentPage+1)+'"'+(currentPage>=data.totalPages?' disabled':'')+'>다음 페이지</button>';
    }else nav.innerHTML='';
  }
  async function loadSearch(){
    const query=$id('q').value.trim();
    if(!query){note('검색어를 입력해 주세요.');return}
    currentPage=Math.max(1,currentPage);
    requestVersion++;
    const version=requestVersion,keys=sectionKeys();
    runningJobs.forEach(cancel=>cancel());runningJobs=[];
    bySection={};
    DATA.splice(0,DATA.length);
    selectCategory();
    updateList();
    const current=new URL(location.href);
    current.searchParams.set('q',query);
    current.searchParams.set('view',activeTab==='통합검색'?'all':activeTab==='소장자료'?'book':'electronic');
    current.searchParams.set('pg',String(currentPage));
    history.replaceState({},'',current.pathname+current.search);
    note('실시간 도서관 검색 중…');
    if(currentPage===1){
      keys.forEach(k=>{const snapshot=savedResponse(k,query);if(snapshot)bySection[k]=snapshot});
      if(Object.keys(bySection).length){updateList();note('저장된 검색 결과를 먼저 표시하고 실시간 데이터를 확인하고 있어요.')}
    }
    const outcomes=await Promise.allSettled(keys.map(async key=>{
      const payload=await request(key,query,currentPage);
      const parsed=parseResponse(payload,key);
      if(version!==requestVersion)return;
      bySection[key]=parsed;updateList();
    }));
    if(version!==requestVersion)return;
    const failed=outcomes.filter(x=>x.status==='rejected').length;
    if(failed){
      if(DATA.length)note('실시간 조회 일부 실패 · 불러온 자료 또는 저장된 아몬드 결과를 표시합니다. 필터는 현재 표시된 자료에 적용돼요.');
      else note('공개 API에 연결하지 못했습니다. 다른 검색어는 미리 준비된 데이터가 없어 결과를 표시할 수 없어요.',true);
    }else note('실시간 검색 완료 · 검색 항목과 필터는 현재 불러온 결과에만 적용돼요.');
    updateList();
  }
  function changeQuery(){currentPage=1;loadSearch()}
  tabButtons.forEach(t=>{
    t.onclick=()=>{
      activeTab=t.textContent.trim();
      tabButtons.forEach(b=>b.setAttribute('aria-selected',String(b===t)));
      changeQuery();
    };
  });
  $id('go').onclick=changeQuery;
  $id('q').addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();changeQuery()}
  });
  $id('pager').addEventListener('click',e=>{
    const b=e.target.closest('button[data-pg]');
    if(!b||b.disabled)return;
    currentPage=Math.max(1,Number(b.dataset.pg)||1);
    loadSearch();
    window.scrollTo({top:0,behavior:'smooth'});
  });
  $id('toggle-filters').addEventListener('click',function(){
    const aside=$id('search-filters');
    const open=aside.classList.toggle('expanded');
    this.setAttribute('aria-expanded',String(open));
    this.textContent=open?'검색 결과 필터 닫기 ▴':'검색 결과 필터 열기 ▾';
  });
  function modalFor(d){
    $id('book-detail-title').textContent=d.t;
    const data=[['자료유형',d.type],['저자',d.by],['소장 도서관',d.lib],['대출 상태',d.st],...d.l,...d.r];
    const dl=$id('book-detail-info');
    dl.replaceChildren();
    data.forEach(([label,value])=>{
      const dt=document.createElement('dt'),dd=document.createElement('dd');
      dt.textContent=String(label);dd.textContent=String(value);
      dl.appendChild(dt);dl.appendChild(dd);
    });
    const link=$id('primo-link');
    if(d.sourceUrl){link.href=d.sourceUrl;link.style.display='block'}else{link.removeAttribute('href');link.style.display='none'}
    const mapButton=$id('detail-map');
    mapButton.hidden=d.type!=='단행본';
    const holdingChoice=$id('holding-choice'),choiceWrap=$id('holding-choice-container');
    const holdings=Array.isArray(d.holdings)?d.holdings.filter(Boolean):[];
    choiceWrap.hidden=d.type!=='단행본'||holdings.length<2;
    holdingChoice.replaceChildren();
    holdings.forEach((holding,index)=>{
      const option=document.createElement('option');
      option.value=holding;option.textContent=holding;
      holdingChoice.appendChild(option);
    });
    mapButton.onclick=()=>openMap(d,holdingChoice.value||'');
    dialog.showModal();
  }
  function openMap(d,chosenHolding){
    /* Forward the exact selected holding; do not substitute an invented shelf. */
    const holdings=Array.isArray(d.holdings)?d.holdings:[];
    const raw=String(chosenHolding||holdings[0]||field(d.r,'위치')||'').trim();
    const withoutStatus=raw.replace(/\s*\((?:이용가능|이용불가|대출중|대출가능|대출 중)\)\s*$/,'');
    const matched=withoutStatus.match(/\(([^()]+)\)\s*$/);
    const call=matched?matched[1].trim():field(d.r,'청구기호');
    const params=new URLSearchParams();
    params.set('q',$id('q').value.trim());
    params.set('title',d.t);
    params.set('holdingLibrary',d.lib||'');
    params.set('holdingLocation',raw);
    if(call&&call!=='미제공')params.set('holdingCallNumber',call);
    params.set('from','search');
    window.location.href='./shelf-map.html?'+params.toString();
  }
  $id('list').addEventListener('click',e=>{
    const button=e.target.closest('button[data-action]');
    if(!button)return;
    const index=Number(button.dataset.row),d=DATA[index];
    if(!d)return;
    if(button.dataset.action==='detail') {
      modalFor(d);
    } else if(d.st==='확인 필요') {
      // Viewing actual parsed bibliographic information is supported.
      modalFor(d);
    } else if(d.type==='단행본'&&d.st==='이용 가능') {
      openMap(d);
    } else if(d.type!=='단행본'&&d.st==='이용 가능'&&d.sourceUrl) {
      // Only open a verified original bibliographic detail URL.
      window.open(d.sourceUrl,'_blank','noopener,noreferrer');
    } else {
      // Reservation / full-text access are not implemented in this prototype.
      window.uxNotice?.(d.type==='단행본'
        ? '도서 예약 기능은 현재 시연에서 제공되지 않습니다.'
        : '원문 이용 및 대기 신청은 현재 시연에서 제공되지 않습니다.');
    }
  });
  dialog.querySelector('.dialog-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  const queryFromUrl=new URLSearchParams(location.search);
  const initial=queryFromUrl.get('q');
  if(initial)$id('q').value=initial;
  if(queryFromUrl.get('view')==='book')activeTab='소장자료';
  if(queryFromUrl.get('view')==='electronic')activeTab='전자자료';
  tabButtons.forEach(b=>b.setAttribute('aria-selected',String(b.textContent.trim()===activeTab)));
  currentPage=Math.max(1,Number(queryFromUrl.get('pg'))||1);
  // Provide the bookmark UI with the same source-backed fields as the detail modal.
  window.HongikImprovedCatalog = {
    bookmarkRecord(index) {
      const d = DATA[Number(index)];
      if (!d) return null;
      const field = (entries,label) => (entries || []).find(row => row[0] === label)?.[1] || "";
      const publication = (d.l || [])
        .filter(row => ["출판사","출판연도","발행정보","발행연도"].includes(row[0]))
        .filter(row => !["정보 없음","원문 상세정보 참고"].includes(String(row[1])))
        .map(row => row[0] + ": " + row[1]).join(" · ");
      const location = field(d.r, "위치");
      const callNumber = field(d.r, "청구기호");
      return {
        title:d.t || "", author:d.by || "",
        materialType:d.type || "", publication,
        availability:d.availabilityRaw && d.availabilityRaw !== "상태 미확인" ? d.availabilityRaw : (d.st === "확인 필요" ? "" : d.st),
        library:d.lib === "전자도서관" && d.type === "단행본" ? "" : d.lib,
        location:location === "위치 정보 없음" ? "" : location,
        callNumber:callNumber === "미제공" ? "" : callNumber,
        holdingsText:Array.isArray(d.holdings) ? d.holdings.join("\n") : "",
        detailUrl:d.sourceUrl || ""
      };
    }
  };
  if(initial?.trim())loadSearch();
  else note('검색어를 입력해 주세요.');
})();