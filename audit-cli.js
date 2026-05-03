#!/usr/bin/env node
/**
 * PDP Comparator — Automated Audit CLI
 *
 * Usage:
 *   node audit-cli.js MD08044902                          # 단일 모델
 *   node audit-cli.js MD08044902 MD10583911 MD10521846    # 여러 모델
 *   node audit-cli.js --file models.txt                   # 파일에서 모델 목록 읽기
 *   node audit-cli.js --file models.txt --type SUBSCRIPTION
 *   node audit-cli.js MD08044902 --headed                 # 브라우저 표시
 *   node audit-cli.js MD08044902 --out report.html        # HTML 리포트 출력
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'https://wwwdev50.lge.co.kr';
const API_BASE = 'http://pdpapisvc.lgekrdev.lge.co.kr';
const AUDIT_JS = fs.readFileSync(path.join(__dirname, 'audit-functions.js'), 'utf-8');

// ─── CLI ───
async function main() {
  const args = process.argv.slice(2);
  let models = [];
  let pdpType = 'PURCHASE';
  let headed = false;
  let outFile = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file') { models.push(...fs.readFileSync(args[++i], 'utf-8').split('\n').map(l => l.trim()).filter(Boolean)); }
    else if (args[i] === '--type') { pdpType = args[++i]; }
    else if (args[i] === '--headed') { headed = true; }
    else if (args[i] === '--out') { outFile = args[++i]; }
    else if (args[i].startsWith('MD')) { models.push(args[i]); }
  }

  if (!models.length) {
    console.log('Usage: node audit-cli.js MD08044902 [MD...] [--file models.txt] [--type SUBSCRIPTION] [--headed] [--out report.html]');
    process.exit(1);
  }

  console.log(`\n🔍 PDP Audit — ${models.length}개 모델, type=${pdpType}\n`);

  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 480, height: 960 }
  });

  const results = [];

  for (const modelId of models) {
    console.log(`── ${modelId} ──`);
    try {
      const urls = await getUrls(modelId, pdpType);
      if (!urls) { console.log('  ⚠ URL 조회 실패, skip'); results.push({ modelId, error: 'URL 조회 실패' }); continue; }
      console.log(`  AS-IS: ${urls.asis}`);
      console.log(`  TO-BE: ${urls.tobe}`);

      const [asisData, tobeData] = await Promise.all([
        auditPage(context, urls.asis, 'AS-IS'),
        auditPage(context, urls.tobe, 'TO-BE'),
      ]);

      const analysis = analyze(asisData, tobeData);
      results.push({ modelId, urls, asis: asisData, tobe: tobeData, analysis });

      console.log(`  ✅ Critical: ${analysis.critical} | Warning: ${analysis.warning} | OK: ${analysis.ok}`);
      if (analysis.criticalItems.length) {
        analysis.criticalItems.slice(0, 5).forEach(i => console.log(`     🚨 ${i.group} — ${i.key}`));
        if (analysis.criticalItems.length > 5) console.log(`     +${analysis.criticalItems.length - 5}건 더`);
      }
    } catch (e) {
      console.log(`  ❌ 오류: ${e.message}`);
      results.push({ modelId, error: e.message });
    }
    console.log('');
  }

  await browser.close();

  // Output
  if (outFile) {
    const ext = path.extname(outFile);
    if (ext === '.json') {
      fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
    } else if (ext === '.csv') {
      let csv = 'Model,Critical,Warning,OK,Top Issues\n';
      results.forEach(r => {
        if (r.error) { csv += `${r.modelId},ERROR,,,${r.error}\n`; return; }
        const a = r.analysis;
        const top = a.criticalItems.slice(0, 3).map(i => i.group + ':' + i.key).join('; ');
        csv += `${r.modelId},${a.critical},${a.warning},${a.ok},"${top}"\n`;
      });
      fs.writeFileSync(outFile, csv);
    } else {
      fs.writeFileSync(outFile, generateHTMLReport(results));
    }
    console.log(`📄 Report saved: ${outFile}`);
  }

  // Summary
  const totalCrit = results.reduce((s, r) => s + (r.analysis?.critical || 0), 0);
  console.log(`══════════════════════════════`);
  console.log(`총 ${models.length}개 모델 감사 완료`);
  console.log(`총 Critical: ${totalCrit}건`);
  if (totalCrit > 0) process.exit(1);
}

async function getUrls(modelId, pdpType) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/models/${modelId}?pageType=${pdpType}`);
    const json = await res.json();
    const d = json.data;
    if (!d?.category?.categoryUrlPath || !d?.modelInfo?.modelName) return null;
    const asisPath = d.category.categoryUrlPath + '/' + d.modelInfo.modelName.toLowerCase();
    const tobeUrl = pdpType === 'SUBSCRIPTION'
      ? `${BASE}/model?modelId=${modelId}&pdpType=SUBSCRIPTION`
      : `${BASE}/model?modelId=${modelId}`;
    return { asis: BASE + asisPath, tobe: tobeUrl };
  } catch (e) { return null; }
}

async function auditPage(context, url, label) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    // Inject audit functions then call
    await page.addScriptTag({ content: AUDIT_JS });
    const data = await page.evaluate(() => runAudit());
    return data;
  } catch (e) {
    console.log(`  ⚠ ${label} 로드 실패: ${e.message}`);
    return null;
  } finally {
    await page.close();
  }
}

function analyze(asis, tobe) {
  if (!asis || !tobe) return { critical: 0, warning: 0, ok: 0, criticalItems: [], items: [] };
  const items = [];

  // SEO
  const seoCheck = [
    ['title', 'crit'], ['metaDescription', 'crit'], ['canonical', 'crit'], ['robots', 'warn']
  ];
  seoCheck.forEach(([k, sev]) => {
    const av = asis.seo[k], tv = tobe.seo[k];
    items.push({ group: 'SEO', key: k, sev: (av && !tv) ? sev : 'ok' });
  });
  ['og:title', 'og:description', 'og:image', 'og:url'].forEach(k => {
    const av = asis.seo.og[k], tv = tobe.seo.og[k];
    if (av && !tv) items.push({ group: 'SEO', key: k, sev: 'crit' });
  });

  // JSON-LD
  const aTypes = new Set(asis.jsonld.map(i => i.type));
  const tTypes = new Set(tobe.jsonld.map(i => i.type));
  aTypes.forEach(type => {
    if (!tTypes.has(type))
      items.push({ group: 'JSON-LD', key: type, sev: (type === 'Product' || type === 'BreadcrumbList') ? 'crit' : 'warn' });
  });

  // Sections
  const aSecs = new Set(asis.sections.filter(s => s.title).map(s => s.title.toLowerCase()));
  const tSecs = new Set(tobe.sections.filter(s => s.title).map(s => s.title.toLowerCase()));
  aSecs.forEach(s => { if (!tSecs.has(s)) items.push({ group: '섹션', key: s, sev: 'crit' }); });

  // Media
  if (tobe.media.altMissingRate > 50) items.push({ group: '미디어', key: 'alt누락 ' + tobe.media.altMissingRate + '%', sev: 'crit' });
  else if (tobe.media.altMissingRate > 20) items.push({ group: '미디어', key: 'alt누락 ' + tobe.media.altMissingRate + '%', sev: 'warn' });

  // Headings
  const aH = new Set(asis.headings.map(h => h.text.toLowerCase()));
  const tH = new Set(tobe.headings.map(h => h.text.toLowerCase()));
  let hMiss = 0;
  aH.forEach(h => { if (!tH.has(h)) hMiss++; });
  if (hMiss > 5) items.push({ group: '헤딩', key: hMiss + '개 누락', sev: 'warn' });

  // Specs
  const aKeys = Object.keys(asis.specs || {});
  const tKeys = new Set(Object.keys(tobe.specs || {}));
  let specMiss = 0;
  aKeys.forEach(k => { if (!tKeys.has(k)) specMiss++; });
  if (specMiss > 0) items.push({ group: '스펙', key: specMiss + '개 키 누락', sev: 'warn' });

  const critical = items.filter(i => i.sev === 'crit').length;
  const warning = items.filter(i => i.sev === 'warn').length;
  const ok = items.filter(i => i.sev === 'ok').length;
  return { critical, warning, ok, criticalItems: items.filter(i => i.sev === 'crit'), items };
}

function generateHTMLReport(results) {
  let rows = '';
  results.forEach(r => {
    if (r.error) {
      rows += `<tr><td>${r.modelId}</td><td colspan="4" style="color:#f87171">ERROR: ${r.error}</td></tr>`;
      return;
    }
    const a = r.analysis;
    const issues = a.criticalItems.map(i => `<span style="color:#f87171">${i.group}: ${i.key}</span>`).join('<br>');
    rows += `<tr>
      <td><b>${r.modelId}</b></td>
      <td style="color:#ef4444;font-weight:700">${a.critical}</td>
      <td style="color:#fbbf24">${a.warning}</td>
      <td style="color:#34d399">${a.ok}</td>
      <td style="font-size:11px">${issues || '-'}</td>
    </tr>`;
  });

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PDP Audit Report</title>
<style>
body{font-family:system-ui;background:#0f1419;color:#e2e8f0;padding:30px;font-size:13px;}
h1{color:#6ee7b7;font-size:20px;margin-bottom:4px;}
.meta{color:#64748b;font-size:11px;margin-bottom:20px;}
table{width:100%;border-collapse:collapse;background:#161d27;border-radius:8px;overflow:hidden;}
th{background:#1e2a38;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#64748b;}
td{padding:8px 12px;border-bottom:1px solid #1e2a38;vertical-align:top;}
tr:hover{background:#1e2a38;}
.summary{display:flex;gap:16px;margin-bottom:24px;}
.scard{flex:1;text-align:center;padding:20px;border-radius:10px;font-weight:700;}
.scard .n{font-size:32px;}.scard .l{font-size:10px;text-transform:uppercase;margin-top:4px;}
.sc{background:rgba(239,68,68,.12);color:#ef4444;border:1px solid rgba(239,68,68,.25);}
.sw{background:rgba(251,191,36,.12);color:#fbbf24;border:1px solid rgba(251,191,36,.25);}
.so{background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.25);}
</style></head><body>
<h1>PDP Audit Report</h1>
<div class="meta">Generated: ${new Date().toLocaleString()} | Models: ${results.length}</div>
<div class="summary">
  <div class="scard sc"><div class="n">${results.reduce((s, r) => s + (r.analysis?.critical || 0), 0)}</div><div class="l">Critical</div></div>
  <div class="scard sw"><div class="n">${results.reduce((s, r) => s + (r.analysis?.warning || 0), 0)}</div><div class="l">Warning</div></div>
  <div class="scard so"><div class="n">${results.reduce((s, r) => s + (r.analysis?.ok || 0), 0)}</div><div class="l">OK</div></div>
</div>
<table><thead><tr><th>Model</th><th>Critical</th><th>Warning</th><th>OK</th><th>Critical Issues</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
}

main().catch(e => { console.error(e); process.exit(1); });
