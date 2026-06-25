# FakeStore - Senior Frontend Technical Test

A production-grade e-commerce surface built on **Next.js 16 (App Router)**, **TypeScript** and **CSS Modules**, consuming the public [FakeStore API](https://fakestoreapi.com). The codebase is intentionally written to be defensible in a Staff/Architect code review: every decision below is justified, and the trade-offs are documented next to the choice.

> Senior expectations: this README and `state.claude.md` are part of the deliverable. Read them before touching code.

---

## Table of contents

1. [Quick start](#quick-start)
2. [Tech stack at a glance](#tech-stack-at-a-glance)
3. [High-level architecture](#high-level-architecture)
4. [Folder structure](#folder-structure)
5. [Data layer and caching (Next 16)](#data-layer-and-caching-next-16)
6. [Filters, URL state and the useProductFilters hook](#filters-url-state-and-the-useproductfilters-hook)
7. [SEO strategy](#seo-strategy)
8. [Performance strategy](#performance-strategy)
9. [State management (Zustand)](#state-management-zustand)
10. [Resilience and error handling](#resilience-and-error-handling)
11. [Business plus: Recommended For You](#business-plus-recommended-for-you)
12. [Accessibility](#accessibility)
13. [Testing strategy](#testing-strategy)
14. [Scripts](#scripts)
15. [Decisions log (TL;DR)](#decisions-log-tldr)

---

## Quick start

```bash
# 1. install
npm install

# 2. dev
npm run dev               # http://localhost:3000

# 3. production build
npm run build
npm run start

# 4. quality gates
npm run typecheck         # tsc --noEmit
npm run lint              # eslint
npm run test              # vitest run
npm run test:coverage     # vitest --coverage
```

> Optional env: set `NEXT_PUBLIC_SITE_URL` to your deployed origin so absolute OG / canonical URLs are correct.

---

## Tech stack at a glance

| Concern         | Choice                                          | Why this, not the alternative                                                                                                       |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Next.js 16 App Router                           | RSC + streaming + Cache Components fit a catalog perfectly. PPR-style behaviour without leaving the framework.                       |
| Language        | TypeScript (strict, `noUncheckedIndexedAccess`) | Strong types from the API contract upward; prevents domain drift in a feature-based codebase.                                       |
| Styling         | CSS Modules + CSS Variables                     | Per brief. Zero runtime, perfect encapsulation, no class-bag bloat. Brand tokens live in `:root` (`app/globals.css`).               |
| State (client)  | Zustand + `persist`                             | Selectors avoid the "every consumer re-renders" trap of Context+Reducer. `persist` for cart + visited categories. No provider hell. |
| Data fetching   | Native `fetch` + `'use cache'` + React `cache()` | Per brief: no React Query. Native cache APIs are now first-class in Next 16.                                                        |
| Testing         | Vitest + RTL + jsdom                            | ESM-native, fast, modern. Single config for unit + integration.                                                                     |

We deliberately did NOT add Redux, React Query, Tailwind, a UI kit, or an icon library - none is justifiable for this scope.

---

## High-level architecture

```
+------------------------------------------------------------+
|  app/  (routes only - thin shell, no business logic)       |
|   - layout, header/footer, error.tsx, not-found, robots    |
|   - /products       -> PLP   (Server Component, streamed)  |
|   - /products/[id]  -> PDP   (Server Component + OG meta)  |
|   - /cart           -> cart  (Client view; no SEO value)   |
+------------------------------------------------------------+
                          |
                          v
+------------------------------------------------------------+
|  src/features/<feature>/                                   |
|   api/        <- server-only HTTP wrappers + cache tags    |
|   services/   <- pure business policies (no React)         |
|   hooks/      <- React-only state-sync hooks               |
|   components/ <- UI; one folder per component + .module.css|
|   types/      <- domain models, branded types              |
|   utils/      <- pure helpers (format, clamp, ...)         |
|   store/      <- Zustand stores (cart, visited)            |
+------------------------------------------------------------+
                          |
                          v
+------------------------------------------------------------+
|  src/shared/                                               |
|   components/  <- Header, Footer, Skeleton, OfflineBanner  |
|   config/      <- site.ts, cache.ts                        |
+------------------------------------------------------------+
```

Layering rules (enforced socially + by `import "server-only"` where needed):

- `app/*` only composes feature components. No filtering, parsing, business policies.
- `features/*/api` is `server-only`. Never imported from a Client Component.
- `features/*/services` are PURE functions. 100% unit-testable.
- `features/*/hooks` / `features/*/components` are the only React surfaces.
- `shared/*` never depends on `features/*` (one-way dependency).

This is feature-based architecture INSPIRED by Clean Architecture, NOT full Clean. The classic onion (entities / use-cases / interfaces / frameworks) would be over-engineering for a single-domain storefront; what we keep is the principle that business policies must live outside the framework.

---

## Folder structure

```
test-ecommerce/
+- app/                              # Next router (kept slim)
|  +- layout.tsx                     # Root layout, header, providers, fonts
|  +- page.tsx                       # Home (hero + featured + recommended)
|  +- globals.css                    # Brand tokens (CSS vars) + tiny reset
|  +- error.tsx, not-found.tsx       # App-level boundaries
|  +- robots.ts, sitemap.ts          # SEO
|  +- products/
|  |  +- page.tsx                    # PLP (Server Component, streaming)
|  |  +- page.module.css
|  |  +- loading.tsx                 # Realistic skeleton shell
|  |  +- error.tsx                   # Catalog-level boundary
|  |  +- [id]/
|  |     +- page.tsx                 # PDP (Server Component + generateMetadata)
|  |     +- loading.tsx, error.tsx, not-found.tsx
|  +- cart/
|     +- page.tsx                    # Client-only cart view (noindex)
|     +- page.module.css
+- src/
|  +- features/
|  |  +- products/
|  |  |  +- api/products.api.ts             # server-only; cacheLife/cacheTag + cache()
|  |  |  +- services/products.service.ts    # pure: parse/serialize + filter/search/sort
|  |  |  +- hooks/useProductFilters.ts      # URL <-> view state
|  |  |  +- components/                     # ProductCard, ProductGrid, ProductFilters,
|  |  |  |                                  #  ProductDetails, EmptyResults, ...
|  |  |  +- types/product.ts                # Product, Rating, Category, Filters
|  |  |  +- utils/format.ts                 # price/category formatters
|  |  +- cart/
|  |  |  +- store/cart.store.ts             # Zustand + persist (id+qty only)
|  |  |  +- hooks/useCartHydration.ts       # SSR/CSR-safe rehydration
|  |  |  +- components/
|  |  |  |  +- CartIndicator/               # Header badge (Client)
|  |  |  |  +- AddToCartButton/             # PDP CTA + qty stepper
|  |  |  |  +- CartView/                    # /cart UI
|  |  |  +- types/cart.ts                   # CartItem = { id, quantity }
|  |  +- recommendations/
|  |     +- store/visited.store.ts          # Zustand + persist
|  |     +- services/recommend.ts           # pure: top category -> products
|  |     +- hooks/useRecordVisit.ts         # side-effect island
|  |     +- components/
|  |        +- RecordVisit/                 # noop component used in PDP
|  |        +- RecommendedProducts/         # rail used on home + PLP
|  +- shared/
|  |  +- components/Header, Footer, Skeleton, OfflineBanner, RetryButton
|  |  +- config/{site,cache}.ts
|  +- test/setup.ts                         # Vitest + RTL global setup
+- vitest.config.ts
+- next.config.ts
+- tsconfig.json
+- package.json
+- state.claude.md                          # Living architecture state
+- README.md
```

---

## Data layer and caching (Next 16)

Next 16 ships **Cache Components**: `fetch()` is NOT cached by default, and caching is opted-in explicitly via the `'use cache'` directive + `cacheLife` / `cacheTag` from `next/cache`. We embrace it and avoid the legacy `next: { revalidate }` syntax.

```ts
// src/features/products/api/products.api.ts
export const getAllProducts = cache(async (): Promise<readonly Product[]> => {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });   // 5 min refresh, 1 h cap
  cacheTag("products");

  const res = await safeFetch(`${BASE_URL}/products`);
  // validate, assert, return
});
```

- `cacheLife` profiles (centralised in `src/shared/config/cache.ts`):
  - products / productDetail: `{stale: 60s, revalidate: 5 min, expire: 1 h}` - light churn, SEO tolerates a 5-minute lag.
  - categories: `{stale: 5 min, revalidate: 1 h, expire: 6 h}` - effectively static.
- `cacheTag` is used per resource (`products`, `product:<id>`, `categories`, `products:<category>`), enabling targeted invalidation if you wire up an admin or webhook.
- React `cache()` wraps the same functions so `generateMetadata` and the page that calls them within one request share ONE fetch (per-request memoization). `'use cache'` dedupes across requests; `cache()` dedupes within. Both are necessary.
- Filtering is server-side, on the cached snapshot rather than per-filter HTTP calls. FakeStore can't combine search + category + sort, so re-using a single cached payload (`getAllProducts`) drives the cache hit rate up and the upstream load down.

Network errors are normalised to a typed `ApiError`. The PDP turns 404-equivalent responses into `notFound()`; everything else throws and the segment `error.tsx` handles it.

---

## Filters, URL state and the useProductFilters hook

- The URL is the source of truth: `?category=...&search=...&sort=asc|desc`.
- Filters are indexable + shareable: refresh, share, bookmark - all preserve state.
- `parseFilters(searchParams)` returns a strongly-typed `ProductFilters`; invalid values are silently dropped (URLs are user input, degrade gracefully).
- `serializeFilters(filters)` produces a STABLE, sorted query string - important for canonical URL parity and cache keys.
- `useProductFilters()` is the single point of URL writes. It uses `router.replace(url, { scroll: false })` inside a `useTransition`, so updates feel non-blocking and never duplicate state across components.

The PLP `generateMetadata` re-parses `searchParams` and dynamically builds the title (`"Electronics Products"`, `"Results for 'phone' Products"`, ...) plus a clean canonical that includes only the valid, sorted filters.

---

## SEO strategy

- Server-rendered HTML for PLP and PDP; minimal client JS on the initial response.
- `generateMetadata` on PLP and PDP, including dynamic `title`, `description`, `openGraph`, `twitter`, and `alternates.canonical`.
- OG / Twitter images on the PDP use the product image directly - exactly the requirement for rich shares on WhatsApp / Facebook / LinkedIn / Discord.
- Structured data (JSON-LD) is emitted on PDP (`@type: Product` with `offers` + `aggregateRating`).
- `sitemap.ts` dynamically lists home, catalog and every PDP.
- `robots.ts` allows the catalog, disallows `/cart` (which is also `robots: { index: false }` in metadata - defense in depth).
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, one `<h1>` per route, breadcrumbs, descriptive `aria-label`s.

---

## Performance strategy

- RSC by default. Client Components are limited to interactivity islands: `ProductFilters`, `AddToCartButton`, `CartIndicator`, `CartView`, `OfflineBanner`, `RecommendedProducts`.
- `next/image` everywhere with explicit `sizes` (no CLS, AVIF/WebP negotiated automatically). `fakestoreapi.com` is allowed via `next.config.ts -> images.remotePatterns`.
- Streaming + per-segment `loading.tsx`. The PLP renders header + filters immediately and streams the grid behind a `<Suspense>` boundary.
- Dynamic imports for the `RecommendedProducts` rail and the `CartIndicator` / `CartView` (cart is `ssr:false`: no SEO value, no need to ship JS until visited).
- Self-hosted fonts via `next/font` (`display: swap`) - no third-party connections, preloaded subsets.
- `scrollbar-gutter: stable` prevents layout jank when scrollbars appear/disappear.
- No CSS-in-JS runtime. No icon font. No utility-class library.
- Tabular numerals on prices to avoid layout reflow when digits change.
- `prefers-reduced-motion` honored by the skeleton shimmer.

---

## State management (Zustand)

Two stores - kept small, persisted, with controlled hydration to avoid SSR/CSR drift.

### Cart store (`features/cart/store/cart.store.ts`)

```ts
type CartItem = { id: number; quantity: number };
type CartState = {
  items: CartItem[];
  addItem(id, qty?): void;
  removeItem(id): void;
  updateQuantity(id, qty): void;
  clearCart(): void;
};
```

- Memory rule: the cart stores ONLY `{ id, quantity }`. We never copy a product title / image / price into cart state. Reasons (in order):
  1. Source of truth - price/title cannot drift between catalog and cart.
  2. localStorage payload stays tiny.
  3. Backend sync becomes trivial if/when we add accounts (`POST /cart { items }`).
- Persist middleware writes to `localStorage` under `fakestore:cart:v1` (versioned).
- `skipHydration: true` + a small `useCartHydration()` hook makes rehydration explicit, avoiding hydration mismatch warnings on the header badge.
- The header indicator subscribes only to a `selectCartCount` selector - it re-renders solely when the total quantity changes.

### Visited store (`features/recommendations/store/visited.store.ts`)

Per-category visit counts, used by the recommendation engine. Same `persist` + `skipHydration` pattern. `topCategory()` returns `null` until at least 2 visits accumulate - silence beats noise.

---

## Resilience and error handling

- `app/error.tsx` + `app/products/error.tsx` + `app/products/[id]/error.tsx` scope failures to the smallest segment possible. Header/footer stay alive.
- `<RetryButton/>` wraps `reset()` and is reused across boundaries.
- `app/not-found.tsx` and `app/products/[id]/not-found.tsx` for missing routes / products.
- `<EmptyResults/>` is shown on the PLP when filters return zero items; includes a "clear filters" link.
- `<OfflineBanner/>` listens to `online`/`offline` events; shows a friendly notice when there is no connection and a transient confirmation when reconnected. The app never breaks visually.
- API wrappers throw typed `ApiError` - routes decide between `notFound()` and `throw`.

---

## Business plus: Recommended For You

Inspired by Promart / Amazon: surface inventory based on observed interest, without requiring auth.

- Every PDP mounts `<RecordVisit category={product.category}/>` - a noop client island that increments the persisted visit count.
- On the home and (above the grid) on `/products`, the `<RecommendedProducts/>` rail reads `topCategory()` and renders up to 8 products from that category.
- If the user hasn't crossed the 2-visit threshold, the section renders nothing (no fake recommendations, no empty noise).
- Implementation is fully client-side and persisted, so the experience survives refreshes and works for anonymous users.

Why this matters commercially: incremental CTR on PLP top-fold, longer dwell time, higher AOV. It's a lightweight personalization play that doesn't require a backend.

---

## Accessibility

- Visible focus outlines (`:focus-visible`), respects user theme preferences.
- Skip link `Skip to content` jumps to `<main id="main">`.
- Proper landmark structure (`header / main / footer`).
- `aria-label`s on icon buttons (cart, decrease/increase qty), `aria-busy` on loading skeletons.
- `prefers-reduced-motion` disables the skeleton shimmer animation.
- All actionable elements are real `<button>` or `<a>` - never spans-with-onclick.

---

## Testing strategy

We deliberately prioritise business flows over coverage theater. The tests we ship are the ones an architect would expect to see survive a refactor.

| Layer       | Spec                          | What it asserts                                                                 |
| ----------- | ----------------------------- | ------------------------------------------------------------------------------- |
| Unit        | `products.service.spec.ts`    | parse/serialize URL filters; category, search, sort; composition                |
| Unit        | `format.spec.ts`              | price/category formatters, clamp, word-boundary truncate                        |
| Unit        | `cart.store.spec.ts`          | add/update/remove/clear, qty clamping, count selector                           |
| Unit        | `visited.store.spec.ts`       | threshold for recommendations, case-insensitive, tie-breaking                   |
| Unit        | `recommend.spec.ts`           | top-category recommendations, limit + excludeId                                 |
| Integration | `ProductFilters.spec.tsx`     | typing search debounces and updates URL; category + sort write URL              |
| Integration | `AddToCartButton.spec.tsx`    | clicking the CTA updates the cart store; same product merges quantities         |

Run them:

```bash
npm run test            # one shot
npm run test:watch      # tdd mode
npm run test:coverage   # with v8 coverage
```

---

## Scripts

| Script                  | What it does                                        |
| ----------------------- | --------------------------------------------------- |
| `npm run dev`           | Start the dev server on `:3000`                     |
| `npm run build`         | Production build (Cache Components on)              |
| `npm run start`         | Run the production build                            |
| `npm run lint`          | ESLint (Next + TS configs)                          |
| `npm run typecheck`     | `tsc --noEmit`, strict + `noUncheckedIndexedAccess` |
| `npm test`              | Vitest unit + integration                           |
| `npm run test:watch`    | Vitest in watch mode                                |
| `npm run test:coverage` | Vitest with v8 coverage                             |

---

## Decisions log (TL;DR)

- CSS Modules over Tailwind - per brief; encapsulation; no class bloat.
- Zustand over Redux/Context - selector-based, no provider tree, native persist.
- Cart shape `{id, quantity}` only - source-of-truth integrity; trivial backend sync.
- Server-side filtering on a cached snapshot - 1 fetch per 5 min serves N filter permutations.
- `'use cache'` + `cacheTag` + React `cache()` - both cross-request and per-request memoization.
- Per-segment `loading.tsx` + `<Suspense>` - TTFB looks great; LCP measures the shell.
- Dynamic `import('...')` for cart islands - JS only ships when the user actually uses them.
- Streaming + small client surface - minimum JS on the wire, RSC-by-default everywhere else.
- Recommendations are a quiet feature - < 2 visits => render nothing. Quality > coverage.
- Robots: noindex on `/cart` - user-private route + sitemap excludes it explicitly.
- Tests cover business flows - not artificial coverage of UI primitives.

See `state.claude.md` for the living state file with the same information in a denser, working-doc format.

---

## Review round 2 - new modules

These were added after the first round of review feedback. They keep the same SOLID principles and feature-based layering.

### Centralized HTTP client + API version pattern

| File                                              | Responsibility                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/shared/api/config.ts`                        | `API_VERSIONS["v1"]`, `endpoints.*` catalog, `resolve()`. ONE place that knows URLs. |
| `src/shared/api/errors.ts`                        | `ApiError` (status, url, toJSON).                                                    |
| `src/shared/api/http.server.ts`                   | `server-only` transport (used by `products.api.ts`).                                 |
| `src/shared/api/http.client.ts`                   | Browser-safe transport with `AbortSignal` support.                                   |
| `src/features/products/services/products.client.service.ts` | Client-side wrappers around `http.client` + `endpoints`.                  |
| `src/features/products/hooks/useProducts.ts`      | Client hook: loading/error/data + retry + cancel-on-unmount.                         |

Endpoints are read through `endpoints.productsList()`, `endpoints.productById(id)`, `endpoints.categories()`. To roll out a `v2`, add a key to `API_VERSIONS` and pass `"v2"` to `resolve()` - no other change needed. Override base URL per environment with `NEXT_PUBLIC_API_BASE_URL`.

### Cart retry bug - fixed

The Retry button in `CartView` now calls `useProducts().retry()`, which bumps an internal nonce so the fetch effect actually re-runs (under a fresh `AbortController`). Previous bug: the button only cleared the local error state, and the effect's `[hydrated, items.length]` deps didn't change.

### `/checkout` simulated payment

`src/features/checkout/components/CheckoutView/` + `app/checkout/page.tsx`. Reads cart and product catalog, computes subtotal + 8% tax + free shipping over $50, runs a fake submit (900 ms), clears cart and shows a success state with a generated order id. Marked `robots: noindex` like `/cart`.

### Open Graph - what's covered

`og:*` is the protocol used by Facebook, WhatsApp, LinkedIn, Discord, Pinterest, Slack and Telegram - they all read it. Twitter has its own card (`twitter:*`), already present. The PDP now also emits:
- `og:type=product`, `og:price:amount`, `og:price:currency`
- `og:image` 1200x1200 + `og:image:type`
- `product:availability`, `product:condition`, `product:retailer_item_id`, `product:category`

Pinterest reads these as Rich Pin data; Facebook Commerce reads `product:*`.

### SmartLink (hover prefetch)

`src/shared/components/SmartLink/SmartLink.tsx` is a drop-in `next/link` replacement that schedules `router.prefetch(href)` after an 80 ms hover debounce, cancels on `mouseleave`, and prefetches immediately on `touchstart`. Wired into `ProductCard` so PDPs feel instant. Layered on top of Next's viewport-based prefetching - this one is intent-based.

---

## Vercel build-time resilience

FakeStore occasionally returns `403` to cloud build IPs. We refuse to let that break a deploy. The api wrappers (`getCategories`, `getAllProducts`, `getProductById`) detect `process.env.NEXT_PHASE === "phase-production-build"` and, on upstream failure, return an empty payload + a warning log instead of throwing. At runtime they throw as usual and `error.tsx` handles the rest.

Why this is the right call:
- Deploys do not gate on third-party availability.
- The first real request fills the cache from the live API.
- Real runtime failures still surface to users (we do not silently serve empty data outside the build phase).

If your build still fails, delete `.next/` and rebuild so stale `.next/types/routes.d.ts` regenerates for new routes (`/checkout`, `/cart`).
