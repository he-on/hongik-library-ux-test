/* Hongik library public catalog search (JSONP). No hard-coded search terms. */
(function () {
  'use strict';

  var API_HOST = 'https://honors.hongik.ac.kr';
  var API_PATH = '/n2prema/public/searchapi/';
  var TIMEOUT_MS = 10000;
  var requestSequence = 0;
  var activeRequest = null;
  var root = null;
  var listenersBound = false;
  var state = null;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }

  function plainText(element) {
    return element ? (element.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  function originalSiteUrl(path) {
    if (!path) return '';
    try {
      var url = new URL(path, API_HOST);
      if (url.protocol !== 'https:' || url.hostname !== 'honors.hongik.ac.kr') return '';
      return url.href;
    } catch (_) {
      return '';
    }
  }

  function parseBookResponse(response) {
    if (!response || response.success !== true || typeof response.html !== 'string') {
      throw new Error('검색 응답 형식이 올바르지 않습니다.');
    }

    // The API returns an HTML fragment inside a JSONP object.
    // Parse as inert DOM and read text only; never execute or inject its markup.
    var doc = new DOMParser().parseFromString(response.html, 'text/html');
    var items = Array.from(doc.querySelectorAll('.serp-item')).map(function (item) {
      var titleNode = item.querySelector('h4.title a');
      var pubinfo = Array.from(item.querySelectorAll('.pubinfo'));
      var picture = item.querySelector('.th-group img');
      var availability = plainText(item.querySelector('.misc'));
      var holdings = Array.from(item.querySelectorAll('.status-item h5')).map(plainText).filter(Boolean);
      var publication = plainText(pubinfo[1]);
      var yearMatch = publication.match(/(?:19|20)\d{2}/);
      return {
        title: plainText(titleNode),
        author: plainText(pubinfo[0]),
        publication: publication,
        year: yearMatch ? Number(yearMatch[0]) : null,
        availability: availability.includes('이용불가') ? '이용불가' :
          (availability.includes('이용가능') ? '이용가능' : '상태 미확인'),
        holdings: holdings,
        cover: originalSiteUrl(picture && picture.getAttribute('src')),
        originalLink: originalSiteUrl(titleNode && titleNode.getAttribute('href'))
      };
    }).filter(function (b) { return !!b.title; });

    return {
      items: items,
      hitcount: Math.max(0, Number(response.hitcount) || 0),
      page: Math.max(1, Number(response.pg) || 1),
      totalPages: Math.max(1, Number(response.totpage) || 1)
    };
  }

  function requestBooks(query, page) {
    var resolvePromise, rejectPromise;
    var promise = new Promise(function (resolve, reject) {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    var callbackName = 'jQuery' + Math.floor(Math.random() * 1e12) + '_' + Date.now();
    var url = new URL(API_PATH, API_HOST);
    url.searchParams.set('section', 'book');
    url.searchParams.set('site_id', '1');
    url.searchParams.set('q', query);
    url.searchParams.set('pg', String(page));
    url.searchParams.set('callback', callbackName);
    url.searchParams.set('_', String(Date.now()));
    var script = document.createElement('script');
    var timer = null;
    var completed = false;
    var job = {
      cancel: function () { finish(new Error('검색 요청이 취소되었습니다.')); }
    };

    function finish(error, response) {
      if (completed) return;
      completed = true;
      clearTimeout(timer);
      script.onerror = null;
      if (script.parentNode) script.parentNode.removeChild(script);
      try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
      if (activeRequest === job) activeRequest = null;
      if (error) rejectPromise(error);
      else resolvePromise(response);
    }

    window[callbackName] = function (response) { finish(null, response); };
    script.async = true;
    script.src = url.href;
    script.onerror = function () { finish(new Error('검색 서버에 연결하지 못했습니다.')); };
    activeRequest = job;
    timer = setTimeout(function () {
      finish(new Error('검색 제한시간(10초)을 초과했습니다.'));
    }, TIMEOUT_MS);
    document.head.appendChild(script);
    return promise;
  }

  function shell(query, view) {
    var isCatalog = view === 'catalog';
    return '<div class="wrap live-search-page">' +
      '<div class="resulthead"><h1>' + (isCatalog ? '자료 검색' : '통합검색 결과') + '</h1>' +
      (!isCatalog ? '<button id="liveSwitch" class="switch" type="button">통합화면으로 전환 ❯</button>' : '') +
      '</div>' +
      '<div class="querybar">키워드 <b>‘' + escapeHtml(query) + '’</b>(으)로 검색한 결과</div>' +
      (isCatalog ?
        '<div class="live-filterbar"><label><input type="checkbox" id="liveAvailable"> 이용가능만</label>' +
        '<label>정렬 <select id="liveSort" aria-label="현재 페이지 결과 정렬">' +
        '<option value="relevance">관련도순</option><option value="new">최신순</option><option value="old">오래된순</option>' +
        '</select></label><small>필터와 정렬은 현재 페이지의 자료에 적용됩니다.</small></div>' : '') +
      '<section class="resultcard live-resultcard" aria-label="소장자료 검색 결과">' +
      '<div class="cardhead"><h2>소장자료</h2><span id="liveCount">조회 중...</span>' +
      (!isCatalog ? '<button id="liveShowAll" type="button">전체보기</button>' : '') + '</div>' +
      '<div id="liveStatus" class="live-status" role="status" aria-live="polite">도서관 자료 검색 중...</div>' +
      '<div id="liveBooks"></div><div id="livePager" class="live-pager"></div>' +
      '</section><p class="live-scope-note">소장자료는 홍익대학교 중앙도서관의 공개 검색 API에서 조회합니다. 다른 검색 영역은 현재 재현 범위에 포함되지 않습니다.</p>' +
      '</div>';
  }

  function bookMarkup(book, index) {
    var cover = book.cover ?
      '<img loading="lazy" src="' + escapeHtml(book.cover) + '" alt="" onerror="this.hidden=true">' :
      '<span>HONGIK<br>LIBRARY</span>';
    var isAvailable = book.availability === '이용가능';
    var holdingMarkup = book.holdings.length ?
      book.holdings.map(function (h) { return '<p>' + escapeHtml(h) + '</p>'; }).join('') :
      '<p>표시된 소장 위치가 없습니다.</p>';
    return '<article class="book live-book">' +
      '<div class="cover live-cover" aria-hidden="true">' + cover + '</div>' +
      '<div class="live-book-body"><span class="tag">도서</span> ' +
      '<span class="tag ' + (isAvailable ? 'available' : 'unavailable') + '">' + escapeHtml(book.availability) + '</span>' +
      '<h3><button type="button" data-live-detail="' + index + '">' + escapeHtml(book.title) + '</button></h3>' +
      '<p>' + escapeHtml(book.author) + (book.publication ? '<br>' + escapeHtml(book.publication) : '') + '</p>' +
      '<button type="button" class="holdings" data-live-hold="' + index + '" aria-expanded="false" aria-controls="live-holding-' + index + '">소장정보 ⌄</button>' +
      '<div class="holding hidden" id="live-holding-' + index + '">' + holdingMarkup + '</div></div></article>';
  }

  function filteredItems() {
    var rows = state.data ? state.data.items.slice() : [];
    if (state.availableOnly) rows = rows.filter(function (b) { return b.availability === '이용가능'; });
    if (state.sort === 'new') rows.sort(function (a, b) { return (b.year || 0) - (a.year || 0); });
    if (state.sort === 'old') rows.sort(function (a, b) { return (a.year || 9999) - (b.year || 9999); });
    return rows;
  }

  function paint() {
    if (!root || !state || !state.data) return;
    var data = state.data;
    var rows = filteredItems();
    state.visibleRows = rows;
    root.querySelector('#liveCount').textContent = data.hitcount.toLocaleString('ko-KR') + ' 건';
    root.querySelector('#liveStatus').textContent = data.hitcount ?
      '전체 ' + data.hitcount.toLocaleString('ko-KR') + '건 중 ' +
      ((data.page - 1) * 5 + 1) + '–' + ((data.page - 1) * 5 + data.items.length) +
      '건 (현재 ' + data.page + '/' + data.totalPages + '페이지)' :
      '검색 결과가 없습니다.';
    root.querySelector('#liveBooks').innerHTML = rows.length ?
      rows.map(bookMarkup).join('') :
      '<div class="empty">' + (data.hitcount ? '현재 페이지에서 조건에 맞는 자료가 없습니다.' : '검색 결과가 없습니다.') + '</div>';
    root.querySelector('#livePager').innerHTML = data.totalPages > 1 ?
      '<button type="button" data-live-page="' + (data.page - 1) + '" ' + (data.page === 1 ? 'disabled' : '') + '>‹ 이전 페이지</button>' +
      '<span>' + data.page + ' / ' + data.totalPages + '</span>' +
      '<button type="button" data-live-page="' + (data.page + 1) + '" ' + (data.page >= data.totalPages ? 'disabled' : '') + '>다음 페이지 ›</button>' : '';
  }

  function fail(error) {
    if (!root) return;
    root.querySelector('#liveCount').textContent = '조회 실패';
    root.querySelector('#liveStatus').innerHTML =
      '<span>공개 검색 API 요청에 실패했습니다. (' + escapeHtml(error.message) + ')</span> ' +
      '<button type="button" class="live-retry" id="liveRetry">다시 시도</button>';
    root.querySelector('#liveBooks').innerHTML = '';
    root.querySelector('#livePager').innerHTML = '';
  }

  function load(page, updateUrl) {
    if (!root || !state) return;
    requestSequence++;
    var sequence = requestSequence;
    if (activeRequest) { activeRequest.cancel(); activeRequest = null; }
    page = Math.max(1, Math.floor(Number(page) || 1));
    state.page = page;
    state.data = null;
    state.visibleRows = [];
    root.querySelector('#liveCount').textContent = '조회 중...';
    root.querySelector('#liveStatus').textContent = '도서관 자료 검색 중...';
    root.querySelector('#liveBooks').innerHTML = '';
    root.querySelector('#livePager').innerHTML = '';
    if (updateUrl) {
      var currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('pg', String(page));
      window.history.pushState({}, '', currentUrl.pathname + currentUrl.search);
    }
    requestBooks(state.query, page).then(function (response) {
      if (sequence !== requestSequence || !root) return;
      state.data = parseBookResponse(response);
      state.page = state.data.page;
      paint();
    }).catch(function (error) {
      if (sequence !== requestSequence) return;
      fail(error);
    });
  }

  function click(event) {
    var button = event.target.closest('button');
    if (!button || !root.contains(button)) return;
    if (button.id === 'liveSwitch' || button.id === 'liveShowAll') {
      window.search(state.query, 'catalog');
    } else if (button.id === 'liveRetry') {
      load(state.page, false);
    } else if (button.hasAttribute('data-live-page')) {
      var next = Number(button.getAttribute('data-live-page'));
      if (state.data && next >= 1 && next <= state.data.totalPages) {
        load(next, true);
        root.querySelector('.live-resultcard').scrollIntoView({block:'start'});
      }
    } else if (button.hasAttribute('data-live-hold')) {
      var i = Number(button.getAttribute('data-live-hold'));
      var content = root.querySelector('#live-holding-' + i);
      if (!content) return;
      content.classList.toggle('hidden');
      button.setAttribute('aria-expanded', String(!content.classList.contains('hidden')));
    } else if (button.hasAttribute('data-live-detail')) {
      var index = Number(button.getAttribute('data-live-detail'));
      var book = state.visibleRows[index];
      if (!book || typeof window.show !== 'function') return;
      var details = '<p>저자　' + escapeHtml(book.author) + '</p>' +
        '<p>발행사항　' + escapeHtml(book.publication) + '</p>' +
        '<h3>소장정보</h3>' +
        (book.holdings.length ? book.holdings.map(function (h) {
          return '<p>' + escapeHtml(h) + '</p>';
        }).join('') : '<p>표시된 소장 위치가 없습니다.</p>') +
        (book.originalLink ? '<p><a href="' + escapeHtml(book.originalLink) +
          '" target="_blank" rel="noopener noreferrer">도서관 원문 상세보기 ↗</a></p>' : '');
      window.show(book.title, details);
    }
  }

  function change(event) {
    if (!state || !state.data) return;
    if (event.target.id === 'liveAvailable') {
      state.availableOnly = event.target.checked;
      paint();
    } else if (event.target.id === 'liveSort') {
      state.sort = event.target.value;
      paint();
    }
  }

  function render(query, view, container) {
    root = container;
    state = {
      query: String(query || '').trim(),
      view: view === 'catalog' ? 'catalog' : 'results',
      page: 1, data: null, visibleRows: [], availableOnly: false, sort:'relevance'
    };
    if (!listenersBound) {
      root.addEventListener('click', click);
      root.addEventListener('change', change);
      listenersBound = true;
    }
    root.innerHTML = shell(state.query, state.view);
    var p = Number(new URLSearchParams(window.location.search).get('pg') || 1);
    load(p, false);
  }

  window.HongikLiveSearch = {render: render, parseBookResponse: parseBookResponse};
}());
