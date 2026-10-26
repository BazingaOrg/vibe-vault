import { esc, renderDetail, renderDetailError, renderDetailSkeleton, renderGallery, renderGallerySelection, renderGallerySkeleton, renderGuide, styleLabel } from './render.js?v=20261026-style-fidelity';

const $ = selector => document.querySelector(selector);
const state = {
  index: [], selectedId: null, fullRecords: new Map(), guide: '',
  guideState: 'loading', selectionVersion: 0, filter: '', query: '', copyTimer: undefined,
};

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const focus = document.activeElement;
    const area = document.createElement('textarea');
    area.value = text;
    area.style.cssText = 'position:fixed;opacity:0';
    document.body.append(area);
    area.select();
    try { return document.execCommand('copy'); }
    catch { return false; }
    finally { area.remove(); focus?.focus({ preventScroll: true }); }
  }
}

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  window.clearTimeout(state.copyTimer);
  state.copyTimer = window.setTimeout(() => node.classList.remove('show'), 2000);
}

function filtered() {
  const words = state.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return state.index.filter(entry => {
    const text = [entry.name, entry.url, entry.primaryStyle, entry.secondaryStyle, styleLabel(entry.primaryStyle), styleLabel(entry.secondaryStyle), ...entry.descriptors].filter(Boolean).join(' ').toLocaleLowerCase();
    return (!state.filter || entry.primaryStyle === state.filter || entry.secondaryStyle === state.filter) && words.every(word => text.includes(word));
  });
}

function updateGallery() {
  const entries = filtered();
  renderGallery(entries, state.selectedId);
  $('#count').textContent = `${entries.length} / ${state.index.length} 个收藏`;
}

function restoreStatus() { $('#status').textContent = `${state.index.length} 份风格 · 全部本地保存`; }

