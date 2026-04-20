# Torah Tablet — Sefaria Content Audit

Data foundation for the Torah Tablet project: a Sefaria fork shipping offline on a Charedi-market tablet.

**Live site:** https://torah-tablet-audit.pages.dev

## What's in here

- Every Sefaria text version graded by **license** (ship-safe vs NC vs copyright vs audit-needed)
- Every version graded by **Charedi acceptability** (1 = mainstream frum → 5 = non-Jewish)
- English coverage-gap analysis per title
- Exact storage footprint from GCS bucket
- ~100 core seforim audited with Hebrew + all English versions + key commentator coverage
- Master browsable table with facet filters and sortable columns
- Risk register, update/support model, cost template

## Editing

All content lives in [`audit.md`](./audit.md). Edit the markdown — Cloudflare Pages rebuilds the site on every push to `main`.

You can edit directly in the GitHub web UI or locally:

```bash
git pull
# edit audit.md
git add audit.md
git commit -m "update audit"
git push
```

No local build needed — Cloudflare handles it.

## Local preview (optional)

```bash
pip install -r requirements.txt
python build.py
# open index.html in a browser
```

## How the build works

Cloudflare Pages runs `pip install -r requirements.txt && python build.py` on each push. `build.py`:
1. Reads `audit.md`
2. Renders markdown to HTML with sortable/filterable tables
3. Injects the Master Versions Browser from `versions_full.json`
4. Wraps with styles from `styles.css` and scripts from `app.js`
5. Writes `index.html` which Cloudflare serves.

## Repo contents

```
audit.md              # Source markdown — the only thing you edit
build.py              # Regenerates index.html
requirements.txt      # Python deps for Cloudflare build
styles.css            # Styling
app.js                # Facet filtering + sort
versions_full.json    # Text version metadata (for master browser)
books.json            # Sefaria export index (for category lookup)
```

## Data provenance

- Index source: `https://raw.githubusercontent.com/Sefaria/Sefaria-Export/master/books.json`
- License metadata: live Sefaria API `/api/texts/versions/<title>`
- File sizes: `storage.googleapis.com/storage/v1/b/sefaria-export/o` (public bucket listing)
- See "Part 3 > Data Provenance" in the audit for full detail.
