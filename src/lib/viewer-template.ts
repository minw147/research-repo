export interface ViewerConfig {
  title?: string;
  subtitle?: string;
  /** When provided, data is inlined into the HTML so it works via file:// without a server. */
  data?: object[];
}

export function generateViewerHtml(config?: ViewerConfig): string {
  const title = config?.title ?? "Research Repository";
  const subtitle = config?.subtitle ?? "Published UX research studies";
  const inlineData = config?.data ?? null;

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #f8f7f5;
  color: #0f172a;
  min-height: 100vh;
}

header {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 1.5rem 2rem;
}

header h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

header p {
  color: #475569;
  font-size: 0.875rem;
}

.tabs {
  display: flex;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 2rem;
}

.tab-btn {
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 0.9375rem;
  font-weight: 500;
  font-family: inherit;
  color: #64748b;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
}

.tab-btn.active { color: #0f172a; border-bottom-color: #f59f0a; }
.tab-btn:hover:not(.active) { color: #0f172a; }
.tab-panel { display: none; }
.tab-panel.active { display: block; }

.toolbar {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-wrap input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  background: #f8f7f5;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s;
}

.search-wrap input:focus {
  border-color: #f59f0a;
}

select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  background: #f8f7f5;
  color: #0f172a;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
}

select:focus {
  border-color: #f59f0a;
}

.btn-clear {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  color: #475569;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.btn-clear:hover {
  background: #f8f7f5;
  color: #0f172a;
}

.status-bar {
  padding: 0.75rem 2rem;
  color: #64748b;
  font-size: 0.8125rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
  padding: 1.25rem 2rem 2rem;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: box-shadow 0.15s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.card h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.meta-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8125rem;
  align-items: baseline;
}

.label {
  color: #64748b;
  font-weight: 500;
  min-width: 5rem;
  flex-shrink: 0;
}

.meta-row span:last-child {
  color: #475569;
}

.btn-primary {
  display: inline-block;
  margin-top: auto;
  padding: 0.5rem 1rem;
  background: #f59f0a;
  color: #ffffff;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  text-align: center;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: #d97706;
}

.empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #64748b;
  padding: 3rem 1rem;
  font-size: 0.9375rem;
}

/* Tag board */
.tag-pill {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #ffffff;
  line-height: 1.5;
}

.quote-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
  padding: 1.25rem 2rem 2rem;
}

.quote-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s;
}

.quote-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

.clip-video {
  width: 100%;
  display: block;
  background: #0f172a;
  max-height: 200px;
  object-fit: contain;
}

.quote-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  flex: 1;
}

.quote-text {
  font-size: 0.9375rem;
  font-style: italic;
  color: #0f172a;
  line-height: 1.5;
}

.quote-tags { display: flex; flex-wrap: wrap; gap: 0.375rem; }

.quote-meta {
  font-size: 0.8125rem;
  color: #64748b;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: auto;
  padding-top: 0.5rem;
}

