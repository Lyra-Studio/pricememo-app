const SK = 'kaimono_v6';  // バージョンを上げてキャッシュをリセット
let items = [];
let _modalId  = null;   // 現在開いているモーダルのID
let _editId   = null;   // 編集中のアイテムID（nullなら新規登録）

// ── 初期ロード ──
function load() {
  try { const r = localStorage.getItem(SK); if (r) { items = JSON.parse(r); return; } } catch(e){}
  items = SAMPLE_DATA.map((d, i) => ({ ...d, id: 's'+i, _ts: i }));
  persist();
}
function persist() { localStorage.setItem(SK, JSON.stringify(items)); }
load();

// ============================================================
// ユーティリティ
// ============================================================
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function calcUP(price, amount, unit) {
  if (!amount || amount <= 0 || !unit) return null;
  // g・ml・個・本・枚・袋など、amountが数値であれば単価を計算する
  return price / amount;
}
// 単価の表示ラベル用（"円/g"、"円/個" など）
function upLabel(unit) { return '円/' + (unit || '単位'); }
// 単価の数値フォーマット：g/mlは小数2桁、個/本など整数単位は整数表示
function fmtUP(up, unit) {
  if (up == null) return null;
  const u = String(unit||'').trim().toLowerCase();
  const isWeight = (u === 'g' || u === 'ml');
  return isWeight ? up.toFixed(2) : Number.isInteger(up) ? String(up) : up.toFixed(1);
}
function fmtYen(n)   { return '¥' + Math.round(n).toLocaleString(); }
function fmtN(n,d=2) { return n != null ? n.toFixed(d) : null; }
function match(item, q) {
  if (!q) return true;
  const t = q.toLowerCase();
  return ['productName','store','mainCategory','subCategory','memo'].some(k =>
    (item[k]||'').toLowerCase().includes(t)
  );
}
function hl(text, q) {
  const e = esc(text);
  if (!q) return e;
  const eq = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return e.replace(new RegExp(esc(eq), 'gi'), m => `<span class="hl">${m}</span>`);
}
function uniq(arr) { return [...new Set(arr.filter(Boolean))]; }

// ── 共通ソート関数 ──
// key: 'up-asc' | 'up-desc' | 'price-asc' | 'price-desc' | 'new' | 'name'
// 単価ルール：単価あり→安い順（昇順）、なし→末尾。同単価→価格→商品名
function sortItems(data, key) {
  return [...data].sort((a, b) => {
    if (key === 'up-asc' || key === 'up-desc') {
      const ua = calcUP(a.price, a.amount, a.unit);
      const ub = calcUP(b.price, b.amount, b.unit);
      // 単価なしは常に末尾
      if (ua == null && ub == null) return tieBreak(a, b);
      if (ua == null) return  1;
      if (ub == null) return -1;
      const dir = key === 'up-asc' ? 1 : -1;
      if (ua !== ub) return dir * (ua - ub);
      return tieBreak(a, b);
    }
    if (key === 'price-asc')  return (a.price||0) - (b.price||0) || tieBreak(a, b);
    if (key === 'price-desc') return (b.price||0) - (a.price||0) || tieBreak(a, b);
    if (key === 'name')       return (a.productName||'').localeCompare(b.productName||'');
    // 'new'（デフォルト）
    return (b._ts||0) - (a._ts||0);
  });
}
function tieBreak(a, b) {
  const pd = (a.price||0) - (b.price||0);
  if (pd !== 0) return pd;
  return (a.productName||'').localeCompare(b.productName||'');
}

// ホーム検索のソート状態（'up-asc' | 'up-desc' | 'price-asc' | 'new'）
let homeSort = 'up-asc';
function setDL(id, vals) {
  document.getElementById(id).innerHTML = vals.map(v => `<option value="${esc(v)}">`).join('');
}
function fillSel(id, vals, ph) {
  const el = document.getElementById(id);
  const cur = el.value;
  el.innerHTML = `<option value="">${ph}</option>` +
    vals.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if ([...el.options].some(o => o.value === cur)) el.value = cur;
}

