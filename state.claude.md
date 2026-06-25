# state.claude.md

> Living state file for the FakeStore senior frontend technical test.
> Read this BEFORE doing anything. Update it after each meaningful step.
> Format: short, factual, decision-oriented. Avoid prose.

---

## 1. Goal

Build a Next.js 16 (App Router) + TypeScript e-commerce defendable in a Staff/Architect code review.
Pillars (in priority order): **Performance · SEO · Scalability · UX · Maintainability · Business**.

## 2. Tech stack (locked)

| Concern         | Choice                                | Why                                                                                       |
| --------------- | ------------------------------------- | ----------------------------------------------------------------------------------------- |
| Framework       | Next.js 16.2.9 (App Router)           | RSC + streaming + cacheComponents fits ecom catalog perfectly.                            |
| Language        | TypeScript strict                     | Strong types from API shape upward; prevents domain drift.                                |
| Styling         | CSS Modules + CSS Variables (tokens)  | Encapsulation, zero runtime, no Tailwind per brief. Brand tokens via `:root`.             |
| State (client)  | Zustand + `persist` middleware        | Tiny, fast, no provider hell. Persist for cart + visited categories.                      |
| Data fetching   | Native `fetch` + `use cache` + `cache(...)` | Per brief: no React Query. RSC fetch + cacheLife + cacheTag + React `cache()` memoization. |
| Testing         | Vitest + React Testing Library + jsdom | Fast, ESM-native, modern. Cover business flows over coverage theater.                     |
| Icons           | Inline SVG components                  | Zero deps.                                                                                |

## 3. Next 16 specifics (NOT the Next you remember)

- `fetch()` is **NOT** cached by default. Need `'use cache'` directive or `<Suspense>`.
- `cacheComponents: true` in `next.config.ts` enables the new model.
- `cacheLife('hours' | 'minutes' | ...)` + `cacheTag('products')` from `next/cache`.
- `params` and `searchParams` are **Promises** (`await params`, `await searchParams`).
- Use React `cache(...)` to dedupe `getProductById(id)` across `generateMetadata` + `Page`.
- Streaming metadata is auto, but bots get blocking HEAD.

## 4. Architecture (Feature-based, Clean-Architecture inspired)

```
src/
  app/                                # Next router: routes only, no business logic
    (catalog)/
      products/
        page.tsx                      # PLP — Server Component
        loading.tsx                   # PLP skeleton
        error.tsx                     # PLP error boundary
        [id]/
          page.tsx                    # PDP — Server Component
          loading.tsx
          not-found.tsx
    layout.tsx                        # Root layout, header, providers
    globals.css                       # Tokens (colors, type, spacing)
    error.tsx                         # App-level error boundary
    not-found.tsx                     # Global 404
  features/
    products/
      api/products.api.ts             # fetch wrappers (server-only)
      services/products.service.ts    # business policies: filtering, sorting, search
      hooks/useProductFilters.ts      # URL search params <-> view state
      components/
        ProductCard/                  # Card + module css
        ProductGrid/
        ProductFilters/               # Client; reads/writes URL
        ProductDetails/
        EmptyResults/
        RecommendedProducts/          # Business plus
      types/product.ts                # Product, Category, Rating
      utils/format.ts                 # price formatter, slugify
    cart/
      store/cart.store.ts             # Zustand + persist; { id, quantity } only
      hooks/useCartCount.ts           # selector hook
      components/
        AddToCartButton/              # Client island
        CartIndicator/                # Header counter
      types/cart.ts                   # CartItem = { id, quantity }
    recommendations/
      store/visited.store.ts          # tracks visited categories
      services/recommend.ts           # pure: pick top category -> products
      hooks/useRecordVisit.ts
  shared/
    components/
      Header/
      Footer/
      Skeleton/                       # primitives
      OfflineBanner/                  # navigator.onLine listener
      RetryButton/
    providers/                        # any client providers
    config/
      site.ts                         # brand, urls, defaults
      cache.ts                        # cache profile constants
  test/
    setup.ts                          # vitest config; fake fetch helpers
```

### Layering rules

- `app/*` is a thin route shell. It composes feature components. It does NOT do filtering, parsing, business policies.
- `features/*/api` is **server-only** (`import 'server-only'`). Never imported by Client Components.
- `features/*/services` are **pure functions** (filtering, sorting, scoring). 100% unit-testable, no React.
- `features/*/hooks` and `features/*/components` are the only places that may import React.
- `cart/store` is the only client global state. Selectors are colocated.
- `shared/*` is leaf-only; never depends on `features/*`.

## 5. Data layer

