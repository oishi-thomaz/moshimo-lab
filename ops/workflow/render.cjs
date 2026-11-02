const { chromium } = require('playwright');
(async () => {
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1123, height: 794 }, deviceScaleFactor: 2 });
await p.goto('file://' + process.cwd() + '/workflow.html'); await p.waitForTimeout(500);
const over = await p.evaluate(() => { const pg = document.querySelector('.page'); return { sh: pg.scrollHeight, ch: pg.clientHeight, items: [...document.querySelectorAll('.card,.acc')].filter(e => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1).map(e => e.className + ' ' + e.scrollHeight + '/' + e.clientHeight + ' w' + e.scrollWidth + '/' + e.clientWidth) }; });
console.log(JSON.stringify(over));
await p.screenshot({ path: 'preview.png', fullPage: false });
await p.pdf({ path: 'SNS運用ワークフロー.pdf', width: '297mm', height: '210mm', printBackground: true, pageRanges: '1' });
await b.close();
})();
