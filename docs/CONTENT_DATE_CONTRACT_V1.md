# CONTENT DATE CONTRACT V1

Status: Active  
Scope: JoyLab Articles, Books, homepage slots, archive ordering, SEO metadata

## 1. Purpose

JoyLab content dates must express three different facts without mixing them:

- `publishedAt`: when the content was first published.
- `updatedAt`: when the substantive content was last revised.
- `featuredAt`: when editors intentionally promoted the content into a featured surface.

A content item must never look newly published merely because it was edited or featured.

## 2. Field semantics

### publishedAt

The original public publication date.

Rules:
- Required for Articles and Books.
- Used for chronological archive ordering and publication-date display.
- Must not be changed to refresh homepage visibility.
- A Book remains the newest Book until another Book has a later `publishedAt`; this does not make it a latest Article.

### updatedAt

The date of a meaningful content revision.

Rules:
- Optional.
- Use only when body, data, conclusions, structure, or reader-facing assets materially change.
- Must not affect "latest" publication ordering.
- Cosmetic fixes alone do not require changing `updatedAt`.

### featuredAt

The editorial promotion timestamp.

Rules:
- Optional.
- Controls intentional featured placement where the surface supports it.
- Does not change publication history.
- May be newer than `publishedAt`.
- Removing or changing `featuredAt` changes promotion state, not publication state.

## 3. Homepage surface contract

### Latest updates

Source: `articles` collection only.

Ordering:
1. Article `publishedAt` descending.
2. Existing homepage slot exclusions/priorities may remove an article from this surface.
3. Books are never inserted into the Latest updates list.

### JoyLab Books slot

Source: `books` collection only.

Selection:
1. Prefer the Book with the newest `featuredAt` when one or more Books define it.
2. Otherwise fall back to the newest Book by `publishedAt`.
3. This slot is editorial/Books presentation and must not be interpreted as the global latest-content feed.

### Books library

Source: `books` collection only.

Ordering:
- `publishedAt` descending.
- UI must label the date as "출간일" so it is not confused with article freshness.

## 4. SEO and structured data

- `datePublished` maps to `publishedAt`.
- `dateModified` maps to `updatedAt ?? publishedAt`.
- `featuredAt` must not be emitted as `datePublished` or `dateModified`.
- Sitemap `lastmod` may use `updatedAt ?? publishedAt`.

## 5. Examples

A Book published on 2026-09-25 and featured again on 2026-10-03:

```yaml
publishedAt: 2026-09-25
updatedAt: 2026-09-28
featuredAt: 2026-10-03
```

Meaning:
- First publication: Sep 25.
- Substantive revision: Sep 28.
- Editorial promotion: Oct 3.
- It must still display Sep 25 as its publication date.

## 6. Prohibited patterns

Do not:
- change `publishedAt` to make old content appear new;
- sort global Article latest surfaces together with Books;
- use `updatedAt` as a substitute for publication date;
- use `featuredAt` as SEO publication date;
- infer "latest content" from a Book's position inside the Books library.

## 7. Current implementation anchors

- Content schema: `src/content.config.ts`
- Homepage Article latest and Books slot: `src/pages/index.astro`
- Books library ordering and publication-date label: `src/pages/books/index.astro`


## 8. Publication-date correction control

`publishedAt` is immutable after a content file is created.

If the original publication date was entered incorrectly, the correction must include a frontmatter reason in the same change:

```yaml
publishedAt: 2026-09-24
dateCorrectionReason: "출판사 최종 발행일 확인에 따른 정정"
```

The Date Contract CI compares an existing file against the PR base. A changed `publishedAt` without `dateCorrectionReason` blocks the PR.

The CI also scans the full Articles and Books corpus for:
- missing or malformed date fields;
- non-draft content with a future `publishedAt`;
- accidental Books coupling into the homepage `latestResearch` surface.

`updatedAt < publishedAt` is reported as a warning rather than a hard failure because pre-publication editorial work can legitimately precede the public release date.