function renderFilters() {
  $('#filters').hidden = !state.index.length;
  const styles = [...new Set(state.index.flatMap(entry => [entry.primaryStyle, entry.secondaryStyle]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const menu = $('.filter-menu');
  if (state.filter) menu.open = true;
  menu.querySelector('summary').textContent = state.filter ? styleLabel(state.filter) : '按风格筛选';
  $('#chips').innerHTML = [['', '全部'], ...styles.map(style => [style, styleLabel(style)])].map(([value, label]) => `<button class="chip" type="button" data-filter="${esc(value)}" aria-pressed="${value === state.filter}">${esc(label)}</button>`).join('');
  $('#search').value = state.query;
}

function saveLocation(push = false) {
  const url = new URL(location.href);
  for (const [key, value] of [['site', state.selectedId], ['style', state.filter], ['q', state.query]]) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  if (url.href !== location.href) history[push ? 'pushState' : 'replaceState'](null, '', url);
}

async function readSite(id) {
  if (state.fullRecords.has(id)) return state.fullRecords.get(id);
  const response = await fetch(`sites/${encodeURIComponent(id)}/site.json`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const record = await response.json();
  if (record.id !== id || !record.tokens || !record.style) throw new Error('记录内容不完整');
  state.fullRecords.set(id, record);
  return record;
}

function scrollToTarget(target) {
  target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

async function fetchGuide(id) {
  const response = await fetch(`sites/${encodeURIComponent(id)}/STYLE-GUIDE.md`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function select(id, shouldScroll = false, push = false) {
  const entry = state.index.find(item => item.id === id);
  if (!entry) return;
  if (id === state.selectedId && state.fullRecords.has(id) && state.guideState === 'ready') {
    if (shouldScroll) { scrollToTarget($('#detail')); $('#current-name').focus({ preventScroll: true }); }
    return;
  }
  const version = ++state.selectionVersion;
  state.selectedId = id;
  state.guide = '';
  state.guideState = 'loading';
  saveLocation(push);
  renderGallerySelection(id);
  renderDetailSkeleton();
  if (shouldScroll) scrollToTarget($('#detail'));
  const guideResult = fetchGuide(id).catch(() => '');
  let site;
  try { site = await readSite(id); }
  catch (error) {
    if (version !== state.selectionVersion) return;
    $('#status').textContent = '站点记录加载失败';
    renderDetailError(entry.name, error);
    return;
  }
  if (version !== state.selectionVersion) return;
  restoreStatus();
  renderDetail(site);
  if (shouldScroll) $('#current-name').focus({ preventScroll: true });
  const guideText = await guideResult;
  if (version !== state.selectionVersion) return;
  updateGuide(guideText);
}

function updateGuide(value) {
  state.guide = value.trim() ? value : '';
  state.guideState = state.guide ? 'ready' : 'error';
  renderGuide(state.guideState);
}

async function retryGuide() {
  const version = ++state.selectionVersion;
  state.guideState = 'loading';
  renderGuide('loading');
  $('#current-name').focus({ preventScroll: true });
  const value = await fetchGuide(state.selectedId).catch(() => '');
  if (version !== state.selectionVersion) return;
  updateGuide(value);
  $(state.guideState === 'ready' ? '#copy-code' : '#retry-guide').focus({ preventScroll: true });
}

async function restoreLocation() {
  const params = new URLSearchParams(location.search);
  state.query = params.get('q') || '';
  const style = params.get('style') || '';
  state.filter = state.index.some(entry => entry.primaryStyle === style || entry.secondaryStyle === style) ? style : '';
  renderFilters();
  updateGallery();
  const id = params.get('site');
  await select(state.index.some(entry => entry.id === id) ? id : state.index[0]?.id);
}

async function boot() {
  renderGallerySkeleton();
  try {
    const response = await fetch('sites/index.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('收藏索引格式不正确');
    state.index = data.filter(entry => entry && entry.id).map(entry => ({
      id: String(entry.id), name: String(entry.name || '未命名收藏'), url: String(entry.url || ''),
      primaryStyle: String(entry.primaryStyle || '未判定'), secondaryStyle: entry.secondaryStyle ? String(entry.secondaryStyle) : null,
      descriptors: Array.isArray(entry.descriptors) ? entry.descriptors.map(String) : [],
      accent: String(entry.accent || ''), extractedAt: String(entry.extractedAt || ''),
      partial: Boolean(entry.partial), validationFlags: Array.isArray(entry.validationFlags) ? entry.validationFlags.map(String) : [],
    }));
    state.index.sort((a, b) => b.extractedAt.localeCompare(a.extractedAt) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    renderFilters();
    updateGallery();
    if (!state.index.length) {
      $('#status').textContent = '收藏册还是空的。';
      $('#gallery').innerHTML = '<div class="empty">把喜欢的网站网址交给当前对话，说明“提取这个网站的风格”，即可开始第一份收藏。</div>';
      return;
    }
    restoreStatus();
    await restoreLocation();
  } catch (error) {
    $('#status').textContent = '加载失败';
    $('#gallery').setAttribute('aria-busy', 'false');
    $('#gallery').innerHTML = `<div class="empty"><p>无法打开收藏索引。请确认通过 HTTP 服务器访问，并检查连接。</p><p>${esc(error.message)}</p><button class="chip" type="button" data-retry-index>重新加载</button></div>`;
  }
}

async function activate(target) {
  const card = target.closest('.site-card');
  if (card) return select(card.dataset.id, true, true);
  if (target.closest('[data-retry-index]')) return boot();
  if (target.closest('[data-retry-detail]')) return select(state.selectedId, true);
  if (target.closest('[data-retry-guide]')) return retryGuide();
  const filter = target.closest('[data-filter]');
  const clear = target.closest('[data-clear]');
  if (filter || clear) {
    state.filter = clear ? '' : filter.dataset.filter;
    if (clear) state.query = '';
    renderFilters();
    updateGallery();
    saveLocation();
    const next = [...document.querySelectorAll('[data-filter]')].find(node => node.dataset.filter === state.filter);
    next?.focus({ preventScroll: true });
    return;
  }
  if (target.closest('#copy-code') && state.guideState === 'ready') {
    toast(await copy(state.guide) ? '已复制风格包' : '复制失败，可下载风格包或手动复制');
  }
  if (target.closest('#download-guide') && state.guideState === 'ready') {
    const url = URL.createObjectURL(new Blob([state.guide], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.selectedId}-STYLE-GUIDE.md`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

document.addEventListener('click', event => {
  if (event.target instanceof Element) void activate(event.target);
});
$('#search').addEventListener('input', event => {
  state.query = event.target.value;
  updateGallery();
  saveLocation();
});
window.addEventListener('popstate', () => { void restoreLocation(); });
void boot();
