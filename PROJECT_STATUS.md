# Project Status & Session Handover: Landing Commerce Starter Kit

## 1. Project Purpose & Architecture Summary
- **Purpose:** An enterprise-grade, single-tenant, self-hosted e-commerce application designed for single-product and high-converting campaign landing pages in Bangladesh (Cash on Delivery, 64-district delivery rates, local courier/SMS integrations).
- **Architecture:** Modular Monolith using **Laravel 13.x (PHP ^8.3)** backend, **React + TypeScript via Inertia.js** for admin/page builder workflows, and a **Server-Side Blade AST Component Renderer** for customer-facing landing pages with zero runtime JS overhead.
- **Security & Integrity:** Validated JSON AST block registry (no raw merchant JS or unsanitized HTML), pessimistic row locking (`lockForUpdate()`) on MySQL, UUID checkout idempotency keys with cache locks, and idempotent stock replenishment (`is_restocked` flag).

## 2. Completed Work vs. Remaining Tasks
### Completed Work
- **Compatibility Audit & Specification Alignment:** Completed and verified across all 5 planning documents (`AGENTS.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `PROJECT_SPEC.md`, `TESTING.md`).
- **PHP Environment Readiness:** Verified Laragon PHP 8.3.33 CLI with `extension=zip` enabled.
- **Laravel 13 Core Scaffolding:** Laravel 13.37.0 scaffolded successfully at `I:\coding_world\laragon\www\landing-commerce`.
- **Default Database Migrations:** Default Laravel migrations executed and completed successfully using SQLite.
- **Git Repository Initialized (Phase 0, Task 2):** Verified `.gitignore` (ignoring `.env`, `.env.*`, `vendor/`, `node_modules/`, `database/*.sqlite*`, storage sensitive files), initialized git repository on `main`, and created baseline initial commit (`7d27746`).
- **Scaffold Boilerplate Cleanup (Phase 0, Task 3):** Removed default `resources/views/welcome.blade.php`, configured minimal JSON health check route at `/` in `routes/web.php`, and verified all tests pass (`bb300c4`). Left `resources/js/app.js` and `ExampleTest.php` for later phases.
- **Database Connections Configured (Phase 0, Task 4):** Verified SQLite as working default (`database/database.sqlite`, 9 foundation tables) via `artisan db:show`. Verified automated testing isolation via SQLite `:memory:` in `phpunit.xml` (all tests passing). Verified MySQL 8.4.3 service availability on `127.0.0.1:3306` with PDO authentication. Updated `.env.example` with `# DB_DATABASE=landing_commerce` placeholder (`c9577d4`).
- **Inertia.js + React + TypeScript Configured (Phase 0, Task 5):** Installed `inertiajs/inertia-laravel v3.5.1`, configured `HandleInertiaRequests` middleware in `bootstrap/app.php`, created minimal root template `resources/views/app.blade.php`. Installed `@inertiajs/react 3.9.1`, `react 19.3.1`, `react-dom 19.3.1`, `typescript 7.0.2`, `@vitejs/plugin-react 6.1.2`. Configured `tsconfig.json` with strict type-checking and `@/*` aliases, configured `vite.config.js` with React plugin and `import.meta.dirname`. Verified `npm run type-check` (exit code 0), `npm run build` (exit code 0), and PHP test suite passing 100% (`1298ff0`).
- **CSS & UI Design System Configured (Phase 0, Task 6):** Installed `@tailwindcss/forms`, `@tailwindcss/typography`, and `lucide-react`. Configured design tokens (brand primary palette, accent conversion palette, border radii tokens, typography) in `resources/css/app.css`. Created typed reusable UI and layout primitives in `resources/js/Shared/` (`Button.tsx`, `Card.tsx`, `Container.tsx`). Verified `npm run type-check` (exit code 0), `npm run build` (exit code 0), and PHP test suite passing 100% (`2f03b61`).
- **Quality Tooling Configured & Phase 0 Exit Criteria Met (Phase 0, Task 7):** Installed Pest PHP (`pestphp/pest ^4.7.8` & `pestphp/pest-plugin-laravel ^4.1.0` supporting Laravel 13). Replaced default ExampleTest files with Pest smoke tests. Verified Laravel Pint code styling (`./vendor/bin/pint --test` passed). Installed and configured ESLint 9 flat config (`eslint.config.js`) and Prettier (`.prettierrc`, `.prettierignore`). Verified all quality gates: `php artisan test` (100% pass, 2 tests, 3 assertions), `npm run type-check` (0 errors), `npm run lint` (0 errors), `npm run format:check` (passed), and `npm run build` (passed in 6.71s) (`0a4e789`).
- **Phase 0 Status:** **100% COMPLETE.** Pure foundation established with verified automated tooling gates.
- **Catalog Database Migrations & Models (Phase 1, Task 1):** Created and migrated tables `products`, `product_variants`, and `product_images` with strict `decimal(12, 2)` monetary handling, JSON variant attributes, and cascading foreign keys. Created Eloquent models in `app/Modules/Catalog/Models/` (`Product`, `ProductVariant`, `ProductImage`) with typed relationship declarations and attribute casts. Verified via 6 comprehensive Pest tests covering decimal prices, slug/SKU uniqueness, primary image resolution, and cascade deletion (`fce7d1f`).
- **Catalog Domain Logic & Actions (Phase 1, Task 2):** Implemented `VariantMatrixGenerator` for Cartesian product attribute generation, `CreateProductAction` and `UpdateProductAction` with transaction safety, automatic slug/SKU collision handling, and standalone/variant support. Added inventory query scopes on `ProductVariant` (`inStock`, `outOfStock`, `lowStock`) and `Product` (`active`, `inStock`, `outOfStock`, `lowStock`). Verified via 8 comprehensive Pest tests (`tests/Feature/CatalogDomainTest.php`) covering matrix generation, default variant auto-generation, duplicate slug suffixing, price validations, and stock scopes (`3e624ca`). All 16 suite tests passing 100%.
- **Media & Image Optimization Engine (Phase 1, Task 3):** Installed and verified `intervention/image` v4.4.0 with GD driver. Configured storage symlink (`artisan storage:link`). Created `MediaUploadService` with strict binary MIME inspection via `finfo_file` (allowing only raster formats WebP, PNG, JPEG; rejecting SVGs and disguised payloads), 40-character random filename generation, automatic WebP conversion (quality 85), responsive variant generation (`thumb` 300px, `medium` 800px), and automated cleanup of main and variant assets on deletion. Verified via 6 comprehensive Pest tests (`tests/Feature/MediaUploadServiceTest.php`). All 22 suite tests passing 100% (`a7de40e`).

### Remaining Roadmap (Phased Implementation)
- **Phase 1:** Admin UI for catalog (Inertia + React) (Current focus).
- **Phase 2:** COD checkout engine, Bangladesh geographic dataset, and concurrency protection.
- **Phase 3:** Order management dashboard, fulfillment pipeline, and thermal invoice printing.
- **Phase 4:** Visual drag-and-drop page builder canvas and Blade AST renderer.
- **Phase 5:** Steadfast, Pathao, RedX courier and Greenweb/SSL Wireless SMS drivers (with offline mocks).
- **Phase 6:** Pure-PHP database backup/restore engine, preflight installer wizard, and production hardening.

## 3. Verified Local Environment & Important Paths
- **OS:** Windows (Laragon development environment)
- **Planning Files Directory:** `I:\coding_world\laravel\landing-commerce`
- **Application Workspace:** `I:\coding_world\laragon\www\landing-commerce` (Laravel 13.37.0 scaffolded)
- **PHP CLI Executable:** Laragon PHP 8.3.33 at `I:\coding_world\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe` (must use this full path or ensure it precedes system PHP in PATH)
- **Composer:** 2.10.2
- **MySQL Community Server:** 8.4.3
- **Node.js / npm:** 24.19.0 / 11.17.0
- **Laravel Framework:** 13.37.0

## 4. Exact Next Step
- **Action:** Phase 1, Task 4: Admin UI for Catalog (Products & Variants management interface with Inertia.js + React + TypeScript, form requests, and image upload integration).
- **Scope Boundary:** Keep UI strictly focused on catalog admin workflows without premature checkout or page builder features.

## 5. Important Unresolved Issues & Prerequisites
1. **PHP CLI Executable Path:** Always invoke `I:\coding_world\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe` for artisan/tests to ensure full extension compatibility (`ext-zip`, `ext-mbstring`, `ext-gd`).
2. **Local HTTP Server for Concurrency Testing:** When executing future multi-process MySQL concurrency tests (`runParallelHttpRequests`), Laragon's local web server (or `php artisan serve`) must be running to receive parallel incoming HTTP requests.

---

## 6. Token-Saving Rules for Future Sessions
All AI coding agents operating on this repository must strictly adhere to the following token-saving rules:
1. **Read `PROJECT_STATUS.md` first** to quickly load current context without redundant re-discovery.
2. **Read only specific planning or code files** strictly required for the immediate active task.
3. **Never reread the entire codebase by default.**
4. **Do not repeat completed audits or previous work** unless explicitly requested by the user.
5. **Work one step at a time** and keep reports clear and concise.
6. **Never assume a task is completed** without inspecting terminal logs and verifying relevant evidence.
