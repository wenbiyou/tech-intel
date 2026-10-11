#!/usr/bin/env node
/**
 * gen-intel-dashboard.mjs — 情报数据大屏生成器（纯 node 零依赖）
 *
 * 数据流：memory/intel/daily/YYYY-MM.md（唯一事实源）+ daily/YYYY-MM.jsonl（digest 同步写的结构化层）
 *   → 解析合并（按 date+url 去重，md 为骨架、jsonl 补充 source/star）
 *   → 回写校准后的 daily/YYYY-MM.jsonl（派生缓存，可随时从 md 重建）
 *   → 产出 dashboard/index.html + dashboard/data/index.json + dashboard/data/monthly/YYYY-MM.json
 *
 * 用法：node gen-intel-dashboard.mjs [--root <intel目录>] [--quiet]
 * 退出码：0 成功；1 无数据/写失败。stdout 尾行：DASH ok <条目数>条 <月份数>月 | DASH failed <原因>
 */
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const quiet = args.includes('--quiet')
const rootFlagIdx = args.indexOf('--root')
const ROOT = rootFlagIdx > -1 ? args[rootFlagIdx + 1] : '/home/by-admin/tech-intel/memory/intel'
const DAILY = path.join(ROOT, 'daily')
const OUT = path.join(ROOT, 'dashboard')
const OUT_DATA = path.join(OUT, 'data')
const OUT_MONTHLY = path.join(OUT_DATA, 'monthly')

const die = (msg) => { console.error(`DASH failed ${msg}`); process.exit(1) }
const log = (msg) => { if (!quiet) console.log(msg) }

// ---------- 分类归一化 ----------
const CAT_KEY = { 'AI/大模型': 'ai', '机器人': 'robot', '科技行业': 'industry', '开源/开发': 'dev' }
const CAT_LABEL = { ai: 'AI/大模型', robot: '机器人', industry: '科技行业', dev: '开源/开发', milpol: '军事/政策/商业', other: '其他' }
const ACTION_SET = new Set(['act', 'watch', 'archive']) // 消费率数据源（2026-09-27 起 digest 任务写入）
function normCat(raw) {
  if (CAT_KEY[raw]) return CAT_KEY[raw]
  if (/军事|政策|商业/.test(raw)) return 'milpol'
  return 'other'
}

// ---------- md 解析 ----------
function parseMonthFile(file) {
  const month = path.basename(file, '.md') // YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(month)) return []
  const text = fs.readFileSync(file, 'utf8')
  const days = []
  let curDay = null, curCat = null, curIssue = 1
  const pushDay = () => { if (curDay && curDay.entries.length) days.push(curDay) }
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    let m
    if ((m = line.match(/^## (\d{2})-(\d{2})\s*(周.)?/))) {
      pushDay()
      curDay = { date: `${month}-${m[2]}`, dateMD: `${m[1]}-${m[2]}`, weekday: m[3] || '', issue: 1, entries: [], focus: '' }
      curIssue = 1; curCat = null
      continue
    }
    if (!curDay) continue
    if (/^### 增刊/.test(line)) { curIssue++; curDay.issue = Math.max(curDay.issue, curIssue); curCat = null; continue }
    if ((m = line.match(/^【(.+?)】\s*$/))) { curCat = normCat(m[1]); continue }
    if ((m = line.match(/^【(.+?)】\s*(.+)/)) && !line.startsWith('- ')) { curCat = normCat(m[1]); continue }
    if (/^⭐/.test(line)) { curDay.focus = line.replace(/^⭐\s*值得关注[（(]?[^：)）]*[)）]?[：:]?/, '').trim() || line.replace(/^⭐\s*/, '').trim(); continue }
    if ((m = line.match(/^- (.+)$/))) {
      let body = m[1]
      let cat = curCat || 'other'
      const inline = body.match(/^【(.+?)】\s*/)
      if (inline) { cat = normCat(inline[1]); body = body.slice(inline[0].length) } // 周末合集条目自带内联分类
      const urlM = body.match(/(https?:\/\/[^\s）)]+)\s*$/) || body.match(/https?:\/\/[^\s）)]+/)
      if (!urlM) continue // 「本类今日平淡」等无链接行不计条目
      const url = urlM[1]
      const head = body.slice(0, urlM.index).trim().replace(/[—–-]+\s*$/, '').trim()
      const dashIdx = head.indexOf('——')
      const title = dashIdx > 0 ? head.slice(0, dashIdx).trim() : head
      const summary = dashIdx > 0 ? head.slice(dashIdx + 2).trim() : ''
      curDay.entries.push({ date: curDay.date, issue: curIssue, category: cat, title, summary, url, source: '', star: false })
    }
  }
  pushDay()
  return days
}

