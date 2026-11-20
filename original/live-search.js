/* Hongik University Central Library: public, read-only JSONP search.
 * Search terms always come from the input box. Each result category loads independently.
 */
(function () {
  'use strict';

  var API_ORIGIN = 'https://honors.hongik.ac.kr';
  var API_ENDPOINT = '/n2prema/public/searchapi/';
  var TIMEOUT_MS = 10000;
  var SECTIONS = [
    {key:'database', label:'추천 데이터베이스', type:'데이터베이스', optional:true},
    {key:'book', label:'소장자료', type:'도서'},
    {key:'articles', label:'학술논문', type:'학술논문'},
    {key:'ebook', label:'전자책/오디오북', type:'전자책'},
    {key:'journal', label:'전자저널', type:'전자저널'},
    {key:'riss_course', label:'공개 온라인 강의 콘텐츠', type:'공개강의'},
    {key:'riss_thesis', label:'국내, 외 학위논문', type:'학위논문'}
  ];
  var root = null;
  var state = null;
  var listenerRoot = null;
  var jobs = Object.create(null);
  var revision = 0;
  var requestId = 0;

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/[&<>"']/g, function (ch) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
      });
  }
  function textOf(node) {
    return node ? String(node.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }
  function allowUrl(path) {
    if (!path) return '';
    try {
      var url = new URL(path, API_ORIGIN);
      return url.protocol === 'https:' && url.hostname === 'honors.hongik.ac.kr' ? url.href : '';
    } catch (_) { return ''; }
  }

  // Convert the site's Primo redirect into the direct bibliographic detail URL.
  // Only records with an actual Alma/Primo identifier get a clickable link.
  function primoDetailUrl(book) {
    if (!book || !book.originalLink) return '';
    try {
      var source = new URL(book.originalLink, API_ORIGIN);
      if (source.hostname === 'honors.hongik.ac.kr' &&
          source.pathname === '/site-linker/') {
        var nested = source.searchParams.get('url');
        if (!nested) return '';
        source = new URL(nested);
      }
      if (source.protocol !== 'https:' ||
          source.hostname !== 'hongik.primo.exlibrisgroup.com' ||
          source.pathname !== '/discovery/fulldisplay') return '';
      var docid = source.searchParams.get('docid');
      if (!docid || !/^[A-Za-z0-9_.:-]{5,120}$/.test(docid)) return '';
      var direct = new URL('https://hongik.primo.exlibrisgroup.com/discovery/fulldisplay');
      direct.searchParams.set('docid', docid);
      direct.searchParams.set('context', source.searchParams.get('context') || 'L');
      direct.searchParams.set('vid', '82HUN_INST:HONGIK');
      direct.searchParams.set('lang', 'ko');
      return direct.href;
    } catch (_) { return ''; }
  }

  function holdingsPopup(book,key,index) {
    var holdings = book.holdings || [];
    if (!holdings.length) return '';
    var popupId='live-holding-'+key+'-'+index;
    var rows=holdings.map(function(h) {
      var original=String(h);
      var matched=original.match(/\s*\((이용가능|이용불가|대출중)\)\s*$/);
      var status=matched ? matched[1] : (book.availability || '상태 미확인');
      var location=matched ? original.slice(0,matched.index).trim() : original;
      return '<div class="live-holding-row"><span class="live-holding-badge' +
        (status === '이용가능' ? '' : ' is-unavailable') + '">' + esc(status) + '</span>' +
        '<span class="live-holding-location">' + esc(location) + '</span></div>';
    }).join('');
    // The holdings popover opens the same local bibliographic dialog that titles used to open.
    var footer='<button class="live-holding-detail" type="button" data-live-popup-detail="'+
      key+':'+index+'">자세히 보기</button>';
    return '<div class="live-holding-anchor">' +
      '<button class="holdings" type="button" data-live-hold="'+key+':'+index+
      '" aria-haspopup="true" aria-expanded="false" aria-controls="'+popupId+'">소장정보 ⌄</button>' +
      '<div class="live-holding-popover hidden" id="'+popupId+'" role="region" aria-label="소장정보">' +
      '<div class="live-holding-content">'+rows+'</div>' +
      '<div class="live-holding-footer">'+footer+'</div></div></div>';
  }

  function countOf(v) {
    return Math.max(0, Number(String(v === undefined ? 0 : v).replace(/,/g,'')) || 0);
  }
  function sectionByKey(key) {
    return SECTIONS.filter(function (s) { return s.key === key; })[0] || null;
  }

  function parseResponse(response, key) {
    if (!response || response.success !== true || typeof response.html !== 'string') {
      throw new Error('검색 서버가 올바른 응답을 반환하지 않았습니다.');
    }
    var doc = new DOMParser().parseFromString(response.html, 'text/html');
    var section = sectionByKey(key);
    if (!section) throw new Error('알 수 없는 자료 유형입니다.');
    // DOMParser creates a separate, inert document. Never insert API HTML into the site.
    var resultNodes = Array.from(doc.querySelectorAll('.serp-item'));
    if (!resultNodes.length) {
      resultNodes = Array.from(doc.querySelectorAll('.search-item, .result-item'));
    }
    var items = resultNodes.map(function (node) {
      var title = node.querySelector('h4.title a, h4.title, h3.title a, .sr-status .title a, .sr-status .title');
      var infos = Array.from(node.querySelectorAll('.pubinfo')).map(textOf).filter(Boolean);
      var thumb = node.querySelector('.th-group img, .image img');
      var misc = node.querySelector('.misc');
      var labelNode = misc && misc.querySelector('[class*="type-"]');
      var label = textOf(labelNode) || section.type;
      var statusNode = misc && misc.querySelector('.status-available, .status-unavailable, .status-out');
      var statusText = textOf(statusNode) || textOf(misc);
      var availability = statusText.includes('이용불가') || statusText.includes('대출중') ? '이용불가' :
        (statusText.includes('이용가능') ? '이용가능' : '상태 미확인');
      var holdings = Array.from(node.querySelectorAll('.status-item h5')).map(textOf).filter(Boolean);
      var extraNode = node.querySelector('.abstract, .description, .summary, .desc-text, .content-summary, .item-description');
      var yearMatch = infos.join(' ').match(/(?:19|20)\d{2}/);
      return {
        type:label,
        title:textOf(title),
        author:infos[0] || '',
        publication:infos[1] || '',
        extra:infos.slice(2).join(' · '),
        description:textOf(extraNode),
        year:yearMatch ? Number(yearMatch[0]) : null,
        availability:availability,
        holdings:holdings,
        cover:allowUrl(thumb && thumb.getAttribute('src')),
        originalLink:allowUrl(title && title.getAttribute('href'))
      };
    }).filter(function (entry) { return Boolean(entry.title); });
    var count = countOf(response.hitcount);
    if (count && !items.length) {
      throw new Error('검색 결과의 HTML 형식을 해석할 수 없습니다.');
    }
    return {
      key:key,
      hitcount:count,
      items:items,
      page:Math.max(1,Number(response.pg)||1),
      totalPages:Math.max(1,Number(response.totpage)||1),
      fallback:false
    };
  }

  function requestSection(key, query, page) {
    var cb = 'jQuery' + (Date.now() + (++requestId)) + '_' + Math.floor(Math.random() * 1000000000);
    var url = new URL(API_ENDPOINT, API_ORIGIN);
    url.searchParams.set('section', key);
    url.searchParams.set('site_id', '1');
    url.searchParams.set('q', query);
    url.searchParams.set('pg', String(page));
    url.searchParams.set('callback', cb);
    url.searchParams.set('_', String(Date.now()));
    var script = document.createElement('script'), timer, done = false, rejectJob;
    var promise = new Promise(function(resolve,reject) {
      rejectJob = reject;
      window[cb] = function (response) { finish(null,response,resolve,reject); };
      script.async = true;
      script.src = url.href;
      script.onerror = function () { finish(new Error('검색 서버 연결 실패'),null,resolve,reject); };
      timer = setTimeout(function () {
        finish(new Error('검색 요청이 10초를 초과했습니다.'),null,resolve,reject);
      }, TIMEOUT_MS);
      document.head.appendChild(script);
    });
    var job = {cancel: function() {
      finish(new Error('요청 취소'),null,null,rejectJob);
    }};
    jobs[key] = job;
    function finish(error,response,resolve,reject) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      script.onerror = null;
      if (script.parentNode) script.parentNode.removeChild(script);
      try { delete window[cb]; } catch (_) { window[cb] = undefined; }
      if (jobs[key] === job) delete jobs[key];
      if (error) reject(error);
      else resolve(response);
    }
    return promise;
  }

  function fallbackFor(key, query, page) {
    var data = window.HongikCatalogFallback;
    if (page !== 1 || !data || query !== data.query) return null;
    var source = data.sections && data.sections[key];
    if (!source && key === 'book' && Array.isArray(data.items)) source = data;
    if (!source || !Array.isArray(source.items)) return null;
    return {
      key:key, hitcount:source.hitcount, items:source.items,
      page:1, totalPages:1, fallback:true
    };
  }

  function sectionShell(section) {
    var id=section.key;
    return '<section class="resultcard live-resultcard live-section" data-live-section="' + id +
      '" id="live-section-' + id + '" ' + (section.optional ? 'hidden' : '') + '>' +
      '<div class="cardhead"><h2>' + esc(section.label) + '</h2><span data-part="count">조회 중...</span>' +
      '<button type="button" data-live-all="' + id + '">전체보기</button></div>' +
      '<div class="live-status" data-part="status" role="status" aria-live="polite">검색 중...</div>' +
      '<div data-part="items"></div><div class="live-pager" data-part="pager"></div></section>';
  }

  function shell(query,view) {
    var isCatalog = view === 'catalog';
    var single = view.indexOf('section-') === 0 ? sectionByKey(view.slice(8)) : null;
    var headline = single ? single.label + ' 검색 결과' : (isCatalog ? '자료 검색' : '통합검색 결과');
    return '<div class="wrap live-search-page">' +
      '<div class="resulthead"><h1>' + esc(headline) + '</h1>' +
      (single || isCatalog ? '<button class="switch" data-live-back="1" type="button">통합검색 결과로 돌아가기 ❯</button>' :
        '<button class="switch" data-live-switch="catalog" type="button">통합화면으로 전환 ❯</button>') +
      '</div><div class="querybar">키워드 <b>‘' + esc(query) + '’</b>(으)로 검색한 결과</div>' +
      (isCatalog ? '<div class="live-filterbar"><label><input type="checkbox" id="liveAvailable"> 이용가능만</label>' +
      '<label>정렬 <select id="liveSort"><option value="relevance">관련도순</option>' +
      '<option value="new">최신순</option><option value="old">오래된순</option></select></label>' +
      '<small>현재 페이지의 소장자료에 적용되는 필터입니다.</small></div>' : '') +
      '<div class="live-results">' +
      (single ? sectionShell(single) : isCatalog ? sectionShell(sectionByKey('book')) : SECTIONS.map(sectionShell).join('')) +
      '</div>' +
      '<section class="live-help"><h2>찾는 자료가 없으신가요?</h2><div class="live-help-grid">' +
      '<div class="live-help-card"><h3>더 찾아보기</h3><div class="live-help-search">' +
      '<span class="live-google-label" aria-hidden="true">Google</span>' +
      '<input aria-label="추가 검색어" id="liveSecondQuery" placeholder="검색어를 입력하세요.">' +
      '<button type="button" data-live-search-again="1" aria-label="추가 검색">⌕</button></div></div>' +
      '<div class="live-help-card"><h3>자료 신청하기</h3><div class="live-request-options">' +
      ['자료구입신청','타도서관 자료대출 신청','타도서관 자료복사 신청'].map(function(n,i) {
        return '<button type="button" data-info="' + esc(n) + '"><span aria-hidden="true">' +
          ['▤','▧','▣'][i] + '</span>' + esc(n) + '</button>';
      }).join('') + '</div></div></div></section></div>';
  }

  function sectionNode(key) {
    return root && root.querySelector('#live-section-' + key);
  }
  function part(section,partName) {
    return section && section.querySelector('[data-part="' + partName + '"]');
  }
  function renderItem(book,key,index) {
    var hasCover = (key === 'book' || key === 'ebook');
    var image = book.cover ?
      '<img loading="lazy" src="' + esc(book.cover) + '" alt="" onerror="this.hidden=true">' :
      '<span class="live-cover-emblem">HONGIK<br>UNIVERSITY<br>LIBRARY</span>';
    var coverHtml = hasCover ? '<div class="cover live-cover" aria-hidden="true">' + image + '</div>' : '';
    var type = book.type || sectionByKey(key).type;
    var avail=book.availability||'상태 미확인';
    var holdings = Array.isArray(book.holdings) && book.holdings.length ?
      holdingsPopup(book,key,index) : '';
    return '<article data-ux-section="' + esc(key) + '" data-ux-index="' + index + '" class="book live-book' + (hasCover ? ' has-cover' : ' no-cover') + '">' +
      coverHtml + '<div class="live-book-body"><span class="tag">' + esc(type) + '</span> ' +
      '<span class="tag ' + (avail==='이용가능'?'available':'unavailable') + '">' + esc(avail) + '</span>' +
      '<h3>' + (primoDetailUrl(book) ?
        '<a class="live-title-link" href="' + esc(primoDetailUrl(book)) +
        '" target="_blank" rel="noopener noreferrer">' + esc(book.title) + '</a>' :
        '<span class="live-title-text">' + esc(book.title) + '</span>') + '</h3>' +
      (book.author || book.publication ? '<p>' + (book.author?esc(book.author):'') +
        (book.publication?'<br>'+esc(book.publication):'') + '</p>' : '') +
      (book.extra?'<p>'+esc(book.extra)+'</p>':'') +
      (book.description?'<p class="live-description">'+esc(book.description)+'</p>':'') +
      holdings + '</div></article>';
  }

  function visibleRows(key) {
    var sectionData = state && state.sections[key];
    var items = sectionData && sectionData.data ? sectionData.data.items.slice() : [];
    if (state.view === 'catalog' && key === 'book') {
      if (state.availableOnly) items=items.filter(function(b){return b.availability==='이용가능';});
      if (state.sort === 'new') items.sort(function(a,b){return (b.year||0)-(a.year||0);});
      if (state.sort === 'old') items.sort(function(a,b){return (a.year||9999)-(b.year||9999);});
    }
    return items;
  }
  function paintSection(key) {
    var section = sectionNode(key);
    var entry = state && state.sections[key];
    if (!section || !entry || !entry.data) return;
    var data = entry.data, rows=visibleRows(key), meta=sectionByKey(key);
    // Recommended databases are not shown when there are no actual results.
    if (meta.optional && data.hitcount===0) {section.hidden=true;return;}
    section.hidden=false;
    entry.visible=rows;
    part(section,'count').textContent=countOf(data.hitcount).toLocaleString('ko-KR')+' 건';
    part(section,'status').textContent=data.fallback ?
      '실시간 조회 실패 · 저장된 검색 결과 (' + (window.HongikCatalogFallback.capturedAt||'') +
      ' 기준, 첫 페이지 ' + rows.length + '건)' : '';
    part(section,'items').innerHTML=rows.length ?
      rows.map(function(book,i){return renderItem(book,key,i);}).join('') :
      '<div class="empty">' + (data.hitcount ? '현재 조건에 맞는 결과가 없습니다.' : '결과가 없습니다.') + '</div>';
    // A captured first-page snapshot does not justify synthesizing further pages.
    // A snapshot includes only its captured rows; further pages are requested live, never fabricated.
    var lastPage = data.fallback ? Math.max(1, Math.ceil(data.hitcount / 5)) : data.totalPages;
    part(section,'pager').innerHTML =
      '<button type="button" data-live-page="' + key + ':' + (data.page-1) +
      '" ' + (data.page<=1?'disabled':'') + '>← 이전 페이지</button>' +
      '<button type="button" data-live-page="' + key + ':' + (data.page+1) +
      '" ' + (data.page>=lastPage?'disabled':'') + '>다음 페이지 →</button>';
  }

  function failSection(key,error) {
    var section=sectionNode(key), entry=state && state.sections[key];
    if (!section || !entry) return;
    var fallback=fallbackFor(key,state.query,entry.page);
    if (fallback) {entry.data=fallback; paintSection(key);return;}
    if (sectionByKey(key).optional) {section.hidden=true;return;}
    section.hidden=false;
    part(section,'count').textContent='조회 실패';
    part(section,'status').innerHTML='<span>검색 서버 요청 실패: ' + esc(error.message) + '</span> ' +
      '<button type="button" class="live-retry" data-live-retry="' + key + '">다시 시도</button>';
    part(section,'items').innerHTML='';
    part(section,'pager').innerHTML='';
  }

  function loadSection(key,page) {
    if (!root || !state) return;
    var section=sectionNode(key);
    if (!section) return;
    if (jobs[key]) jobs[key].cancel();
    var context=state, entry=state.sections[key];
    entry.page=Math.max(1,Math.floor(Number(page)||1));
    entry.data=null;entry.visible=[];
    entry.sequence=(entry.sequence||0)+1;
    var generation=revision, sequence=entry.sequence;
    part(section,'count').textContent='조회 중...';
    part(section,'status').textContent='검색 중...';
    part(section,'items').innerHTML='';
    part(section,'pager').innerHTML='';
    requestSection(key,context.query,entry.page).then(function(response){
      if (generation!==revision || context!==state || sequence!==entry.sequence) return;
      try { entry.data=parseResponse(response,key);paintSection(key); }
      catch(e){failSection(key,e);}
    }).catch(function(e){
      if (generation!==revision || context!==state || sequence!==entry.sequence) return;
      failSection(key,e);
    });
  }

  function openDetail(key,index) {
    var entry=state && state.sections[key];
    var b=entry && entry.visible[index];
    if (!b || typeof window.show!=='function') return;
    var details='<p>자료유형　'+esc(b.type||sectionByKey(key).type)+'</p>' +
      '<p>저자　'+esc(b.author)+'</p><p>발행사항　'+esc(b.publication)+'</p>' +
      (b.description?'<p>'+esc(b.description)+'</p>':'') +
      (b.holdings && b.holdings.length ? '<h3>소장정보</h3>' +
        b.holdings.map(function(h){return '<p>'+esc(h)+'</p>';}).join('') : '') +
      (primoDetailUrl(b)?'<p><a href="'+esc(primoDetailUrl(b))+
        '" target="_blank" rel="noopener noreferrer">Primo에서 자세히 보기</a></p>':'');
    window.show(b.title,details);
  }
  function closeHoldings(keepButton) {
    if (!root) return;
    root.querySelectorAll('.live-holding-anchor [data-live-hold]').forEach(function(btn) {
      if (btn === keepButton) return;
      var id = btn.getAttribute('aria-controls');
      var popup = document.getElementById(id);
      if (popup) popup.classList.add('hidden');
      btn.setAttribute('aria-expanded','false');
    });
  }
  function outsideHoldings(event) {
    if (!root || !root.contains(event.target)) closeHoldings();
  }
  function escapeHoldings(event) {
    if (event.key === 'Escape' && root) closeHoldings();
  }
  var holdingGlobalEventsBound = false;
  function onClick(event) {
    if (!root || !state) return;
    var holdingButton=event.target.closest('button[data-live-hold]');
    if (!holdingButton) closeHoldings();
    var button=event.target.closest('button');
    if (!button || !root.contains(button)) return;
    if (button.hasAttribute('data-live-switch')) {
      window.search(state.query, 'catalog');
    } else if (button.hasAttribute('data-live-back')) {
      window.search(state.query,'results');
    } else if (button.hasAttribute('data-live-all')) {
      var selected=button.getAttribute('data-live-all');
      window.search(state.query,selected==='book'?'catalog':'section-'+selected);
    } else if (button.hasAttribute('data-live-retry')) {
      var retry=button.getAttribute('data-live-retry');
      loadSection(retry,state.sections[retry].page);
    } else if (button.hasAttribute('data-live-page')) {
      var value=button.getAttribute('data-live-page').split(':');
      var key=value[0], next=Number(value[1]), entry=state.sections[key];
      var finalPage=entry && entry.data ? (entry.data.fallback ? Math.max(1,Math.ceil(entry.data.hitcount/5)) : entry.data.totalPages) : 0;
      if (entry && entry.data && next>=1 && next<=finalPage) {
        loadSection(key,next);
        sectionNode(key).scrollIntoView({block:'start',behavior:'smooth'});
      }
    } else if (button.hasAttribute('data-live-hold')) {
      var p=button.getAttribute('data-live-hold').split(':');
      var box=root.querySelector('#live-holding-'+p[0]+'-'+p[1]);
      if (!box) return;
      var willOpen=box.classList.contains('hidden');
      closeHoldings(button);
      box.classList.toggle('hidden',!willOpen);
      button.setAttribute('aria-expanded',String(willOpen));
    } else if (button.hasAttribute('data-live-popup-detail')) {
      var parts=button.getAttribute('data-live-popup-detail').split(':');
      openDetail(parts[0],Number(parts[1]));
    } else if (button.hasAttribute('data-live-search-again')) {
      var newQuery=root.querySelector('#liveSecondQuery').value.trim();
      if (newQuery) window.search(newQuery,'results');
    }
  }
  function onKeydown(e) {
    if (e.target && e.target.id === 'liveSecondQuery' && e.key === 'Enter') {
      e.preventDefault();
      var newQuery = e.target.value.trim();
      if (newQuery) window.search(newQuery,'results');
    }
  }
  function onChange(e) {
    if (!state || !state.sections.book || !state.sections.book.data) return;
    if (e.target.id==='liveAvailable') {
      state.availableOnly=e.target.checked;paintSection('book');
    } else if (e.target.id==='liveSort') {
      state.sort=e.target.value;paintSection('book');
    }
  }
  function render(query,view,container) {
    cancel();
    root=container;
    state={
      query:String(query||'').trim(),
      view:view==='catalog'?'catalog':
        (String(view).indexOf('section-')===0 && sectionByKey(String(view).slice(8)) ? String(view) : 'results'),
      sections:Object.create(null),availableOnly:false,sort:'relevance'
    };
    SECTIONS.forEach(function(section) {
      state.sections[section.key]={page:1,data:null,visible:[],sequence:0};
    });
    if (listenerRoot!==root) {
      root.addEventListener('click',onClick);
      root.addEventListener('change',onChange);
      root.addEventListener('keydown',onKeydown);
      listenerRoot=root;
    }
    if (!holdingGlobalEventsBound) {
      document.addEventListener('click',outsideHoldings);
      document.addEventListener('keydown',escapeHoldings);
      holdingGlobalEventsBound=true;
    }
    root.innerHTML=shell(state.query,state.view);
    var focused=state.view.indexOf('section-')===0 ? sectionByKey(state.view.slice(8)) : null;
    var selected=focused?[focused]:state.view==='catalog'?
      SECTIONS.filter(function(s){return s.key==='book';}):SECTIONS;
    selected.forEach(function(section){loadSection(section.key,1);});
  }
  function cancel() {
    revision++;
    Object.keys(jobs).forEach(function(key){jobs[key].cancel();});
    jobs=Object.create(null);
    root=null;state=null;
  }

  window.HongikLiveSearch={
    render:render,
    cancel:cancel,
    parseBookResponse:function(response){return parseResponse(response,'book');},
    parseSectionResponse:parseResponse,
    primoDetailUrl:primoDetailUrl,
    // The bookmark UI uses the exact parsed catalog row displayed in the card.
    bookmarkRecord:function(key,index) {
      var entry=state && state.sections[key];
      var b=entry && entry.visible[Number(index)];
      if (!b) return null;
      var holdings=Array.isArray(b.holdings) ? b.holdings : [];
      var mainHolding=holdings[0] || '';
      var library=(mainHolding.match(/중앙도서관|문정도서관|법학도서관|대학로도서관/) || [])[0] || '';
      return {
        title:b.title||'', author:b.author||'',
        materialType:b.type||sectionByKey(key).type||'',
        publication:b.publication||'', availability:b.availability||'',
        library:library, location:'', callNumber:'',
        holdingsText:holdings.join('\n'),
        detailUrl:primoDetailUrl(b)
      };
    },
    categories:SECTIONS.map(function(s){return s.key;})
  };
}());