// ============================================================
// ドロップダウン更新（全共通）
// ============================================================
function refreshDropdowns() {
  const stores = uniq(items.map(i => i.store)).sort((a,b) => a.localeCompare(b, 'ja'));
  const mains  = uniq(items.map(i => i.mainCategory)).sort();
  const subs   = uniq(items.map(i => i.subCategory)).sort();

  setDL('dl-store', stores);
  setDL('dl-main',  mains);
  setDL('dl-sub',   subs);

  fillSel('list-main', mains,  'すべての大カテゴリ');
  fillSel('list-sub',  subs,   'すべての比較カテゴリ');
  fillSel('cmp-main',  mains,  'すべて');
  fillSel('cmp-sub',   subs,   'カテゴリを選択してください');
  fillSel('home-sub',  subs,   'すべての比較カテゴリ');
  fillSel('store-sel', stores, '店名を選択してください');

  // ホームチップ
  const ch = document.getElementById('home-chips');
  ch.innerHTML = ['すべて', ...mains].map(m =>
    `<button class="chip${m==='すべて'?' active':''}" onclick="chipClick('${esc(m)}',this)">${esc(m)}</button>`
  ).join('');

  // 件数ヒント
  document.getElementById('home-hint').innerHTML = `登録件数：<b>${items.length}</b>件`;
}

// ============================================================
// ナビゲーション
// ============================================================
function goPage(page, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  btn.classList.add('active');
  if (page === 'home')    renderHome();
  if (page === 'list')    renderList();
  if (page === 'compare') renderCompare();
  if (page === 'store')   renderStore();
}

// navボタンを経由せず直接ページへ（登録ページなど）
function goPageFromFilter(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// HOME
// ============================================================
function chipClick(cat, el) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('home-q').value = cat === 'すべて' ? '' : cat;
  document.getElementById('home-sub').value = '';
  homeSearch();
}

function homeSearch() {
  const q   = document.getElementById('home-q').value.trim();
  const sub = document.getElementById('home-sub').value;
  const ra  = document.getElementById('home-result-area');
  const hw  = document.querySelector('.home-wrap');

  if (!q && !sub) {
    ra.style.display = 'none';
    hw.style.paddingBottom = '40px';
    return;
  }
  ra.style.display = 'block';
  hw.style.paddingBottom = '8px';

  const qf = items.filter(i => match(i, q));
  const qSubs = uniq(qf.map(i => i.subCategory)).sort();
  fillSel('home-sub', qSubs, 'すべての比較カテゴリ');
  document.getElementById('home-sub').value = sub;

  let data = sub ? qf.filter(i => i.subCategory === sub) : qf;
  data = sortItems(data, homeSort);
  updateHomeUpArrow();

  document.getElementById('home-count').textContent = data.length + '件';
  document.getElementById('home-list').innerHTML = data.length
    ? data.map(i => rowHTML(i, q)).join('')
    : '<div class="empty-state"><div class="empty-icon">🔍</div>該当する商品が見つかりません</div>';
}

function homeSortChange() {
  homeSort = document.getElementById('home-sort').value;
  homeSearch();
}

function toggleHomeUpSort() {
  homeSort = homeSort === 'up-asc' ? 'up-desc' : 'up-asc';
  document.getElementById('home-sort').value = homeSort;
  homeSearch();
}

function updateHomeUpArrow() {
  const el = document.getElementById('home-up-arrow');
  if (!el) return;
  if (homeSort === 'up-asc')  { el.textContent = '↑'; el.style.color = 'var(--green)'; }
  else if (homeSort === 'up-desc') { el.textContent = '↓'; el.style.color = 'var(--orange)'; }
  else { el.textContent = ''; }
}

function resetHome() {
  document.getElementById('home-q').value = '';
  document.getElementById('home-sub').value = '';
  document.getElementById('home-sort').value = 'up-asc';
  homeSort = 'up-asc';
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.chip')?.classList.add('active');
  homeSearch();
}

function renderHome() {
  refreshDropdowns();
  homeSearch();
}