// ---------- jsonl 读取/合并/回写 ----------
function readJsonl(file) {
  if (!fs.existsSync(file)) return []
  const out = []
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t) continue
    try { out.push(JSON.parse(t)) } catch { /* 跳过坏行 */ }
  }
  return out
}
function mergeJsonl(days, file) {
  const extra = readJsonl(file)
  if (!extra.length) return days
  const byKey = new Map()
  for (const d of days) for (const e of d.entries) byKey.set(`${e.date}|${e.url}`, e)
  for (const r of extra) {
    const k = `${r.date}|${r.url}`
    if (byKey.has(k)) {
      const e = byKey.get(k)
      if (r.source) e.source = r.source
      if (r.star) e.star = true
      if (ACTION_SET.has(r.action)) e.action = r.action
      // category 以 md 解析为准；仅当 md 归为 other 且 jsonl 有明确分类时采纳 jsonl
      if (e.category === 'other' && r.category && r.category !== 'other' && CAT_LABEL[r.category]) e.category = r.category
    } else if (r.date && r.url && r.title) {
      // jsonl 独有（md 解析漏检时兜底）
      const day = days.find(d => d.date === r.date)
      const entry = { date: r.date, issue: r.issue || 1, category: CAT_LABEL[r.category] ? r.category : normCat(r.category || ''), title: r.title, summary: r.summary || '', url: r.url, source: r.source || '', star: !!r.star, action: ACTION_SET.has(r.action) ? r.action : undefined }
      if (day) day.entries.push(entry)
      else days.push({ date: r.date, dateMD: r.date.slice(5), weekday: '', issue: 1, entries: [entry], focus: '' })
    }
  }
  return days
}
function writeJsonl(days, file) {
  const rows = []
  for (const d of days.slice().sort((a, b) => a.date.localeCompare(b.date)))
    for (const e of d.entries) {
      const row = { date: e.date, issue: e.issue, category: e.category, title: e.title, summary: e.summary.slice(0, 500), url: e.url, source: e.source, star: e.star }
      if (ACTION_SET.has(e.action)) row.action = e.action // 回写保留 action，防丢失
      rows.push(JSON.stringify(row))
    }
  fs.writeFileSync(file, rows.join('\n') + (rows.length ? '\n' : ''))
  return rows.length
}

// ---------- 主流程 ----------
const monthFiles = fs.readdirSync(DAILY).filter(f => /^\d{4}-\d{2}\.md$/.test(f)).sort()
if (!monthFiles.length) die('no monthly archive found')
let allDays = []
for (const f of monthFiles) {
  let days = parseMonthFile(path.join(DAILY, f))
  days = mergeJsonl(days, path.join(DAILY, f.replace('.md', '.jsonl')))
  days.sort((a, b) => a.date.localeCompare(b.date))
  allDays = allDays.concat(days)
}
if (!allDays.length) die('no entries parsed')

// 回写校准后的 jsonl（按月）
let jsonlTotal = 0
for (const f of monthFiles) {
  const month = path.basename(f, '.md')
  const monthDays = allDays.filter(d => d.date.startsWith(month))
  jsonlTotal += writeJsonl(monthDays, path.join(DAILY, `${month}.jsonl`))
}

