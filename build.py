"""
Regenerate index.html from audit.md.

Requires:
    pip install markdown

Usage:
    python build.py

Expects (in repo root or adjacent Temp dir):
    audit.md
    versions_full.json  (for master table — optional; if missing, master table is skipped)
    books.json          (for category labels — optional)
"""
import markdown, os, re, datetime, json, html as htmllib, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC_MD = os.path.join(HERE, 'audit.md')
DST_DIR = os.path.join(HERE, 'public')
os.makedirs(DST_DIR, exist_ok=True)
DST_HTML = os.path.join(DST_DIR, 'index.html')
VERSIONS_JSON = os.path.join(HERE, 'versions_full.json')
BOOKS_JSON = os.path.join(HERE, 'books.json')

# Fallback: try %TEMP% if not in repo
if not os.path.exists(VERSIONS_JSON):
    tmp = os.environ.get('TEMP') or '/tmp'
    cand = os.path.join(tmp, 'versions_full.json')
    if os.path.exists(cand): VERSIONS_JSON = cand
if not os.path.exists(BOOKS_JSON):
    tmp = os.environ.get('TEMP') or '/tmp'
    cand = os.path.join(tmp, 'books.json')
    if os.path.exists(cand): BOOKS_JSON = cand

if not os.path.exists(SRC_MD):
    sys.exit(f'Missing {SRC_MD}')

md_text = open(SRC_MD, encoding='utf-8').read()

# Build master versions table if data is present
master_table = ''
if os.path.exists(VERSIONS_JSON) and os.path.exists(BOOKS_JSON):
    versions = json.load(open(VERSIONS_JSON, encoding='utf-8'))
    books = json.load(open(BOOKS_JSON, encoding='utf-8'))['books']
    title_to_cat = {}
    for b in books:
        t = b['title']
        if t not in title_to_cat and b.get('categories'):
            title_to_cat[t] = b['categories']

    PUBLISHER_MAP = [
        (r'artscroll|mesorah pub|stone edition', 1, 'Artscroll/Mesorah'),
        (r'metsudah', 1, 'Metsudah'),
        (r'kehot|chabad|sichos in english|merkos', 1, 'Chabad/Kehot'),
        (r'feldheim', 1, 'Feldheim'),
        (r'torat.?emet', 1, 'Torat Emet'),
        (r'breslov|breslev', 1, 'Breslov'),
        (r'machon mamre|mechon mamre', 1, 'Machon Mamre'),
        (r'vilna edition|warsaw \d|vilna, \d|warsaw edition', 1, 'Vilna/Warsaw'),
        (r'yeshivat har bracha|peninei halakhah', 2, 'Har Bracha'),
        (r'koren|maggid', 2, 'Koren/Maggid'),
        (r'orthodox union|ou press', 2, 'OU Press'),
        (r'touger|moznaim', 2, 'Moznaim/Touger'),
        (r'soloveitchik|mossad harav kook|mossad ha.?rav kook', 2, 'Rav Kook/MO'),
        (r'sefaria community translation', 3, 'Sefaria community'),
        (r'william davidson|steinsaltz', 3, 'Steinsaltz/Davidson'),
        (r'\bjps\b|jewish publication society', 4, 'JPS'),
        (r'reconstructionist|reform judaism|union for reform', 4, 'Non-Orthodox'),
        (r'hebrew union college|\bhuc\b', 4, 'HUC'),
        (r'jewish theological seminary|\bjts\b', 4, 'JTS'),
        (r'sefaria edition of tanach|miqra according to the masorah', 2, 'Sefaria Miqra'),
        (r'\bsoncino\b', 3, 'Soncino'),
        (r'brenton.*septuagint|king james|new testament|douay', 5, 'Christian'),
        (r'wikisource|wikipedia', 3, 'Wikisource'),
    ]
    def grade(v):
        blob = ' '.join(str(v.get(k,'')) for k in ('versionTitle','versionSource','versionNotes','shortVersionTitle')).lower()
        for pat, g, reason in PUBLISHER_MAP:
            if re.search(pat, blob): return g, reason
        if v.get('isSource') or (v.get('actualLanguage','') in ('he','arc') and v.get('license') in ('Public Domain','PD','CC0')):
            return 1, 'Source / PD Heb-Aram'
        return '?', 'Unmatched'
    def lstat(lic):
        if lic in ('Public Domain','PD','CC0','CC-BY','CC-BY-SA'): return 'SHIP-SAFE'
        if lic in ('CC-BY-NC','CC-BY-NC-SA'): return 'BLOCKED-NC'
        if isinstance(lic,str) and lic.startswith('Copyright'): return 'BLOCKED-COPY'
        if lic in ('unknown','',None): return 'AUDIT-NEEDED'
        return 'OTHER'
    LANG_LABEL = {'en':'English','he':'Hebrew','arc':'Aramaic','yi':'Yiddish','es':'Spanish',
                  'fr':'French','pt':'Portuguese','ru':'Russian','de':'German','pl':'Polish',
                  'fi':'Finnish','it':'Italian','ar':'Arabic','la':'Latin','nl':'Dutch',
                  'eo':'Esperanto','lld':'Ladino'}
    # Emit rows as JSON; app.js renders them on-demand when the user interacts.
    # This avoids parsing ~11k <tr> elements at page load.
    master_rows = []
    for v in versions:
        g, reason = grade(v); st = lstat(v.get('license',''))
        cat = title_to_cat.get(v['title'], ['?'])[0]
        lang_code = v.get('actualLanguage','') or v.get('language','') or '?'
        lang = LANG_LABEL.get(lang_code, lang_code or '?')
        master_rows.append([
            v['title'],
            cat,
            lang,
            str(g),
            st,
            v.get('license','') or '(blank)',
            reason,
            v.get('versionTitle',''),
        ])
    master_data_json = json.dumps(master_rows, ensure_ascii=False, separators=(',', ':'))
    master_table = (
        '<h2 id="master-browser">Master Versions Browser</h2>\n'
        f'<p>All {len(versions):,} text versions. Use facet chips above the table to filter by Grade, Status, Category, or Language. Click column headers to sort.</p>\n'
        '<p style="color:#666; font-size:13px;"><em>Common queries: click <code>BLOCKED-NC</code> to see all NC versions. Add <code>Talmud</code> to narrow. Click <code>AUDIT-NEEDED</code> + grade <code>?</code> for the priority audit pile.</em></p>\n'
        '<table class="lazy-table" data-source="master-data">'
        '<thead><tr>'
        '<th>Title</th><th>Category</th><th>Language</th><th>Grade</th>'
        '<th>Status</th><th>License</th><th>Publisher signal</th><th>Version title</th>'
        '</tr></thead><tbody></tbody></table>\n'
        '<script id="master-data" type="application/json">' + master_data_json + '</script>\n'
    )

