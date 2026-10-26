import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');

test('gallery preserves navigation, handles failures and exports the selected guide', async () => {
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url || '/', 'http://localhost').pathname;
      const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
      const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
      response.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain');
      response.end(await readFile(file));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.locator('#copy-code:not([disabled])').waitFor();
    assert.equal(await page.locator('#filters').isVisible(), true);
    for (const id of ['yeguozi-com', 'historyofmarket-com', 'codex-resets-com']) {
      await page.locator(`[data-id="${id}"]`).click();
      await page.locator('#copy-code:not([disabled])').waitFor();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const site = JSON.parse(await readFile(path.join(root, 'sites', id, 'site.json'), 'utf8'));
      const actual = await page.evaluate(() => {
        const body = getComputedStyle(document.body);
        const card = getComputedStyle(document.querySelector('.site-card')!);
        const search = getComputedStyle(document.querySelector('#search')!);
        const title = getComputedStyle(document.querySelector('#current-name')!);
        const media = getComputedStyle(document.querySelector('.site-media')!);
        const reference = getComputedStyle(document.querySelector('.reference-image')!);
        return {
          background: body.backgroundColor,
          surface: media.backgroundColor,
          input: search.backgroundColor,
          text: card.color,
          font: title.fontFamily,
          radius: card.borderRadius,
          shadow: reference.boxShadow,
        };
      });
      const expected = await page.evaluate(theme => {
        const node = document.createElement('div');
        node.style.setProperty('transition', 'none', 'important');
        node.style.backgroundColor = theme['--tk-bg'];
        node.style.color = theme['--tk-text'];
        node.style.fontFamily = theme['--tk-font-display'];
        node.style.borderRadius = theme['--tk-radius'];
        node.style.boxShadow = theme['--tk-shadow'];
        document.body.append(node);
        const style = getComputedStyle(node);
        const result = {background: style.backgroundColor, text: style.color, font: style.fontFamily, radius: style.borderRadius, shadow: style.boxShadow, surface: ''};
        node.style.backgroundColor = theme['--tk-surface'];
        result.surface = getComputedStyle(node).backgroundColor;
        node.remove();
        return result;
      }, site.theme);
      assert.deepEqual(actual, {...expected, input: expected.background});
    }
    await page.locator('#search').fill('historyofmarket.com 刊物');
    assert.equal(await page.locator('.site-card').count(), 1);
    await page.reload();
    await page.locator('#copy-code:not([disabled])').waitFor();
    assert.equal(await page.locator('#search').inputValue(), 'historyofmarket.com 刊物');
    assert.equal(await page.locator('.site-card').count(), 1);
    await page.locator('.site-card').click();
    await page.waitForURL('**site=historyofmarket-com**');
    await page.locator('#copy-code:not([disabled])').waitFor();
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('#current-name')?.textContent === 'Codex Resets');
    await page.locator('#search').fill('');
    await page.locator('.filter-menu summary').click();
    await page.locator('[data-filter="Luxury-Elegant"]').click();
    assert.equal(await page.locator('.filter-menu summary').textContent(), '精致优雅');
    assert.equal(await page.locator('.site-card').count(), 1);
    assert.equal(await page.locator('.site-card').getAttribute('data-id'), 'yeguozi-com');
    await page.locator('[data-filter=""]').click();

    await page.route('**/yeguozi-com/site.json', route => route.fulfill({ status: 503, body: '' }));
    await page.locator('[data-id="yeguozi-com"]').focus();
    await page.locator('[data-id="yeguozi-com"]').press('Enter');
    await page.locator('[data-retry-detail]').waitFor();
    assert.equal(await page.locator('[data-retry-detail]').evaluate(node => node === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--tk-bg')), '');
    await page.locator('[data-retry-detail]').press('Enter');
    await page.locator('[data-retry-detail]').waitFor();
    assert.equal(await page.locator('[data-retry-detail]').evaluate(node => node === document.activeElement), true);
    assert.equal(await page.locator('#detail-content').isVisible(), false);
    assert.equal(await page.locator('#copy-code').isDisabled(), true);
    await page.unroute('**/yeguozi-com/site.json');
    await page.locator('[data-retry-detail]').press('Enter');
    await page.locator('#copy-code:not([disabled])').waitFor();
    assert.equal(await page.locator('#current-name').textContent(), 'Yeguozi');
    assert.equal(await page.locator('#current-name').evaluate(node => node === document.activeElement), true);

    await page.route('**/historyofmarket-com/STYLE-GUIDE.md', route => route.fulfill({ status: 503, body: '' }));
    await page.locator('[data-id="historyofmarket-com"]').click();
    await page.locator('#retry-guide').waitFor();
    assert.equal(await page.locator('#download-guide').isDisabled(), true);
    await page.locator('#retry-guide').focus();
    await page.locator('#retry-guide').press('Enter');
    await page.locator('#retry-guide').waitFor();
    assert.equal(await page.locator('#retry-guide').evaluate(node => node === document.activeElement), true);
    await page.unroute('**/historyofmarket-com/STYLE-GUIDE.md');
    await page.locator('#retry-guide').press('Enter');
    await page.locator('#download-guide:not([disabled])').waitFor();
    assert.equal(await page.locator('#copy-code').evaluate(node => node === document.activeElement), true);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#download-guide').click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'historyofmarket-com-STYLE-GUIDE.md');
    assert.equal(await readFile((await download.path())!, 'utf8'), await readFile(path.join(root, 'sites/historyofmarket-com/STYLE-GUIDE.md'), 'utf8'));

    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/yeguozi-com/STYLE-GUIDE.md', async route => { await held; await route.continue(); });
    await page.locator('[data-id="yeguozi-com"]').click();
    await page.locator('[data-id="codex-resets-com"]').click();
    await page.locator('#copy-code:not([disabled])').waitFor();
    release();
    await page.unrouteAll({ behavior: 'wait' });
    assert.equal(await page.locator('#current-name').textContent(), 'Codex Resets');
    const currentDownload = page.waitForEvent('download');
    await page.locator('#download-guide').click();
    assert.equal(await readFile((await (await currentDownload).path())!, 'utf8'), await readFile(path.join(root, 'sites/codex-resets-com/STYLE-GUIDE.md'), 'utf8'));
    assert.equal(await page.getByText('风格标本', { exact: true }).count(), 0);
    assert.equal(await page.locator('#swatches, #grammar, #type-scale').count(), 0);
    assert.equal(await page.locator('#source-details, #facts').count(), 0);
    assert.equal(await page.getByText('调色板覆盖', { exact: false }).count(), 0);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `page overflows at ${width}px`);
    }
    await page.route('**/sites/index.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    await page.reload();
    await page.locator('[data-retry-index]').waitFor();
    assert.equal(await page.locator('#gallery').getAttribute('aria-busy'), 'false');
    await page.unroute('**/sites/index.json');
    await page.locator('[data-retry-index]').click();
    await page.locator('#copy-code:not([disabled])').waitFor();
    assert.equal(await page.locator('.site-card').count(), 3);
    const exported = await readFile(path.join(root, 'sites/codex-resets-com/STYLE-GUIDE.md'), 'utf8');
    const css = exported.match(/```css\n([\s\S]*?)```/)?.[1];
    assert.ok(css);
    const isolated = await browser.newPage();
    await isolated.setContent(`<style>${css}</style><h1 class="style-display">Display</h1><p class="style-body">Body</p><span class="style-meta">Meta</span>`);
    const record = JSON.parse(await readFile(path.join(root, 'sites/codex-resets-com/site.json'), 'utf8'));
    for (const role of ['display', 'body', 'meta']) {
      const expected = record.visualGrammar.typography[role].value;
      if (!expected) continue;
      const actual = await isolated.locator(`.style-${role}`).evaluate(node => {
        const style = getComputedStyle(node);
        return {size: parseFloat(style.fontSize), weight: Number(style.fontWeight), leading: parseFloat(style.lineHeight), tracking: style.letterSpacing === 'normal' ? 0 : parseFloat(style.letterSpacing)};
      });
      assert.equal(actual.size, expected.size);
      assert.equal(actual.weight, expected.weight);
      assert.ok(Math.abs(actual.leading - expected.size * expected.lineHeight) < .1);
      assert.equal(actual.tracking, expected.letterSpacing);
    }
    await isolated.close();
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