// ============================================================
// 行 HTML（共通：ホーム＆一覧で使用）
// ============================================================
function rowHTML(item, q) {
  const up = calcUP(item.price, item.amount, item.unit);
  const starred = item.starred ? 'starred' : '';
  return `<div class="list-row ${starred ? 'row-starred' : ''}" onclick="openModal('${item.id}')">
    <button class="star-btn ${starred}" onclick="event.stopPropagation();toggleStar('${item.id}')" title="お気に入り">${item.starred ? '★' : '☆'}</button>
    <span class="row-name" title="${esc(item.productName)}">${hl(item.productName, q)}</span>
    <span class="row-store">${hl(item.store, q)}</span>
    <span class="row-price">${fmtYen(item.price)}</span>
    <span class="row-amount">${item.amount ? item.amount+(item.unit||'') : '—'}</span>
    <span class="row-up">${up != null ? fmtUP(up,item.unit)+upLabel(item.unit) : '—'}</span>
    <span class="row-cat">${item.subCategory ? `<span class="tag tag-sub">${esc(item.subCategory)}</span>` : ''}</span>
  </div>`;
}

// ============================================================
// LIST
// ============================================================
function listMainChange() {
  const main = document.getElementById('list-main').value;
  const subs = uniq(items.filter(i => !main || i.mainCategory===main).map(i => i.subCategory)).sort();
  fillSel('list-sub', subs, 'すべての比較カテゴリ');
  renderList();
}

function renderList() {
  const q    = document.getElementById('list-q').value.trim();
  const main = document.getElementById('list-main').value;
  const sub  = document.getElementById('list-sub').value;
  const sort = document.getElementById('list-sort').value;

  let data = items.filter(i =>
    (!main || i.mainCategory === main) &&
    (!sub  || i.subCategory  === sub)  &&
    match(i, q)
  );
  data = sortItems(data, sort);
  updateListUpArrow(sort);

  document.getElementById('list-count').textContent = data.length + '件';
  document.getElementById('list-rows').innerHTML = data.length
    ? data.map(i => rowHTML(i, q)).join('')
    : '<div class="empty-state"><div class="empty-icon">📭</div>該当する商品がありません</div>';
}

function toggleListUpSort() {
  const sel = document.getElementById('list-sort');
  sel.value = sel.value === 'up-asc' ? 'up-desc' : 'up-asc';
  renderList();
}

function updateListUpArrow(sort) {
  const el = document.getElementById('list-up-arrow');
  if (!el) return;
  if (sort === 'up-asc')  { el.textContent = '↑'; el.style.color = 'var(--green)'; }
  else if (sort === 'up-desc') { el.textContent = '↓'; el.style.color = 'var(--orange)'; }
  else { el.textContent = ''; }
}

function resetList() {
  document.getElementById('list-q').value = '';
  document.getElementById('list-main').value = '';
  document.getElementById('list-sub').value = '';
  document.getElementById('list-sort').value = 'up-asc';
  renderList();
}

// ============================================================
// COMPARE（前回をほぼ維持）
// ============================================================
function cmpMainChange() {
  const main = document.getElementById('cmp-main').value;
  const subs = uniq(items.filter(i => !main || i.mainCategory===main).map(i => i.subCategory)).sort();
  fillSel('cmp-sub', subs, 'すべて');
  renderCompare();
}

// 比較ページのソート状態
let cmpSort = 'up-asc';

function cmpSortChange() {
  cmpSort = document.getElementById('cmp-sort').value;
  renderCompare();
}

function toggleCmpUpSort() {
  cmpSort = cmpSort === 'up-asc' ? 'up-desc' : 'up-asc';
  document.getElementById('cmp-sort').value = cmpSort;
  renderCompare();
}

