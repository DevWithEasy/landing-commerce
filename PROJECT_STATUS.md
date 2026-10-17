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
- **Feature Status:** Pure foundation stage; no custom commerce features, modules, or builder components have been implemented yet.

### Remaining Roadmap (Phased Implementation)
- **Phase 0:** Review/align scaffold structure, configure database connections, configure Inertia.js + React + TypeScript, TailwindCSS tokens, and Pest PHP 3 (Current focus).
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
- **PHP CLI:** Laragon PHP 8.3.33 (verified active, `zip` extension enabled)
- **Composer:** 2.10.2
- **MySQL Community Server:** 8.4.3
- **Node.js / npm:** 24.19.0 / 11.17.0
- **Laravel Framework:** 13.37.0

## 4. Exact Next Step
- **Action:** Phase 0, Task 3 & Task 4: Inspect boilerplate cleanup requirements and configure database connections (SQLite for isolated tests, MySQL for development & concurrency test harness).
- **Permission Boundary:** Report findings and proposed changes before editing application code or database configuration.

## 5. Important Unresolved Issues & Prerequisites
1. **PHP CLI `zip` Extension:** Resolved (verified enabled in Laragon PHP 8.3.33).
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
