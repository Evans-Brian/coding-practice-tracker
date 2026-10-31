# Coding Practice Tracker

A personal coding practice app for building problem-solving skills over time.
It includes the complete NeetCode 150, extra exercises, notes, repeat practice,
and a daily points dashboard.

## Features

- Problems grouped by topic and difficulty, with links to LeetCode.
- An unfinished-question picker that respects study priorities.
- Three study tiers, with LRU Cache first in Medium Priority and only the
  Prioritized tier included in the random picker and prioritized progress.
- Not Prioritized has its own page between Done and Daily points. The main page
  shows Prioritized and Medium Priority; completed problems still use Repeat or Done.
- Section relevance scores plus question relevance and expandable company-list
  evidence, with the reporting window and limitations shown in the interface.
- Shared notes, completion counts, and Repeat and Done lists.
- Custom Python exercises with examples, runnable tests, and downloadable packs.
- Daily points: Easy = 0.5, Medium = 1, Hard = 2. Each problem scores at most once
  per New York calendar day; completing it on another day earns points again.
- Earlier completions without dates remain in the tracker as undated history.
- Extra study entries add 0.5 or 1 point for today, with an optional note. They
  appear in daily totals and can be removed without changing problem progress.
- Trees sections include a reference for inorder, preorder, and postorder traversal.
- Topic strategy notes have visible clues and expandable approach, tradeoff,
  and pitfall notes, with focused guidance for hard tree/list sections. 1-D DP
  leads with a seven-step checklist, followed by common clues and Greedy/Backtracking
  comparisons. Other practice, Bit Manipulation, and LRU Cache
  omit section guides. Notes appear in practice, Repeat, and Done; the original
  binary-search template and boundary instructions remain available.

Progress and completion events are stored in Cloudflare D1. Local databases,
environment files, and browser drafts are not included in the repository.
Legacy record identifiers remain stable so existing progress and drafts continue
to load after interface changes.

## Development

```sh
npm ci
npm run build
npm run dev
```

Apply the pending local database migrations before using the tracker; see
the Local D1 migrations section below. A fresh checkout needs all migrations
in filename order.

```sh
node --experimental-strip-types --test tests/*.test.mjs
npx tsc --noEmit
node scripts/verify-neetcode150.mjs
node scripts/verify-study-priorities.mjs
node scripts/verify-question-relevance.mjs
python scripts/verify-variation-practice.py
```