function renderCompare() {
  const main   = document.getElementById('cmp-main').value;
  const selSub = document.getElementById('cmp-sub').value;
  const con    = document.getElementById('cmp-container');
  const sortRight = document.querySelector('.cmp-filter-right');

  // カテゴリ未選択なら何も表示しない
  if (!selSub) {
    sortRight.style.visibility = 'hidden';
    con.innerHTML = `<div class="cmp-prompt">
      <div class="cmp-prompt-icon">⚖️</div>
      <div class="cmp-prompt-text">比較したいカテゴリを選択してください</div>
    </div>`;
    return;
  }
  sortRight.style.visibility = 'visible';

  let pool = items.filter(i => !main || i.mainCategory===main);
  if (selSub) pool = pool.filter(i => i.subCategory===selSub);

  const grouped = {};
  pool.forEach(i => { const k = i.subCategory||'未分類'; (grouped[k]=grouped[k]||[]).push(i); });

  const keys = Object.keys(grouped);
  if (!keys.length) {
    con.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div>データがありません</div>';
    return;
  }
  con.innerHTML = keys.sort((a,b) => a.localeCompare(b)).map(k => cmpGroup(k, grouped[k])).join('');
}

function cmpGroup(sub, group) {
  const sorted = sortItems(group, cmpSort);

  const withUP = group.filter(i => calcUP(i.price,i.amount,i.unit) != null);
  const ups    = withUP.map(i => calcUP(i.price,i.amount,i.unit));
  const minP   = Math.min(...group.map(i => i.price));
  const minU   = ups.length ? Math.min(...ups) : null;
  const maxU   = ups.length ? Math.max(...ups) : null;

  const upArrow = cmpSort === 'up-asc'  ? ' <span style="color:var(--green)">↑</span>'
                : cmpSort === 'up-desc' ? ' <span style="color:var(--orange)">↓</span>'
                : '';

  // ── PC用テーブル行 ──
  const tableRows = sorted.map(item => {
    const up   = calcUP(item.price, item.amount, item.unit);
    const isBP = item.price === minP;
    const isBU = up!=null && up===minU;
    const isWU = up!=null && up===maxU && minU!==maxU;
    const bar  = maxU && up ? Math.round((up/maxU)*100) : null;
    const starred = item.starred ? 'starred' : '';
    return `<tr onclick="openModal('${item.id}')" style="cursor:pointer" class="${starred ? 'row-starred' : ''}">
      <td style="width:28px;padding-right:0"><button class="star-btn ${starred}" onclick="event.stopPropagation();toggleStar('${item.id}')" title="お気に入り">${item.starred ? '★' : '☆'}</button></td>
      <td class="td-name">${esc(item.productName)}</td>
      <td><span class="tag tag-store">${esc(item.store)}</span></td>
      <td class="mono ${isBP?'best-p':''}">${fmtYen(item.price)}</td>
      <td style="font-size:12px;color:var(--ink2)">${item.amount ? item.amount+' '+(item.unit||'') : '—'}</td>
      <td class="cmp-bar-cell">${bar!=null ? `<div class="cmp-bar-bg"><div class="cmp-bar-fill ${isWU?'w':''}" style="width:${bar}%"></div></div>` : ''}</td>
      <td class="mono ${isBU?'best-u':''} ${isWU?'worst-u':''}">
        ${up!=null ? fmtUP(up,item.unit)+upLabel(item.unit) : '—'}
        ${isBU && withUP.length>1 ? '<span class="best-badge">✨ お得</span>' : ''}
      </td>
      <td class="cmp-memo">${esc(item.memo||'')}</td>
      <td><button class="cmp-del" onclick="event.stopPropagation();delById('${item.id}')">🗑</button></td>
    </tr>`;
  });

  // ── スマホ用カード ──
  const mobileCards = sorted.map(item => {
    const up   = calcUP(item.price, item.amount, item.unit);
    const isBP = item.price === minP;
    const isBU = up!=null && up===minU;
    const isWU = up!=null && up===maxU && minU!==maxU;
    const upStr = up!=null ? fmtUP(up,item.unit)+upLabel(item.unit) : null;
    const starred = item.starred ? 'starred' : '';
    return `<div class="cmc ${starred ? 'cmc-starred' : ''}" onclick="openModal('${item.id}')" style="cursor:pointer">
      <div style="display:flex;align-items:flex-start;gap:6px">
        <button class="star-btn ${starred}" onclick="event.stopPropagation();toggleStar('${item.id}')" title="お気に入り">${item.starred ? '★' : '☆'}</button>
        <div style="flex:1">
          <div class="cmc-name">${esc(item.productName)}</div>
          <div class="cmc-row">
            <span class="cmc-store" title="${esc(item.store)}">${esc(item.store)}</span>
            <span class="cmc-price ${isBP?'bp':''}">${fmtYen(item.price)}</span>
            ${item.amount ? `<span class="cmc-amount">${item.amount}${item.unit||''}</span>` : ''}
            ${upStr ? `<span class="cmc-up ${isBU?'bu':''} ${isWU?'wu':''}">${upStr}${isBU && withUP.length>1 ? ' <span class="best-badge">✨ お得</span>' : ''}</span>` : ''}
          </div>
          ${item.memo ? `<div class="cmc-memo">${esc(item.memo)}</div>` : ''}
        </div>
      </div>
    </div>`;
  });

  return `<div class="cmp-group">
    <div class="cmp-head">
      <div class="cmp-title"><span class="tag tag-sub">${esc(sub)}</span></div>
      <span class="cmp-count">${group.length}件</span>
    </div>
    <div class="cmp-card">
      <table class="cmp-table">
        <thead><tr>
          <th style="width:28px"></th>
          <th>商品名</th><th>店名</th><th>価格</th><th>量</th>
          <th class="cmp-bar-cell">単価バー</th>
          <th onclick="toggleCmpUpSort()" style="cursor:pointer;user-select:none;transition:color .12s" onmouseover="this.style.color='var(--ink)'" onmouseout="this.style.color=''">単価${upArrow}</th>
          <th>メモ</th><th></th>
        </tr></thead>
        <tbody>${tableRows.join('')}</tbody>
      </table>
    </div>
    <div class="cmp-mobile">
      ${mobileCards.join('')}
    </div>
  </div>`;
}

