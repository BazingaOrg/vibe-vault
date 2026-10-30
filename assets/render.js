import { contrastRatio, foregroundFor } from './theme.js?v=20261026-style-fidelity';
export const esc = value => String(value ?? '').replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
const $ = selector => document.querySelector(selector);

const STYLE_LABELS = {'Minimalism':'极简','Swiss-International':'瑞士国际主义','Neo-Brutalism':'新粗野主义','Brutalism':'粗野主义','Glassmorphism':'玻璃质感','Neumorphism':'柔和拟物','Claymorphism':'黏土质感','Flat':'扁平化','Material':'材料设计','Skeuomorphism':'拟物风格','Editorial':'编辑排版','Corporate':'商务专业','Dark-Tech':'暗色科技','Retro-Y2K':'复古 Y2K','Memphis':'孟菲斯','Maximalism':'繁复主义','Luxury-Elegant':'精致优雅','Geometric-Bauhaus':'几何包豪斯','Playful-Illustrative':'活泼插画','Organic-Natural':'自然有机'};
export const styleLabel = value => STYLE_LABELS[value]||value;

function resetScreenshot(image) {
  image.onload = null;
  image.onerror = null;
  image.hidden = false;
  const fallback = image.parentElement?.querySelector('.media-fallback');
  if (fallback) fallback.hidden = true;
}

function watchScreenshot(image) {
  const fallback = image.parentElement?.querySelector('.media-fallback');
  const link = image.closest('.reference-image');
  const loaded = () => {
    image.hidden = false;
    if (fallback) fallback.hidden = true;
    if (link && image.getAttribute('src')) link.href = image.getAttribute('src');
  };
  const failed = () => {
    image.hidden = true;
    if (fallback) fallback.hidden = false;
    link?.removeAttribute('href');
  };
  image.onload = loaded;
  image.onerror = failed;
  if (image.complete) {
    if (image.naturalWidth) loaded();
    else failed();
  }
}

export function renderGallerySelection(id) {
  for (const card of document.querySelectorAll(".site-card")) {
    const selected = card.dataset.id === id;
    card.setAttribute("aria-pressed", String(selected));
    card.querySelector(".card-arrow").textContent = selected ? "●" : "↗";
  }
}

export function renderGallery(entries, selectedId) {
  $('#gallery').setAttribute('aria-busy', 'false');
  $('#gallery').innerHTML = entries.length ? entries.map((entry, index) => `
    <button type="button" class="site-card" data-id="${esc(entry.id)}" aria-pressed="${entry.id === selectedId}" aria-label="${esc(entry.name)}，查看风格详情">
      <span class="site-media"><img src="sites/${encodeURIComponent(entry.id)}/screenshot.png" loading="lazy" decoding="async" alt=""><span class="media-fallback" hidden>截图暂不可用</span></span>
      <span class="card-caption"><span class="card-index">${String(index + 1).padStart(2, '0')}</span><span class="card-copy"><strong title="${esc(entry.name)}">${esc(entry.name)}</strong><span>${esc(entry.descriptors.slice(0, 3).join(' · '))}</span></span><span class="card-arrow" aria-hidden="true">${entry.id === selectedId ? '●' : '↗'}</span></span>
    </button>`).join('') : '<div class="empty"><span>还没有匹配的风格。</span><button class="chip" type="button" data-clear>清除筛选与搜索</button></div>';
  for (const image of document.querySelectorAll('#gallery .site-media img')) watchScreenshot(image);
}

export function renderGallerySkeleton() {
  $('#gallery').setAttribute('aria-busy', 'true');
  $('#gallery').innerHTML = '<div class="empty">正在打开收藏册…</div>';
}

export function renderDetailSkeleton() {
  $('#detail').hidden = false;
  $('#detail').setAttribute('aria-busy', 'true');
  $('#detail-content').hidden = true;
  $('#current-name').textContent = '正在翻阅…';
  $('#current-style').textContent = '';
  $('#tags').textContent = '';
  $('#thesis').textContent = '';
  resetScreenshot($('#current-shot'));
  $('#current-shot').removeAttribute('src');
  $('#current-shot').alt = '';
  $('#current-image-link').removeAttribute('href');
  $('#source-link').removeAttribute('href');
  $('#record-status').textContent = '';
  $('#detail-error').textContent = '';
  renderGuide('loading');
}