html_body = markdown.markdown(
    md_text,
    extensions=['tables','toc','fenced_code','sane_lists','attr_list'],
    extension_configs={'toc': {'permalink': False, 'toc_depth': '2-3'}},
)

# CSS + JS loaded from external files
css = open(os.path.join(HERE, 'styles.css'), encoding='utf-8').read() if os.path.exists(os.path.join(HERE,'styles.css')) else ''
js = open(os.path.join(HERE, 'app.js'), encoding='utf-8').read() if os.path.exists(os.path.join(HERE,'app.js')) else ''

header = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Torah Tablet Audit</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>{css}</style>
</head>
<body>
<div id="doc-meta" style="color:#888; font-size:12px; text-align:right; margin-bottom:1rem;">
  Rendered {datetime.date.today()}
</div>
'''

# TOC from headings
h_pattern = re.compile(r'<h(2|3)\s+id="([^"]+)">(.*?)</h\1>', re.DOTALL)
headings = h_pattern.findall(html_body)
toc_html = '<div id="floating-toc"><h3>Contents</h3><ul>'
current_h2 = False
for level, hid, text in headings:
    clean = re.sub(r'<[^>]+>', '', text).strip()
    if level == '2':
        if current_h2: toc_html += '</ul></li>'
        toc_html += f'<li><a href="#{hid}">{clean}</a><ul>'
        current_h2 = True
    else:
        toc_html += f'<li><a href="#{hid}">{clean}</a></li>'
if current_h2: toc_html += '</ul></li>'
toc_html += '</ul></div>'

# Inject master table after h1
h1_match = re.search(r'(<h1[^>]*>.*?</h1>)', html_body, re.DOTALL)
if h1_match and master_table:
    insert_at = h1_match.end()
    html_body = html_body[:insert_at] + '\n' + master_table + html_body[insert_at:]

full = header + toc_html + html_body + f'\n<script>{js}</script>\n</body>\n</html>\n'
open(DST_HTML, 'w', encoding='utf-8').write(full)
print(f'Wrote {DST_HTML} ({os.path.getsize(DST_HTML)//1024} KB)')
