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
- **Database Connections Configured (Phase 0, Task 4):** Verified SQLite as working default (`database/database.sqlite`, 9 foundation tables) via `artisan db:show`. Verified automated testing isolation via SQLite `:memory:` in `phpunit.xml` (all tests passing). Verified MySQL 8.4.3 service availability on `127.0.0.1:3306` with PDO authentication. Updated `.env.example` with `# DB_DATABASE=landing_commerce` placeholder.
- **Feature Status:** Pure foundation stage; no custom commerce features, modules, or builder components have been implemented yet.

### Remaining Roadmap (Phased Implementation)
- **Phase 0:** Configure Inertia.js + React + TypeScript, TailwindCSS tokens, and Pest PHP 3 (Current focus).
- **Phase 1:** Product catalog, variants matrix, and WebP media engine.
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
- **Action:** Phase 0, Task 5: Configure Inertia.js + React + TypeScript (`@inertiajs/react`, `react`, `react-dom`, TypeScript, `tsconfig.json` with strict type-checking, Vite React plugin, `@/*` aliases, and `resources/views/app.blade.php`).
- **Permission Boundary:** Report planned packages and config files before running npm install or scaffolding frontend files.

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
