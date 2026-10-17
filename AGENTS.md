# Operational Guidelines for AI Coding Agents: Landing Commerce Starter Kit

This repository is an enterprise-grade, single-tenant, self-hosted e-commerce application. All AI coding agents operating on this repository must strictly adhere to the following rules and instructions.

---

## 1. Prime Directives & Constraints

1. **Never Invent Successful Test Results:**
   - Under no circumstances may an agent assert or claim that a test, build, or command succeeded unless it was executed via the terminal and verified in the output log.
   - If a test fails or a command fails, report the exact error and formulate a fix.

2. **Single-Tenant Integrity:**
   - Do not introduce multi-tenant SaaS patterns (e.g., `tenant_id` columns, tenant identification middleware, cross-tenant subdomains).
   - This starter kit is packaged and installed independently per client.

3. **Page Builder Security Guardrails:**
   - Never allow raw, unsanitized HTML or arbitrary JavaScript input in the page builder. Never render arbitrary merchant-provided JavaScript or unsanitized raw HTML.
   - The page builder must strictly operate via a validated JSON Abstract Syntax Tree (AST) checked against an approved allowlisted block registry.
   - Prohibit unsafe HTML tags, JavaScript URLs (`javascript:`, `data:`, `vbscript:`), inline event handlers (`onclick`, `onload`, `onerror`), and unsafe CSS properties (`position: fixed` overlays, `z-index > 50`, `expression()`, `@import`).
   - Dynamic user-side features (countdown timers, variant swatches, COD form) must use pre-compiled React/Blade components with sanitized properties.
   - Restrict image uploads to approved raster formats (WebP, PNG, JPEG) by default; if SVG support is introduced, require a maintained, security-reviewed sanitizer (`enshrined/svg-sanitize`).

4. **Database & Concurrency Safety:**
   - Never decrement stock without a pessimistic row lock (`lockForUpdate()`) inside a database transaction on MySQL.
   - Never assume concurrency works based solely on SQLite tests or sequential loops: SQLite does not support row-level locking (`SELECT ... FOR UPDATE`), and sequential iteration (`collect()->map()`) does not simulate parallel race conditions. Always verify race conditions against MySQL using genuine parallel or multi-process HTTP test harnesses.
   - Always enforce idempotency keys on checkout (`idempotency_key` unique constraint + cache lock) and maintain an `is_restocked` flag on order items to prevent duplicate stock updates on repeated cancellations or duplicate webhook re-deliveries.
   - Acknowledge that MySQL DDL statements (`CREATE TABLE`, `DROP TABLE`, `ALTER TABLE`) trigger implicit commits and cannot be rolled back inside a single transaction. Implement pre-restore validation, checksums, and automated snapshots to handle restore failures safely.
   - All monetary amounts must be stored as `decimal(12, 2)` or integer cents—never as floating-point numbers.

5. **Secrets, Authorization & Production Safety:**
   - Never commit `.env` files, production API tokens, or encryption keys.
   - Enforce server-side authorization (policies/gates) on all administrative actions and sensitive backup operations.
   - Rate-limit authentication endpoints to prevent brute-force attacks.
   - Never deploy to a live production server or execute destructive database drops (`migrate:fresh`) without explicit human instruction.
   - Do not assume target hosting environments (cPanel/VPS) support specific PHP versions or extensions without running automated preflight checks. Laravel 13 requires PHP 8.3 or a compatible newer version.

---

## 2. Technology Stack Standards

* **Backend:** PHP 8.3+ with **Laravel 13.x (`^13.0`)**.
  - Scaffolding command: `composer create-project laravel/laravel:^13.0 .`
* **Frontend:** React 18 / 19 with TypeScript via Inertia.js.
  - Production assets must be pre-compiled (`npm run build`) before deployment; production must not depend on a persistent Node.js process to serve assets.
* **Styling:** TailwindCSS with strict design tokens (no uncoordinated arbitrary CSS spaghetti).
* **Icons:** `lucide-react`.
* **State Management (Builder):** `zustand` for page builder canvas state and undo/redo stacks.
* **Drag and Drop:** `@dnd-kit/core` and `@dnd-kit/sortable`.
* **Testing:** Pest PHP 3 for backend tests, Vitest for frontend unit tests, Playwright for E2E tests.

---

## 3. Code Quality & Conventions

### 3.1 Backend (PHP/Laravel)
* Use single-responsibility Action classes for business logic (e.g., `app/Modules/Checkout/Actions/ProcessCodOrderAction.php`).
* Keep controllers slim; delegate to Form Requests for input validation and Actions for business logic.
* Use strict types: declare `declare(strict_types=1);` at the top of new PHP classes where feasible.
* Format code using Laravel Pint (`./vendor/bin/pint`).
* Enforce server-side authorization checks and rate-limiting on sensitive routes.

### 3.2 Frontend (TypeScript/React)
* Zero `any` policy: Define explicit TypeScript interfaces for all component props, AST blocks, and Inertia page data.
* Keep components focused, modular, and reusable in `resources/js/Shared/` or `resources/js/Builder/`.
* Run type checks (`npm run type-check`) before marking any frontend task complete.

---

## 4. Phase-Gate Workflow

Agents must execute work strictly according to `IMPLEMENTATION_PLAN.md`:
1. **Pre-flight Check & Permission Boundary:**
   - Verify active CLI `php.ini` has `extension=zip` and `extension=gd` enabled, and confirm Composer dependencies can be downloaded and extracted before scaffolding. Note: The PHP `zip` extension is currently disabled in the local CLI environment and must be enabled by the developer in `php.ini`. AI agents must NOT edit PHP configuration or enable extensions directly.
   - Documented local workspace is `I:\coding_world\laragon\www\landing-commerce`. Do not move project files or create directories without explicit instruction.
2. **Phase Execution:** Implement only the scope of the active approved phase.
3. **Automated Verification:** Run `php artisan test` and `npm run type-check`. Concurrency tests must run against MySQL with a multi-process test harness.
4. **Summary & Approval:** Report test results with exact terminal logs and obtain human sign-off before advancing to subsequent phases.
