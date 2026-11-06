# Fixtures

Saved product pages, one per brand and clothing type, e.g. `fixtures/<brandId>/tops.html`.

Adapter tests run against these files, so tests and the backup demo keep
working even if a live site changes.

To save one: open the product page in Chrome → right-click → **Save as…** →
"Webpage, HTML Only". Trim anything personal (cart, account name) before
committing.

Newer fixtures are captured from the live page in the browser and reduced to the
parts adapters read (title, meta tags, main heading, JSON-LD), which keeps each
one to a few KB. Leave out customer reviews, since they include usernames.