function resetCompare() {
  document.getElementById('cmp-main').value = '';
  document.getElementById('cmp-sub').value  = '';
  document.getElementById('cmp-sort').value = 'up-asc';
  cmpSort = 'up-asc';
  renderCompare();
}

// ロゴクリック：比較ページを初期状態にリセットしてトップへ
function goHome() {
  // 比較ページへ遷移してからリセット（DOMが確実に存在する順序で）
  goPage('compare', document.querySelector('.nb'));
  // 選択状態・ソート状態・並び順すべてを初期値に戻す
  document.getElementById('cmp-main').value = '';
  document.getElementById('cmp-sub').value  = '';
  document.getElementById('cmp-sort').value = 'up-asc';
  cmpSort = 'up-asc';
  // 未選択状態で再描画（「カテゴリを選択してください」表示に戻る）
  renderCompare();
}

// ============================================================
// 登録・編集フォーム
// ============================================================
function calcPreview() {
  const p = parseFloat(document.getElementById('f-price').value);
  const a = parseFloat(document.getElementById('f-amount').value);
  const u = document.getElementById('f-unit').value.trim();
  const up = calcUP(p, a, u);
  const box = document.getElementById('up-box');
  const lbl = document.getElementById('up-lbl');
  const num = document.getElementById('up-num');
  if (up != null && !isNaN(up)) {
    box.classList.add('active');
    lbl.className = 'up-lbl active';
    lbl.textContent = `1${u}あたり単価`;
    num.textContent = fmtUP(up, u) + upLabel(u);
  } else {
    box.classList.remove('active');
    lbl.className = 'up-lbl';
    lbl.textContent = '価格と量（g / ml）を入力すると自動計算されます';
    num.textContent = '';
  }
}

