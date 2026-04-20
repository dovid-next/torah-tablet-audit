# Torah Tablet — Sefaria Content Audit

Data foundation for the Torah Tablet project: a Sefaria fork shipping offline on a Charedi-market tablet.

- **[View the audit site](https://torah-tablet-audit.pages.dev)** (Cloudflare Pages)
- Source markdown: [`audit.md`](./audit.md)
- Rendered HTML: [`index.html`](./index.html)

## What's in here

- Every Sefaria text version graded by **license** (ship-safe vs NC vs copyright vs audit-needed)
- Every version graded by **Charedi acceptability** (1 = mainstream frum → 5 = non-Jewish)
- English coverage-gap analysis per title
- Exact storage footprint from GCS bucket
- ~100 core seforim audited with Hebrew + all English versions + key commentator coverage
- Master browsable table with facet filters and sortable columns
- Risk register, update/support model, cost template

## Updating

Regenerate HTML from the markdown source:

```bash
python build.py
git add index.html audit.md
git commit -m "update audit"
git push
```

Cloudflare Pages auto-deploys on push to `main`.

## Data provenance

- Index source: `https://raw.githubusercontent.com/Sefaria/Sefaria-Export/master/books.json`
- License metadata: live Sefaria API `/api/texts/versions/<title>`
- File sizes: `storage.googleapis.com/storage/v1/b/sefaria-export/o` (public bucket listing)
- See "Part 3 > Data Provenance" in the audit for full detail.
