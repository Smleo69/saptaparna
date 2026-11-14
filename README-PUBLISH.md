# Saptaparna website

This directory is the authoritative deployable site. The parent `for-you-monsoon.html` is an old prototype.

## Preview before publishing

From the project root:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory github-pages
```

Open http://localhost:4173. This preview uses the same Supabase project as production: admin saves affect real content. Automated mutation tests use a mocked backend instead.

Check the intro, all six panels, photo/poem readers, long letter scrolling, cassette and expanded player, and mobile layout. Review local changes before publishing.

## Content and admin

Gallery, poems, letter, and music are managed through the Supabase-backed admin panel. Open `?admin` or use the keyboard shortcut. Use **Sign out** to end the session; closing the panel leaves the session signed in. **Retry file cleanup** retries failed storage deletions recorded in this browser.

The site currently permits public viewing. Admin authentication controls writes. No secrets belong in frontend files.

## Deployment contents

Publish the contents of this directory together, including:

- `index.html`
- `reliability.js`
- `.nojekyll`
- `assets/`, including `assets/vendor/` and the new footer WebP

Do not publish the parent directory, backups, tests, or project context. No Supabase migration is required for the current local fixes. GitHub Pages uses the main branch, root folder.

## Backups and checks

Dated backups are in the parent `backups/` folder; `LATEST.txt` identifies the pre-fix snapshot. See its README for restoration. It is a local file backup, not a Supabase data export.

`python3 tests/build-browser-check.py` from the project root creates a temporary browser harness with mocked Supabase calls. It never performs live database writes. Open `/tmp/saptaparna-fixes-check.html` in Chromium to inspect the results.

Dependencies are committed locally under `assets/vendor/`. Review and test an explicit replacement when updating; the page no longer loads a floating Supabase script from a CDN.