- `getCategories()` — `'use cache'` + `cacheLife('hours')` + `cacheTag('categories')`. **Reason**: categories rarely change.
- `getProducts({category?})` — `'use cache'` + `cacheLife({revalidate: 300, expire: 3600})` + `cacheTag('products', 'products:'+cat)`. **Reason**: catalog drift in 5 min is tolerable; cap at 1h.
- `getProductById(id)` — wrapped in React `cache(...)` so `generateMetadata` + `page` share one request per render. Also `'use cache'` with `cacheTag('product:'+id)` for cross-request reuse.
- Filtering & sorting happen **on the server** in the Service layer (pure functions) on top of the cached `getProducts`. URL `searchParams` are the source of truth.

### Why server-side filtering (not /products?category=X to API)

FakeStore exposes `/products/category/{cat}` but does not support combined search + sort. To keep behavior predictable and the server cache hit rate high, we fetch the **full set once**, cache it for 5 min, and derive filtered/sorted views in pure functions. Result: 1 cached fetch backs N filter combinations.

## 6. SEO strategy

- PLP `generateMetadata({searchParams})`: title varies with active filters ("Electronics Products | FakeStore").
- PDP `generateMetadata({params})`: full OG + twitter card from product (title, description, image).
- Canonical URLs include normalized search params (sorted, lowercased).
- `robots.ts` + `sitemap.ts` (static + dynamic from product list).
- Semantic HTML: `<article>`, `<section>`, `<nav>`, `<h1>` per route.
- Filters change URL via `router.replace({scroll:false})` so links are shareable and indexable.

## 7. Performance budget

- **RSC by default**. Client components only: filters, add-to-cart button, cart indicator, offline banner.
- **next/image** with `remotePatterns` for `fakestoreapi.com`. `sizes` attr for responsive serving.
- **Streaming** via `<Suspense>` around `<ProductGrid>` + per-segment `loading.tsx`.
- **Dynamic import** for cart drawer + non-critical UI.
- **No CSS-in-JS runtime**.
- **No external icon font / lib**.

## 8. Resilience

- `error.tsx` at app + PLP + PDP segments → friendly fallback + `<RetryButton/>` (calls `reset()`).
- `not-found.tsx` for missing product id (`notFound()` from `next/navigation`).
- `<EmptyResults/>` when filters return zero items.
- `<OfflineBanner/>` driven by `window.addEventListener('online'|'offline')`.
- API wrappers throw typed `ApiError`; pages decide between `notFound()` and `throw`.

## 9. State (Zustand)

### Cart
```ts
type CartItem = { id: number; quantity: number };
type CartState = {
  items: CartItem[];
  addItem(id: number, qty?: number): void;
  removeItem(id: number): void;
  updateQuantity(id: number, qty: number): void;
  clearCart(): void;
};
```
Persist to `localStorage` under key `fakestore:cart:v1`. Versioned to allow migrations.

### Visited categories (recommendations)
```ts
type VisitedState = {
  visits: Record<string /*category*/, number /*count*/>;
  recordVisit(category: string): void;
  topCategory(): string | null;
};
```
Persist under `fakestore:visited:v1`.

## 10. Business Plus — "Recommended For You"

- On each PDP render, client hook `useRecordVisit(category)` increments the count.
- On `/products` (and home), render `<RecommendedProducts/>` Client Component that:
  1. Reads `topCategory()` from Zustand on mount (hydration-safe).
  2. If non-null, asks the server (via a tiny RSC island fed by `searchParams.recommend=cat`) for that category's products.
  3. Renders a horizontal carousel above the grid.
- If no history → hide section. No empty noise.
- **Why**: re-engagement, higher AOV, mirrors Promart/Amazon "for you" pattern. Concrete metric: lift CTR on PLP top fold.

## 11. Testing strategy (depth: critical paths)

Unit:
- `cart.store.spec.ts`: add → update → remove → clear, persist key shape.
- `products.service.spec.ts`: filter by category, search, sort asc/desc, combinations.
- `recommend.spec.ts`: top category resolution, ties, empty.
- `format.spec.ts`: price formatter.

Integration (RTL + jsdom):
- `ProductFilters.test.tsx`: typing search updates URL; selecting category updates URL; sort persists in URL.
- `AddToCart.test.tsx`: clicking from PDP increments header counter (cart store integration).
- `EmptyResults.test.tsx`: shown when service returns []; "clear filters" link works.

## 12. Brand tokens (from brief)