function saveItem() {
  const name  = document.getElementById('f-name').value.trim();
  const store = document.getElementById('f-store').value.trim();
  const main  = document.getElementById('f-main').value.trim();
  const sub   = document.getElementById('f-sub').value.trim();
  const price = parseFloat(document.getElementById('f-price').value);
  const amount= parseFloat(document.getElementById('f-amount').value) || null;
  const unit  = document.getElementById('f-unit').value.trim() || null;
  const memo  = document.getElementById('f-memo').value.trim() || null;

  if (!name || !store || !main || !sub || isNaN(price) || price <= 0) {
    alert('商品名・店名・大カテゴリ・比較カテゴリ・価格は必須です'); return;
  }

  if (_editId) {
    // ── 編集モード：既存アイテムを上書き ──
    const idx = items.findIndex(i => i.id === _editId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], productName:name, store, mainCategory:main, subCategory:sub, price, amount, unit, memo };
    }
  } else {
    // ── 新規登録 ──
    items.unshift({ id: Date.now().toString(), _ts: Date.now(), productName:name, store, mainCategory:main, subCategory:sub, price, amount, unit, memo });
  }

  persist();
  refreshDropdowns();

  const msg = document.getElementById('save-msg');
  msg.style.display = 'inline';
  setTimeout(() => msg.style.display='none', 2000);

  // 新規登録後はフィールドを一部クリア。編集後はそのまま残す。
  if (!_editId) {
    document.getElementById('f-name').value   = '';
    document.getElementById('f-price').value  = '';
    document.getElementById('f-amount').value = '';
    document.getElementById('f-memo').value   = '';
    calcPreview();
  } else {
    // 編集完了→モードを戻す
    _editId = null;
    setEditMode(false);
  }
}

function cancelEdit() {
  _editId = null;
  setEditMode(false);
  clearForm();
}

function clearForm() {
  ['f-name','f-store','f-main','f-sub','f-price','f-amount','f-unit','f-memo'].forEach(id => {
    document.getElementById(id).value = '';
  });
  calcPreview();
}

function setEditMode(on) {
  document.getElementById('edit-banner').classList.toggle('show', on);
  document.getElementById('add-title').textContent = on ? '✏️ 商品を編集する' : '➕ 商品を登録する';
  document.getElementById('save-btn').textContent  = on ? '💾 更新する' : '💾 登録する';
  document.getElementById('save-msg').textContent  = on ? '✅ 更新しました！' : '✅ 登録しました！';
}

// ============================================================
// 詳細モーダル
// ============================================================
function openModal(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  _modalId = id;
  const up = calcUP(item.price, item.amount, item.unit);

  // ★ボタン
  const mStar = document.getElementById('m-star');
  mStar.textContent = item.starred ? '★' : '☆';
  mStar.className   = 'star-btn' + (item.starred ? ' starred' : '');
  mStar.title       = item.starred ? 'お気に入り解除' : 'お気に入りに追加';

  document.getElementById('m-name').textContent = item.productName;
  document.getElementById('m-tags').innerHTML =
    `<span class="tag tag-main">${esc(item.mainCategory)}</span> ` +
    `<span class="tag tag-sub">${esc(item.subCategory)}</span> ` +
    `<span class="tag tag-store">${esc(item.store)}</span>`;

  const rows = [
    ['価格', fmtYen(item.price)],
    item.amount ? ['量', item.amount + ' ' + (item.unit||'')] : null,
    up != null  ? ['単価', fmtUP(up, item.unit) + ' ' + upLabel(item.unit)] : null,
  ].filter(Boolean);

  document.getElementById('m-rows').innerHTML = rows.map(([k,v]) =>
    `<div class="modal-row">
       <span class="modal-key">${k}</span>
       <span class="modal-val">${esc(v)}</span>
     </div>`
  ).join('');

  const me = document.getElementById('m-memo');
  if (item.memo) { me.textContent = item.memo; me.style.display = 'block'; }
  else { me.style.display = 'none'; }

  document.getElementById('modal-bg').classList.add('open');
}

// ★ トグル（一覧・比較カードのボタンから）
function toggleStar(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  item.starred = !item.starred;
  persist();
  // 現在表示中のページを再描画
  const ap = document.querySelector('.page.active');
  if (ap.id === 'page-home')    homeSearch();
  if (ap.id === 'page-list')    renderList();
  if (ap.id === 'page-compare') renderCompare();
  if (ap.id === 'page-store')   renderStore();
}

// ★ トグル（モーダル内のボタンから）
function toggleStarModal() {
  if (!_modalId) return;
  toggleStar(_modalId);
  // モーダルの★表示も更新
  const item = items.find(i => i.id === _modalId);
  if (!item) return;
  const mStar = document.getElementById('m-star');
  mStar.textContent = item.starred ? '★' : '☆';
  mStar.className   = 'star-btn' + (item.starred ? ' starred' : '');
  mStar.title       = item.starred ? 'お気に入り解除' : 'お気に入りに追加';
}