.tb-status { padding: 0.75rem 2rem; color: #64748b; font-size: 0.8125rem; }
.tb-empty { text-align: center; color: #64748b; padding: 3rem 1rem; font-size: 0.9375rem; grid-column: 1/-1; }
`.trim();

  const inlineDataScript = inlineData !== null
    ? `const INLINE_DATA = ${JSON.stringify(inlineData)};`
    : `const INLINE_DATA = null;`;

  const js = `
const PRIMARY = '#f59f0a';
let all = [];

async function loadProjects() {
  // Always try to fetch live data first (works over HTTP/SharePoint URLs).
  // Fall back to inlined snapshot only if fetch fails (e.g. file:// protocol).
  try {
    const res = await fetch('repo-index.json');
    if (res.ok) {
      all = await res.json();
      populateSelects();
      applyFilters();
      populateTagBoard();
      return;
    }
  } catch(e) {
    // fetch blocked (file:// protocol) or network error — use inline data below
  }
  if (INLINE_DATA !== null) {
    all = INLINE_DATA;
    populateSelects();
    applyFilters();
    populateTagBoard();
  } else {
    document.getElementById('project-grid').innerHTML =
      '<div class="empty">Failed to load projects.</div>';
  }
}

function populateSelects() {
  ['researcher','persona','product'].forEach(key => {
    const sel = document.getElementById('f-' + key);
    const vals = [...new Set(all.map(p => p[key]).filter(Boolean))].sort();
    vals.forEach(v => {
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      sel.appendChild(o);
    });
  });
}

function applyFilters() {
  const q = document.getElementById('search').value.toLowerCase();
  const researcher = document.getElementById('f-researcher').value;
  const persona = document.getElementById('f-persona').value;
  const product = document.getElementById('f-product').value;
  const sort = document.getElementById('f-sort').value;

  let result = all.filter(p => {
    if (q && !['title','researcher','persona','product'].some(k => (p[k]||'').toLowerCase().includes(q))) return false;
    if (researcher !== 'all' && p.researcher !== researcher) return false;
    if (persona !== 'all' && p.persona !== persona) return false;
    if (product !== 'all' && p.product !== product) return false;
    return true;
  });

  result.sort((a, b) => {
    if (sort === 'date-desc') return (b.date||'').localeCompare(a.date||'');
    if (sort === 'date-asc') return (a.date||'').localeCompare(b.date||'');
    return (a.title||'').localeCompare(b.title||'');
  });

  document.getElementById('count').textContent = result.length + ' ' + (result.length === 1 ? 'study' : 'studies');
  renderProjects(result);
}

function renderProjects(projects) {
  const grid = document.getElementById('project-grid');
  if (!projects.length) {
    grid.innerHTML = '<div class="empty">No studies match your filters.</div>';
    return;
  }
  grid.innerHTML = projects.map(p => \`
    <div class="card">
      <h2>\${escHtml(p.title || 'Untitled')}</h2>
      <div class="meta">
        \${p.researcher ? '<div class="meta-row"><span class="label">Researcher</span><span>' + escHtml(p.researcher) + '</span></div>' : ''}
        \${p.persona ? '<div class="meta-row"><span class="label">Persona</span><span>' + escHtml(p.persona) + '</span></div>' : ''}
        \${p.product ? '<div class="meta-row"><span class="label">Product</span><span>' + escHtml(p.product) + '</span></div>' : ''}
        \${p.date ? '<div class="meta-row"><span class="label">Date</span><span>' + escHtml(p.date) + '</span></div>' : ''}
      </div>
      \${p.findingsHtml ? '<a class="btn-primary" href="' + escAttr(p.findingsHtml) + '" target="_blank" rel="noopener">View Report</a>' : ''}
    </div>
  \`).join('');
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function clearFilters() {
  document.getElementById('search').value = '';
  ['f-researcher','f-persona','f-product'].forEach(id => document.getElementById(id).value = 'all');
  document.getElementById('f-sort').value = 'date-desc';
  applyFilters();
}

// ---- Tag Board ----

function switchTab(name) {
  ['projects','tagboard'].forEach(n => {
    document.getElementById('tab-' + n).classList.toggle('active', n === name);
    document.getElementById('panel-' + n).classList.toggle('active', n === name);
  });
  if (name === 'tagboard') renderTagBoard();
}

function buildTagIndex() {
  const quotes = [];
  const codebookMap = {};
  for (const p of all) {
    if (!p.quotes) continue;
    for (const q of p.quotes) {
      quotes.push({ ...q, projectId: p.id, projectTitle: p.title,
        researcher: p.researcher, persona: p.persona, product: p.product });
    }
    if (p.codebook) {
      for (const tag of p.codebook) codebookMap[tag.id] = tag;
    }
  }
  return { quotes, codebookMap };
}

function populateTagBoard() {
  const { codebookMap } = buildTagIndex();
  const tagSel = document.getElementById('tb-tag');
  while (tagSel.options.length > 1) tagSel.remove(1);
  Object.values(codebookMap).sort((a, b) => a.label.localeCompare(b.label)).forEach(tag => {
    const o = document.createElement('option');
    o.value = tag.id; o.textContent = tag.label;
    tagSel.appendChild(o);
  });
  [['tb-project', [...new Set(all.map(p => p.id))].map(id => ({ v: id, t: (all.find(p=>p.id===id)||{}).title||id }))],
   ['tb-persona', [...new Set(all.map(p => p.persona).filter(Boolean))].sort().map(v=>({v,t:v}))],
   ['tb-product', [...new Set(all.map(p => p.product).filter(Boolean))].sort().map(v=>({v,t:v}))]
  ].forEach(([selId, items]) => {
    const sel = document.getElementById(selId);
    while (sel.options.length > 1) sel.remove(1);
    items.forEach(({v, t}) => { const o = document.createElement('option'); o.value=v; o.textContent=t; sel.appendChild(o); });
  });
}

function renderTagBoard() {
  const { quotes, codebookMap } = buildTagIndex();
  const q = document.getElementById('tb-search').value.toLowerCase();
  const activeTag = document.getElementById('tb-tag').value;
  const activeProject = document.getElementById('tb-project').value;
  const activePersona = document.getElementById('tb-persona').value;
  const activeProduct = document.getElementById('tb-product').value;

  const filtered = quotes.filter(qt => {
    if (q && !qt.text.toLowerCase().includes(q)) return false;
    if (activeTag !== 'all' && !qt.tags.includes(activeTag)) return false;
    if (activeProject !== 'all' && qt.projectId !== activeProject) return false;
    if (activePersona !== 'all' && qt.persona !== activePersona) return false;
    if (activeProduct !== 'all' && qt.product !== activeProduct) return false;
    return true;
  });

  document.getElementById('tb-count').textContent =
    filtered.length + ' ' + (filtered.length === 1 ? 'quote' : 'quotes');

  const grid = document.getElementById('quote-grid');
  if (!filtered.length) {
    grid.innerHTML = '<div class="tb-empty">No quotes match your filters.</div>';
    return;
  }

  grid.innerHTML = filtered.map(qt => {
    const clipSrc = qt.clipFile ? escAttr(qt.projectId + '/clips/' + qt.clipFile) : null;
    const tagPills = (qt.tags||[]).map(tagId => {
      const tag = codebookMap[tagId];
      if (!tag) return '';
      return \`<span class="tag-pill" style="background:\${escAttr(tag.color)}">\${escHtml(tag.label)}</span>\`;
    }).join('');
    return \`
      <div class="quote-card">
        \${clipSrc ? \`<video class="clip-video" controls preload="none"><source src="\${clipSrc}" type="video/mp4"></video>\` : ''}
        <div class="quote-body">
          <div class="quote-text">"\${escHtml(qt.text)}"</div>
          \${tagPills ? \`<div class="quote-tags">\${tagPills}</div>\` : ''}
          <div class="quote-meta">
            \${qt.projectTitle ? \`<span><strong>\${escHtml(qt.projectTitle)}</strong></span>\` : ''}
            \${qt.researcher ? \`<span>Researcher: \${escHtml(qt.researcher)}</span>\` : ''}
            \${qt.persona ? \`<span>Persona: \${escHtml(qt.persona)}</span>\` : ''}
            \${qt.product ? \`<span>Product: \${escHtml(qt.product)}</span>\` : ''}
            \${qt.timestampDisplay ? \`<span>\${escHtml(qt.timestampDisplay)}</span>\` : ''}
          </div>
        </div>
      </div>\`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search').addEventListener('input', applyFilters);
  document.getElementById('f-researcher').addEventListener('change', applyFilters);
  document.getElementById('f-persona').addEventListener('change', applyFilters);
  document.getElementById('f-product').addEventListener('change', applyFilters);
  document.getElementById('f-sort').addEventListener('change', applyFilters);
  document.getElementById('btn-clear').addEventListener('click', clearFilters);

  document.getElementById('tb-search').addEventListener('input', renderTagBoard);
  document.getElementById('tb-tag').addEventListener('change', renderTagBoard);
  document.getElementById('tb-project').addEventListener('change', renderTagBoard);
  document.getElementById('tb-persona').addEventListener('change', renderTagBoard);
  document.getElementById('tb-product').addEventListener('change', renderTagBoard);
  document.getElementById('tb-clear').addEventListener('click', () => {
    document.getElementById('tb-search').value = '';
    ['tb-tag','tb-project','tb-persona','tb-product'].forEach(id =>
      document.getElementById(id).value = 'all'
    );
    renderTagBoard();
  });

  loadProjects();
});
`.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtmlAttr(title)}</title>
  <style>
${css}
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtmlText(title)}</h1>
    <p>${escapeHtmlText(subtitle)}</p>
  </header>

  <div class="tabs">
    <button class="tab-btn active" id="tab-projects" onclick="switchTab('projects')">Projects</button>
    <button class="tab-btn" id="tab-tagboard" onclick="switchTab('tagboard')">Tag Board</button>
  </div>

  <!-- Projects panel -->
  <div class="tab-panel active" id="panel-projects">
    <div class="toolbar">
      <div class="search-wrap">
        <input type="search" id="search" placeholder="Search studies…" autocomplete="off">
      </div>
      <select id="f-researcher">
        <option value="all">All researchers</option>
      </select>
      <select id="f-persona">
        <option value="all">All personas</option>
      </select>
      <select id="f-product">
        <option value="all">All products</option>
      </select>
      <select id="f-sort">
        <option value="date-desc">Newest first</option>
        <option value="date-asc">Oldest first</option>
        <option value="title-asc">Title A–Z</option>
      </select>
      <button class="btn-clear" id="btn-clear">Clear filters</button>
    </div>
    <div class="status-bar"><span id="count">0 studies</span></div>
    <div class="grid" id="project-grid"><div class="empty">Loading studies…</div></div>
  </div>

  <!-- Tag Board panel -->
  <div class="tab-panel" id="panel-tagboard">
    <div class="toolbar">
      <div class="search-wrap">
        <input type="search" id="tb-search" placeholder="Search quotes…" autocomplete="off">
      </div>
      <select id="tb-tag"><option value="all">All tags</option></select>
      <select id="tb-project"><option value="all">All projects</option></select>
      <select id="tb-persona"><option value="all">All personas</option></select>
      <select id="tb-product"><option value="all">All products</option></select>
      <button class="btn-clear" id="tb-clear">Clear filters</button>
    </div>
    <div class="tb-status"><span id="tb-count">0 quotes</span></div>
    <div class="quote-grid" id="quote-grid"><div class="tb-empty">Loading…</div></div>
  </div>

  <script>
${inlineDataScript}
${js}
  </script>
</body>
</html>`;
}

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