```css
:root {
  --color-bg:          #ffffff;
  --color-surface:     #ffffff;
  --color-surface-alt: #f5f7fa;
  --color-text:        #1f2937;   /* lead gray */
  --color-text-muted:  #4b5563;
  --color-text-soft:   #6b7280;
  --color-primary:     #00205B;   /* deep navy */
  --color-primary-600: #003366;
  --color-primary-50:  #eaf0fa;
  --color-border:      #e5e7eb;
  --color-accent:      #f59e0b;   /* small CTA accent only */
  --color-danger:      #b91c1c;
  --color-success:     #047857;
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px;
  --shadow-sm: 0 1px 2px rgba(15,23,42,.06);
  --shadow-md: 0 6px 18px rgba(15,23,42,.08);
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

## 13. Status log

- [x] 01. state.claude.md + architecture plan written
- [x] 02. Tailwind removed; Next config (cacheComponents, remotePatterns); Vitest config + Zustand listed in package.json
- [x] 03. Feature scaffolding created (folders, types)
- [x] 04. Data layer (api + cache directives)
- [x] 05. PLP + filters + URL sync + streaming + skeletons
- [x] 06. PDP + generateMetadata (OG/twitter) + not-found
- [x] 07. Cart store + persist + header counter
- [x] 08. error.tsx, empty states, offline, retry
- [x] 09. Recommendations (visited categories)
- [x] 10. Tests (unit + integration)
- [x] 11. README written
- [~] 12. Verification — partial. Sandbox could not run `npm install` (npm registry blocked), so `npm run build`/`npm test` must be run locally. `tsc --noEmit` was run after writing all files; the only remaining errors are TS2307 (missing modules: zustand, vitest, @testing-library/*) which resolve as soon as `npm install` runs on the dev machine.

### Local verification commands (run on your machine)

```bash
npm install
npm run typecheck   # expected: 0 errors
npm run lint
npm test            # expected: all suites pass
npm run build       # expected: green build with Cache Components on
npm run dev         # http://localhost:3000
```

## 13b. Runtime fix log

- **Next 16 forbids `next/dynamic({ ssr: false })` in Server Components.** Was used in `app/page.tsx`, `app/products/page.tsx`, `app/cart/page.tsx`, `src/shared/components/Header/Header.tsx` to defer client islands. Fix: replaced with direct imports. The Client Components 
## 15. New modules (review round 2)

| Module                                              | Purpose                                                                                                                                |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/api/config.ts`                          | Versioned base URL (`API_VERSIONS["v1"]`) + endpoint catalog. Single source of truth for any HTTP path in the app.                     |
| `src/shared/api/errors.ts`                          | `ApiError` (serializable) shared by server + client transports.                                                                        |
| `src/shared/api/http.server.ts`                     | `server-only` fetch wrapper. Used by `products.api.ts`. Owns nothing but transport.                                                    |
| `src/shared/api/http.client.ts`                     | Browser-safe fetch wrapper. AbortController-friendly, returns typed payloads.                                                          |
| `src/features/products/services/products.client.service.ts` | Client-side product/category fetchers that delegate to `http.client` and `endpoints.*`.                                          |
| `src/features/products/hooks/useProducts.ts`        | Client hook: loading/error/data state + retry (nonce-bumping) + AbortController cancellation. Used by CartView and RecommendedProducts. |
| `src/features/checkout/components/CheckoutView/`    | Simulated checkout screen with totals, fake card form, processing -> success states. Clears cart on success.                            |
| `app/checkout/page.tsx`                             | Thin Server-Component shell hosting CheckoutView; `robots: noindex`.                                                                    |
| `src/shared/components/SmartLink/SmartLink.tsx`     | Drop-in `next/link` replacement: debounced `router.prefetch` on hover, instant prefetch on touchstart. Wired into ProductCard.          |

## 16. Open Graph - what changed

- Confirmed OG/`og:*` is the universal protocol consumed by Facebook, WhatsApp, LinkedIn, Discord, Pinterest, Slack, Telegram. No "Discord card" or "LinkedIn card" exist - they all read OG. Twitter has its own card (`twitter:*`) already present.
- PDP `generateMetadata` now emits:
  - `og:image` 1200x1200 + `og:image:type` (avoids LinkedIn cropping + WhatsApp square crop).
  - `og:type=product` + `og:price:amount` / `og:price:currency` via `other` (Pinterest Rich Pin friendly, FB richer preview).
  - `product:*` namespace (`availability`, `condition`, `retailer_item_id`, `category`) - read by FB commerce + Pinterest.

## 17. Retry bug fix (cart)

- Root cause: CartView's "Retry" button only cleared the local `error` state. The fetch effect had `[hydrated, items.length]` as dependencies and never re-ran.
- Fix: introduced `useProducts` hook with an internal `retryNonce` that, on `retry()`, bumps and triggers the effect again under a fresh `AbortController`. CartView now calls `retry()` directly.

## 18. Smart prefetch

- `SmartLink` schedules `router.prefetch(href)` after an 80 ms hover debounce, cancels it on `mouseleave`, and prefetches immediately on `touchstart` (mobile cannot hover).
- Layered on top of Next's built-in viewport prefetching - intent prefetch warms cards the user is *about* to click, even when they scrolled past them quickly.
- Wired into ProductCard. PDP, recommended rail and home featured cards all benefit automatically.