// insights 列表
const insightsDir = path.join(ROOT, 'insights')
const insights = fs.existsSync(insightsDir)
  ? fs.readdirSync(insightsDir).filter(f => f.endsWith('.md')).map(f => {
      const stat = fs.statSync(path.join(insightsDir, f))
      const title = (fs.readFileSync(path.join(insightsDir, f), 'utf8').split('\n').find(l => l.startsWith('# ')) || `# ${f}`).replace(/^#\s*/, '')
      return { file: f, title, date: f.match(/\d{4}-\d{2}-\d{2}/)?.[0] || stat.mtime.toISOString().slice(0, 10) || '', size: stat.size }
    }).sort((a, b) => b.date.localeCompare(a.date))
  : []

// 统计
const totalEntries = allDays.reduce((s, d) => s + d.entries.length, 0)
const now = new Date()
const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString().slice(0, 10)
const in7 = allDays.filter(d => d.date >= daysAgo(6)).reduce((s, d) => s + d.entries.length, 0) /* F52 修正 2026-10-09：7 日历日窗口（今-6..今），原 daysAgo(7) 实为 8 天窗口（含今日+前7天），与页面重算口径差一天 */
const in30 = allDays.filter(d => d.date >= daysAgo(29)).reduce((s, d) => s + d.entries.length, 0) /* F52 同型修正 2026-10-11：30 日历日窗口（今-29..今），原 daysAgo(30) 实为 31 天窗口（含今日+前30天），与 last7 修正同型（夜学棒9） */
const byCat = {}
for (const d of allDays) for (const e of d.entries) byCat[e.category] = (byCat[e.category] || 0) + 1

// 产出目录
fs.mkdirSync(OUT_MONTHLY, { recursive: true })

// ---------- 消费与转化数据（2026-09-27 新增：act 标注 + 周同步 + 学习链条） ----------
const actionStats = { act: 0, watch: 0, archive: 0, untagged: 0, byMonth: {} }
const actList = []
for (const d of allDays) {
  const month = d.date.slice(0, 7)
  if (!actionStats.byMonth[month]) actionStats.byMonth[month] = { act: 0, watch: 0, archive: 0, untagged: 0 }
  for (const e of d.entries) {
    const a = ACTION_SET.has(e.action) ? e.action : 'untagged'
    actionStats[a]++
    actionStats.byMonth[month][a]++
    if (a === 'act') actList.push({ date: e.date, title: e.title, url: e.url })
  }
}
const tagged = actionStats.act + actionStats.watch + actionStats.archive
// 周同步桥文件（weekly-sync/YYYY-Www.md）
const syncDir = path.join(ROOT, 'weekly-sync')
const weeklySync = { count: 0, latest: null }
if (fs.existsSync(syncDir)) {
  const wsFiles = fs.readdirSync(syncDir).filter(f => /^\d{4}-W\d{2}\.md$/.test(f)).sort()
  weeklySync.count = wsFiles.length
  if (wsFiles.length) weeklySync.latest = { week: wsFiles[wsFiles.length - 1].replace('.md', '') }
}
// 学习链条（来自月度趋势任务的 insights/YYYY-MM-metrics.json，存在则采用）
const learning = { months: {}, latest: null }
if (fs.existsSync(insightsDir)) {
  for (const mf of fs.readdirSync(insightsDir).filter(f => /^\d{4}-\d{2}-metrics\.json$/.test(f)).sort()) {
    try {
      const mObj = JSON.parse(fs.readFileSync(path.join(insightsDir, mf), 'utf8'))
      const mKey = mf.replace('-metrics.json', '')
      learning.months[mKey] = mObj
      learning.latest = mKey
    } catch { /* 坏文件跳过 */ }
  }
}
const conversion = {
  generatedAt: now.toISOString(),
  mechanismSince: '2026-09-27',
  action: { tagged, act: actionStats.act, watch: actionStats.watch, archive: actionStats.archive, untagged: actionStats.untagged, actRate: tagged ? +(actionStats.act / tagged * 100).toFixed(1) : null, byMonth: actionStats.byMonth },
  actList: actList.slice(-20),
  weeklySync,
  learning
}
fs.writeFileSync(path.join(OUT_DATA, 'conversion.json'), JSON.stringify(conversion))

// 月度数据文件
let writtenMonths = 0
for (const f of monthFiles) {
  const month = path.basename(f, '.md')
  const monthDays = allDays.filter(d => d.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date))
  fs.writeFileSync(path.join(OUT_MONTHLY, `${month}.json`), JSON.stringify({ month, days: monthDays }))
  writtenMonths++
}
// 清理孤儿月度文件
for (const f of fs.readdirSync(OUT_MONTHLY)) {
  const m = f.replace('.json', '')
  if (!monthFiles.includes(`${m}.md`)) fs.unlinkSync(path.join(OUT_MONTHLY, f))
}

const dayIndex = allDays.slice().sort((a, b) => b.date.localeCompare(a.date)).map(d => ({
  date: d.date, weekday: d.weekday, count: d.entries.length, issue: d.issue,
  cats: [...new Set(d.entries.map(e => e.category))], hasFocus: !!d.focus
}))
const index = {
  generatedAt: now.toISOString(),
  totals: { entries: totalEntries, days: allDays.length, months: monthFiles.length, last7: in7, last30: in30, focus: dayIndex.filter(d => d.hasFocus).length, insights: insights.length },
  byCategory: byCat,
  catLabels: CAT_LABEL,
  months: monthFiles.map(f => f.replace('.md', '')),
  insights,
  days: dayIndex
}
fs.writeFileSync(path.join(OUT_DATA, 'index.json'), JSON.stringify(index))