The app uses React, TypeScript, [Vinext](https://github.com/cloudflare/vinext),
Cloudflare Workers, and Drizzle migrations. Publishing uses the Sites workflow;
the tracked hosting manifest identifies the existing deployment. Use your own
Site identity when publishing a separate copy.

## Relevance scores

`app/study-priorities.ts` keeps display tiers and relevance separate from the
original catalog buckets and saved question IDs. The current dashboard contains
112 prioritized, 20 medium-priority, and 20 not-prioritized questions. Hard trees
are in the middle tier; hard linked lists remain in the last tier. LRU Cache has
its own first section in Medium Priority.

`app/question-relevance-data.json` contains only matching question metadata from
25 company six-month lists in the public
[liquidslr company collection](https://github.com/liquidslr/leetcode-company-wise-problems),
pinned to commit `2b71796266751b4736a7ef180efb6847879166ee` (October 21,
snapshot labeled October 20, 2026). The approximate window is April 20–October 20.
The source has no per-interview dates, role filters, report-count denominators,
or documented frequency normalization. Twelve lists have fewer than ten eligible
questions. Raw values are therefore used only for within-company relative ranks.
Coverage is not an interview probability; acceptance rate is excluded.

Question relevance uses 45% topic value, 20% curated-list coverage, and up to 35%
recent evidence. Curation values are 95 for Grind 75 membership, 70 for NeetCode
150, and 60 for dashboard extras. Hard-only sections describe incremental study
depth, so individual hard questions use the parent topic's baseline. Recent
evidence combines 65% mean within-company percentile with 35% logarithmically
scaled company breadth. The recent weight shrinks linearly below four matching
company lists. Missing evidence uses only the renormalized topic/curation prior;
it never becomes zero relevance. Tiers are user-selected and are not reassigned
by question scores. Custom drills are outside this scoring model.

## Prerequisites

- Node.js `>=22.13.0`
- Portable: Windows, macOS, or Linux; no Bash required
- Managed Linux: managed Linux runtime with Bash, `flock`, `curl`, `sha256sum`, and GNU `timeout`
- Git is required only for publishing

## Sites Lifecycle

The Sites initializer copies the shared starter and selects managed-linux only when `SITES_MANAGED_LINUX_CONTAINER=1`; otherwise it selects portable. It saves the selection only in ignored `.sites-runtime/execution-profile.json`. Both profiles copy/configure first, then use the plugin's separate `install-dependencies.mjs` step to measure installation independently. Edit source under `app/` and follow the Sites skill for installation, preview, builds, and publishing.

Run `node <plugin-root>/scripts/configure-execution-profile.mjs` only when the profile is unknown for the current checkout and environment. Profile changes do not alter tracked source or require reinstalling otherwise-valid dependencies; restart an existing preview to use the new selection. Do not commit or upload `.sites-runtime/`.

This starter does not use `wrangler.jsonc`.

`install:ci` runs `npm ci` once against the shared lockfile, disables parent-workspace discovery, and includes required dev/optional dependencies despite production/omit settings. Sharp defaults to prebuilt binaries unless explicitly configured otherwise. Do not overlap installers.

- **Portable:** Preserve host HOME, npm cache, registry, proxy, temporary paths, retry/concurrency settings, and lifecycle-script policy. Use `--prefer-offline --no-audit --no-fund`.
- **Managed Linux:** Use the existing project-local HOME/cache/tmp setup and Linux install lock, tarball preflight, and timeout. Restore the image-seeded npm cache only when its lockfile hash matches; retain network fallback. Builds keep their existing timeout. These helpers are not invoked by the portable profile.

`scripts/sites-env.mjs` preserves the caller's HOME, npm cache, proxy, XDG, and temporary-directory configuration while defaulting Wrangler and Miniflare state to the checkout. If npm reports an unwritable cache, select a writable path with `npm_config_cache` for that install. The `dev` and `start` scripts also keep Wrangler logs inside the checkout. Generated `.sites-runtime/` and `.wrangler/` directories are disposable and ignored by Git.

On portable, `npm run dev` uses `vinext dev` with HMR, starting at port 5173. Vinext records the running server in ignored `.vinext/` state, rejects an ordinary duplicate launch, and recovers stale state after a stopped process; exactly simultaneous starts can race. Pass `--port <port>` or `--hostname <host>` after `npm run dev --` when needed; keep portable previews on loopback.

For browser QA on managed Linux, use `sites-preview start`. The project's dev script runs Vite and accepts the supervisor's `--host 0.0.0.0 --port 4173 --strictPort` arguments. The internal browser uses `http://terminal.local:4173/`; it is not a user-facing URL. The supervisor owns the preview lifecycle. The ignored local profile survives the supervisor's cleared process environment.

The portable profile simulates ChatGPT sign-in only for loopback development requests. Visit `/signin-with-chatgpt?return_to=/` to sign in as `local_seedy` (`seedy@sites.test`, display name `Seedy`) and `/signout-with-chatgpt?return_to=/` to sign out. The development cookie preserves that identity across server restarts. Mock auth is disabled in the managed-linux profile and is not included in production builds; hosted authentication remains dispatch-owned.

The Worker uses `vinext/server/fetch-handler`, including Vinext's config-aware image handling. After building, `npm start` runs that Worker locally through Wrangler on `127.0.0.1`, sharing `.wrangler/state` with dev preview and local D1 migrations; it does not deploy the site or simulate sign-in. Use the URL printed by the server. Pass `npm start -- --port <port>` to select a different built-preview port.

Local previews use Miniflare's placeholder `Request.cf` metadata without a network lookup. Set `CLOUDFLARE_CF_FETCH_ENABLED=true` to opt into fetching preview metadata; this setting does not change hosted request metadata.

Local tool usage metrics are disabled by default. Set `WRANGLER_SEND_METRICS=true` to opt in.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` defines saved progress and dated completion events
- `@cloudflare/workers-types` provides Worker types; `cloudflare-env.d.ts` declares optional `DB`/`BUCKET` bindings—update these declarations if binding names change
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Use it as the durable user key; use email and name for display or contact purposes.

SIWC-authenticated workspace sites may also receive `oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty `name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use the returned `userId` as the stable user key for user-owned records; do not use email as a durable identifier.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the OAuth cookies, and identity header injection. Do not implement app routes for those reserved paths. Routes that do not import and call the helper remain anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the Sites hosting platform's access policy controls for workspace-wide restrictions, or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write actions tied to the current ChatGPT user. Leave public content anonymous.

## Local D1 migrations

For a D1-backed local preview, generate SQL with `npm run db:generate`. Build once through the Sites skill's build entrypoint (or `npm run build` for standalone use) to generate `dist/server/wrangler.json`, rebuilding if bindings change. From the project root, apply each pending migration in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_example.sql
```

Replace the filename with the pending migration and `DB` with your D1 binding name if different. Use `.wrangler/state`, not `.wrangler/state/v3`; Wrangler adds the versioned directories. Do not replay migrations already applied locally. This updates only the preview database; publishing applies production migrations separately.

## Diagnostic Commands

- `npm run install:ci`: perform the one locked dependency install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: preview the built Worker locally with D1/R2 support
- `npm run db:generate`: generate Drizzle migrations after schema changes

When using the Sites plugin, follow its skill instructions for installation, builds, and publishing. These npm commands remain available for standalone use.

The portable build runs Vinext directly without a host `timeout` command. The managed-linux build uses `scripts/build-verified.sh` and its existing `SITES_BUILD_TIMEOUT` setting.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