function closeModal() {
  document.getElementById('modal-bg').classList.remove('open');
  _modalId = null;
}
function bgClick(e) {
  if (e.target === document.getElementById('modal-bg')) closeModal();
}

// ── 詳細から編集へ ──
function editFromModal() {
  if (!_modalId) return;
  const item = items.find(i => i.id === _modalId);
  if (!item) return;

  // フォームにデータを読み込む
  document.getElementById('f-name').value   = item.productName || '';
  document.getElementById('f-store').value  = item.store || '';
  document.getElementById('f-main').value   = item.mainCategory || '';
  document.getElementById('f-sub').value    = item.subCategory || '';
  document.getElementById('f-price').value  = item.price || '';
  document.getElementById('f-amount').value = item.amount || '';
  document.getElementById('f-unit').value   = item.unit || '';
  document.getElementById('f-memo').value   = item.memo || '';
  calcPreview();

  _editId = _modalId;
  setEditMode(true);
  closeModal();

  // 登録画面へ遷移（商品=0, 店名=1, 登録=2）
  goPageFromFilter('add');
  // 画面トップにスクロール
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── 詳細から削除 ──
function deleteModal() {
  if (!_modalId) return;
  const item = items.find(i => i.id === _modalId);
  if (!item) return;
  if (!confirm(`「${item.productName}」を削除しますか？`)) return;
  closeModal();
  delById(item.id, true);
}

// ── 削除ボタンから ──
function delById(id, skipConfirm=false) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  if (!skipConfirm && !confirm(`「${item.productName}」を削除しますか？`)) return;
  items = items.filter(i => i.id !== id);
  persist();
  refreshDropdowns();
  const ap = document.querySelector('.page.active');
  if (ap.id === 'page-home')    homeSearch();
  if (ap.id === 'page-list')    renderList();
  if (ap.id === 'page-compare') renderCompare();
  if (ap.id === 'page-store')   renderStore();
}

// ============================================================
// STORE PAGE
// ============================================================
function renderStore() {
  const selStore  = document.getElementById('store-sel').value;
  const con       = document.getElementById('store-container');
  const sortRight = document.querySelector('#page-store .cmp-filter-right');

  if (!selStore) {
    if (sortRight) sortRight.style.visibility = 'hidden';
    con.innerHTML = `<div class="cmp-prompt">
      <div class="cmp-prompt-icon">🏪</div>
      <div class="cmp-prompt-text">店名を選択してください</div>
    </div>`;
    return;
  }
  if (sortRight) sortRight.style.visibility = 'visible';

  const pool = items.filter(i => i.store === selStore);
  if (!pool.length) {
    con.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div>この店の商品はありません</div>';
    return;
  }

  const storeSortVal = document.getElementById('store-sort').value;
  const grouped = {};
  pool.forEach(i => { const k = i.subCategory||'未分類'; (grouped[k]=grouped[k]||[]).push(i); });

  const savedSort = cmpSort;
  cmpSort = storeSortVal;
  con.innerHTML = Object.keys(grouped).sort((a,b) => a.localeCompare(b))
    .map(k => cmpGroup(k, grouped[k])).join('');
  cmpSort = savedSort;
}

function resetStore() {
  document.getElementById('store-sel').value  = '';
  document.getElementById('store-sort').value = 'up-asc';
  renderStore();
}

// ── データをサンプルに戻す（↺ボタン用） ──
function resetAllData() {
  if (!confirm('データをサンプルの初期状態に戻しますか？\n（登録した商品はすべて消えます）')) return;
  localStorage.removeItem(SK);
  items = SAMPLE_DATA.map((d, i) => ({ ...d, id: 's'+i, _ts: i }));
  persist();
  refreshDropdowns();
  goHome();
}

// ============================================================
// INIT
// ============================================================
refreshDropdowns();
// 起動時は商品ページを表示
renderCompare();
document.querySelector('.nb').classList.add('active'); // 先頭＝商品ボタン