function applyPageTheme(theme, grammar) {
  const root = document.documentElement;
  const names = ['font-sans','font-display','radius','shadow','space','bg','surface','text','muted','accent','border'];
  for (const name of names) {
    const key = `--tk-${name}`;
    root.style.removeProperty(key);
    const value = theme?.[key];
    if (typeof value === 'string' && value.trim()) root.style.setProperty(key, value);
  }
  const style = getComputedStyle(root);
  const color = name => style.getPropertyValue(`--tk-${name}`).trim();
  const background = color('bg'), surface = color('surface'), text = color('text');
  const readable = value => contrastRatio(value, background) >= 4.5 && contrastRatio(value, surface) >= 4.5 ? value : text;
  root.style.setProperty('--ui-muted', readable(color('muted')));
  root.style.setProperty('--ui-accent-text', readable(color('accent')));
  root.style.setProperty('--ui-focus', contrastRatio(color('accent'), background) >= 3 ? color('accent') : text);
  root.style.setProperty('--specimen-accent-ink', foregroundFor(color('accent')));
  root.style.setProperty('color-scheme', foregroundFor(background) === '#fff' ? 'dark' : 'light');
  const type = grammar?.typography;
  const display = type?.display?.value;
  const body = type?.body?.value;
  const meta = type?.meta?.value;
  const number = (value, fallback, min, max) => Number.isFinite(Number(value)) && value !== null && value !== undefined ? Math.min(max, Math.max(min, Number(value))) : fallback;
  root.style.setProperty('--ui-heading-weight', String(number(display?.weight, 700, 100, 900)));
  root.style.setProperty('--ui-heading-tracking', `${number(display?.letterSpacing, 0, -5, 10)}px`);
  root.style.setProperty('--ui-heading-leading', String(number(display?.lineHeight, 1.1, .9, 1.6)));
  root.style.setProperty('--ui-body-size', `${number(body?.size, 16, 14, 18)}px`);
  root.style.setProperty('--ui-body-weight', String(number(body?.weight, 400, 100, 900)));
  root.style.setProperty('--ui-body-leading', String(number(body?.lineHeight, 1.6, 1.3, 2)));
  root.style.setProperty('--ui-body-tracking', `${number(body?.letterSpacing, 0, -2, 5)}px`);
  root.style.setProperty('--ui-meta-font', meta?.family || 'var(--tk-font-sans)');
  root.style.setProperty('--ui-meta-weight', String(number(meta?.weight, 400, 100, 900)));
  root.style.setProperty('--ui-meta-tracking', `${number(meta?.letterSpacing, 0, 0, 2)}px`);
  root.style.setProperty('--ui-stroke', `${number(grammar?.stroke?.value?.primary, 1, 1, 3)}px`);
  root.style.setProperty('--ui-stroke-style', ['solid', 'dashed', 'dotted', 'double'].includes(grammar?.stroke?.value?.style) ? grammar.stroke.value.style : 'solid');

}


function safeUrl(value) {
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : '#'; }
  catch { return '#'; }
}

export function renderDetail(site) {
  applyPageTheme(site.theme || {}, site.visualGrammar || {});
  $('#detail').hidden = false;
  $('#detail').setAttribute('aria-busy', 'false');
  $('#detail-content').hidden = false;
  $('#current-name').textContent = site.name || '未命名收藏';
  $('#current-name').classList.toggle('long-title', String(site.name || '').split(/\s+/).some(word => word.length > 12));
  try { $('#current-style').textContent = new URL(site.url).hostname; }
  catch { $('#current-style').textContent = site.name || ''; }
  $('#tags').innerHTML = (site.style?.descriptors || []).map(value => `<span>${esc(value)}</span>`).join('');
  $('#thesis').textContent = site.style?.thesis?.match(/^.*?[。！？.!?](?:\s|$|(?=[^\x00-\x7F]))/)?.[0]?.trim() || site.style?.thesis || '';
  const screenshot = `sites/${encodeURIComponent(site.id)}/screenshot.png`;
  resetScreenshot($('#current-shot'));
  $('#current-shot').src = screenshot;
  $('#current-shot').alt = `${site.name}原站参考截图`;
  $('#current-image-link').href = screenshot;
  watchScreenshot($('#current-shot'));
  $('#source-link').href = safeUrl(site.url);
  $('#detail-error').textContent = '';
  const warnings = Array.isArray(site.warnings) ? site.warnings : [];
  $('#record-status').textContent = warnings.length ? '这份风格尚不完整' : '';
}

export function renderDetailError(name, error) {
  applyPageTheme({}, {});
  $('#detail').setAttribute('aria-busy', 'false');
  $('#current-name').textContent = name;
  $('#current-name').classList.remove('long-title');
  $('#thesis').textContent = `无法加载这份记录：${error instanceof Error ? error.message : String(error)}`;
  $('#detail-error').innerHTML = '<button class="chip" type="button" data-retry-detail>重新加载详情</button>';
  $('[data-retry-detail]').focus({ preventScroll: true });
}

export function renderGuide(guideState) {
  const ready = guideState === 'ready';
  $('#copy-code').disabled = !ready;
  $('#download-guide').disabled = !ready;
  $('#retry-guide').hidden = guideState !== 'error';
  $('#copy-code .copy-label').textContent = ready ? '复制风格' : guideState === 'error' ? '风格包暂不可用' : '准备风格包…';
  $('#guide-feedback').textContent = guideState === 'error' ? '文档加载失败，可重试。原站参考仍可查看。' : '';
}