// ---------- 面板页面 ----------
const page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>科技情报大屏 · tech-intel</title>
<style>
:root{--bg:#0f1115;--card:#171a21;--card2:#1d212b;--border:#2a2f3a;--text:#e2e6ee;--muted:#8b93a5;--accent:#4f8cff;--star:#f5b544;--ai:#4f8cff;--robot:#3ecf8e;--industry:#c084fc;--dev:#38bdf8;--milpol:#f87171;--other:#8b93a5}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font:14px/1.6 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;padding:24px;max-width:1080px;margin:0 auto}
h1{font-size:20px;margin-bottom:4px}
.sub{color:var(--muted);font-size:12px;margin-bottom:20px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px}
.stat{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 16px}
.stat .v{font-size:24px;font-weight:700}
.stat .k{color:var(--muted);font-size:12px;margin-top:2px}
.catbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;align-items:center}
.chip{border:1px solid var(--border);background:var(--card);color:var(--muted);border-radius:999px;padding:4px 12px;font-size:12px;cursor:pointer;user-select:none}
.chip.on{color:var(--text);border-color:var(--accent);background:rgba(79,140,255,.12)}
.chip .n{opacity:.7;margin-left:4px}
.day{background:var(--card);border:1px solid var(--border);border-radius:12px;margin-bottom:10px;overflow:hidden}
.day-h{display:flex;align-items:center;gap:10px;padding:12px 16px;cursor:pointer}
.day-h:hover{background:var(--card2)}
.day-h .d{font-weight:700;min-width:150px}
.day-h .w{color:var(--muted);font-size:12px}
.day-h .cnt{color:var(--muted);font-size:12px;margin-left:auto}
.day-h .arrow{color:var(--muted);transition:transform .15s}
.day.open .arrow{transform:rotate(90deg)}
.day-b{display:none;padding:4px 16px 14px;border-top:1px solid var(--border)}
.day.open .day-b{display:block}
.entry{padding:8px 0;border-bottom:1px dashed var(--border)}
.entry:last-child{border-bottom:none}
.entry .t{font-weight:600}
.entry .s{color:var(--muted);font-size:13px;margin-top:2px}
.entry a{color:var(--accent);text-decoration:none;font-size:12px}
.entry a:hover{text-decoration:underline}
.tag{display:inline-block;font-size:11px;border-radius:4px;padding:1px 7px;margin-right:8px;vertical-align:1px;background:rgba(255,255,255,.06);color:var(--muted)}
.tag.ai{color:var(--ai)} .tag.robot{color:var(--robot)} .tag.industry{color:var(--industry)} .tag.dev{color:var(--dev)} .tag.milpol{color:var(--milpol)}
.focus{margin-top:10px;background:rgba(245,181,68,.08);border:1px solid rgba(245,181,68,.25);border-radius:8px;padding:10px 12px;font-size:13px}
.focus b{color:var(--star)}
.insights{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:18px}
.insights h2{font-size:14px;margin-bottom:8px}
.insights li{margin:4px 0 4px 18px;color:var(--muted);font-size:13px}
.loading,.empty{color:var(--muted);text-align:center;padding:40px 0}
</style>
</head>
<body>
<h1>🛰️ 科技情报大屏</h1>
<div class="sub" id="gen-at">加载中…</div>
<div class="stats" id="stats"></div>
<div class="catbar" id="catbar"></div>
<div id="list"><div class="loading">加载中…</div></div>
<script>
let IDX=null, MONTH_CACHE={}, activeCat=null;
const CAT_LABEL=${JSON.stringify(CAT_LABEL)};
const CAT_ORDER=['ai','robot','industry','dev','milpol','other'];
function esc(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
async function j(url){const r=await fetch(url);if(!r.ok)throw new Error(url);return r.json()}
async function loadMonth(m){if(!MONTH_CACHE[m])MONTH_CACHE[m]=await j('data/monthly/'+m+'.json');return MONTH_CACHE[m]}
async function loadAllMonths(){for(const m of IDX.months)await loadMonth(m)}
function renderStats(){
  const t=IDX.totals;
  document.getElementById('gen-at').textContent='生成于 '+new Date(IDX.generatedAt).toLocaleString('zh-CN',{hour12:false})+' · 数据源 tech-intel/memory/intel';
  document.getElementById('stats').innerHTML=[
    ['情报总条数',t.entries],['覆盖天数',t.days],['近7天',t.last7],['近30天',t.last30],['⭐ 重点点评',t.focus],['专题报告',t.insights]
  ].map(([k,v])=>'<div class="stat"><div class="v">'+v+'</div><div class="k">'+k+'</div></div>').join('');
  const bars=CAT_ORDER.filter(c=>IDX.byCategory[c]).map(c=>{
    const n=IDX.byCategory[c],pct=Math.round(n/t.entries*100);
    return '<span class="chip" data-cat="'+c+'">'+CAT_LABEL[c]+'<span class="n">'+n+' · '+pct+'%</span></span>';
  }).join('');
  document.getElementById('catbar').innerHTML='<span style="color:var(--muted);font-size:12px;margin-right:4px">分类筛选</span>'+bars;
  document.getElementById('catbar').querySelectorAll('.chip').forEach(ch=>ch.onclick=()=>toggleCat(ch.dataset.cat));
}
function toggleCat(c){
  activeCat=(activeCat===c)?null:c;
  document.getElementById('catbar').querySelectorAll('.chip').forEach(ch=>ch.classList.toggle('on',ch.dataset.cat===activeCat));
  renderList();
}
function entryHtml(e){
  if(activeCat&&e.category!==activeCat)return '';
  return '<div class="entry"><span class="tag '+e.category+'">'+(CAT_LABEL[e.category]||e.category)+'</span>'
    +'<span class="t">'+esc(e.title)+'</span>'
    +(e.summary?'<div class="s">'+esc(e.summary)+'</div>':'')
    +'<a href="'+esc(e.url)+'" target="_blank" rel="noopener noreferrer">'+esc(shortUrl(e.url))+' ↗</a></div>';
}
function shortUrl(u){try{const x=new URL(u);return x.hostname.replace(/^www\./,'')}catch{return u}}
async function renderList(){
  const el=document.getElementById('list');
  if(activeCat){ await loadAllMonths(); }
  const months=activeCat?IDX.months:[IDX.months[IDX.months.length-1]].filter(Boolean);
  let html='';
  for(const m of months){
    const data=await loadMonth(m);
    for(const d of data.days){
      if(activeCat && !d.entries.some(e=>e.category===activeCat))continue;
      const entries=d.entries.map(entryHtml).join('');
      html+='<div class="day" data-date="'+d.date+'"><div class="day-h">'
        +'<span class="d">'+d.date.slice(5)+' <span class="w">'+esc(d.weekday)+'</span></span>'
        +(d.issue>1?'<span class="w">增刊×'+d.issue+'</span>':'')
        +(d.hasFocus?'<span style="color:var(--star);font-size:12px">⭐</span>':'')
        +'<span class="cnt">'+d.entries.length+' 条</span><span class="arrow">▶</span></div>'
        +'<div class="day-b">'+entries
        +(d.focus?'<div class="focus"><b>⭐ 值得关注</b>　'+esc(d.focus)+'</div>':'')
        +'</div></div>';
    }
  }
  el.innerHTML=html||'<div class="empty">无匹配条目</div>';
  el.querySelectorAll('.day-h').forEach(h=>h.onclick=()=>h.parentElement.classList.toggle('open'));
}
function renderInsights(){
  if(!IDX.insights.length)return;
  const box=document.createElement('div');box.className='insights';
  box.innerHTML='<h2>📂 专题报告（L3 资产）</h2><ul>'+IDX.insights.map(i=>'<li>'+esc(i.date)+' · '+esc(i.title)+'（'+Math.round(i.size/1024)+' KB）</li>').join('')+'</ul>';
  document.getElementById('catbar').after(box);
}
(async function(){
  try{
    IDX=await j('data/index.json');
    renderStats();renderInsights();renderList();
  }catch(e){
    document.getElementById('list').innerHTML='<div class="empty">数据加载失败：'+esc(e.message)+'（请先运行 gen-intel-dashboard.mjs）</div>';
  }
})();
</script>
</body>
</html>`
// index.html 为设计资产（ui-designer 2026-09-27 重设计版）：已存在则不覆盖，仅首次部署时用内置模板兜底
const pagePath = path.join(OUT, 'index.html')
if (fs.existsSync(pagePath)) log('index.html 已存在（设计资产），跳过模板写入')
else fs.writeFileSync(pagePath, page)

log(`DASH ok ${totalEntries}条 ${writtenMonths}月 jsonl回写${jsonlTotal}行 insights${insights.length}篇 act标注${tagged}(act=${actionStats.act}) 周同步${weeklySync.count}期`)
console.log(`DASH ok ${totalEntries} entries, ${writtenMonths} months -> ${OUT}`)
