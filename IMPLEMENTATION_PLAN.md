# Phased Implementation Plan: Landing Commerce Starter Kit

This plan lays out a step-by-step, milestone-driven roadmap. Each phase has concrete deliverables and exit criteria (automated tests and manual verification) before the next phase begins.

* **Target Workspace:** `I:\coding_world\laragon\www\landing-commerce` (documented for local deployment upon approval; do not move project files or create directories until instructed).
* **Local Development Runtime:** PHP 8.3.33 (CLI) | MySQL 8.4.3 | Node.js 24.19.0 / npm 11.17.0 | Composer 2.10.2 (distinguished from production hosting requirements).
* **Target Framework:** Laravel 13.x (`^13.0`).

---

## Phase 0: Development Environment & Foundation Setup
**Goal:** Initialize the single-tenant core repository with strict quality gates, testing harnesses, and fullstack tooling.

### Tasks
1. **Pre-Development Environment Verification:**
   - **PHP ZIP Extension Check:** The PHP `zip` extension is currently disabled in the local CLI environment. While Composer scaffolding may utilize alternative extraction mechanisms (such as system unzip binaries or `--prefer-source`), the PHP `zip` extension (`ext-zip`) is strictly required at runtime for the planned `ZipArchive` pure-PHP database and media backup feature (`php artisan commerce:backup`). Instruct the developer to verify the active CLI `php.ini`, enable `extension=zip`, and verify with `php -m | findstr zip`. AI agents must not edit PHP configuration or enable extensions directly.
   - **Composer Verification:** Confirm Composer's ability to download and extract distribution packages before executing project scaffolding.
   - **Image Extension Verification:** Confirm PHP 8.3+ CLI and verify `extension=gd` is active for image manipulation.
2. **Initialize Git Repository:** Create initial commit with `.gitignore` (ignoring `.env`, `node_modules`, `vendor`, `storage/*.key`, etc.).
3. **Scaffold Laravel 13 Application:**
   - Install Laravel 13.x using Composer:
     ```bash
     composer create-project laravel/laravel:^13.0 .
     ```
   - Remove default boilerplate files not required for single-tenant commerce.
4. **Configure Database Connections:**
   - Configure SQLite for isolated automated unit test runs (`phpunit.xml`).
   - Configure MySQL connection for local development and concurrency race-condition testing.
5. **Configure Inertia.js + React + TypeScript:**
   - Install `@inertiajs/react`, `react`, `react-dom`, and TypeScript.
   - Configure `tsconfig.json` with strict type-checking (`"strict": true`, zero `any` tolerance).
   - Setup Vite with `@vitejs/plugin-react` and path aliases (`@/*` pointing to `resources/js/*`).
   - Pre-compile production assets (`npm run build`); production must not depend on a persistent Node.js process to serve assets.
6. **Setup CSS & UI Design System:**
   - Install TailwindCSS with `@tailwindcss/forms` and `@tailwindcss/typography`.
   - Setup design tokens (primary colors, neutral shades, typography, border-radii).
   - Install `lucide-react` for modern icon set.
7. **Setup Quality Tooling:**
   - Install Pest PHP 3 for backend testing.
   - Setup Laravel Pint for PSR-12/Laravel backend code style.
   - Install ESLint and Prettier for TypeScript/React code quality.

### Exit Criteria & Verification
- `php artisan test` executes and passes green (100% pass rate).
- `npm run build` generates production bundle without type errors (`npm run type-check` exits code 0).
- `./vendor/bin/pint --test` passes with zero formatting violations.

---

## Phase 1: Product Catalog, Variants & Inventory Engine
**Goal:** Build a robust product and inventory management system supporting standalone products and multi-variant combinations.

### Tasks
1. **Database Migrations:**
   - `products` (id, title, slug, description, regular_price, sale_price, has_variants, status, timestamps).
   - `product_variants` (id, product_id, sku, name, attributes JSON, regular_price, sale_price, stock_quantity, manage_stock, timestamps).
   - `product_images` (id, product_id, variant_id, file_path, sort_order, is_primary, alt_text).
2. **Catalog Domain Logic & Actions:**
   - `CreateProductAction` and `UpdateProductAction`.
   - Variant generator matrix (e.g., Sizes [M, L, XL] × Colors [Black, Brown] = 6 variant records).
   - Low-stock and out-of-stock query scopes.
3. **Media & Image Optimization:**
   - Setup local public storage disk and symlink.
   - Restrict uploads to approved raster formats (WebP, PNG, JPEG) by default. Prohibit arbitrary SVG uploads; if SVG support is introduced, require a maintained, security-reviewed sanitizer (`enshrined/svg-sanitize`).
   - Create `MediaUploadService` with MIME verification via `finfo_file`, random filename generation, and automated WebP conversion using Intervention Image.
4. **Admin UI for Catalog:**
   - Products list with filters (status, stock level, search).
   - Intuitive product editor with variant generator matrix and image drag-and-drop uploader.

### Exit Criteria & Verification
- `php artisan test --filter=CatalogTest` passes covering product creation, variant generation, SKU uniqueness, and WebP image processing.
- `npm run type-check` passes with zero type errors on catalog interfaces.

---

## Phase 2: Cash on Delivery (COD) Checkout & Bangladesh Localization
**Goal:** High-conversion, frictionless checkout engine tailored for the Bangladesh market with concurrency-safe stock deduction and anti-duplication protection.

### Tasks
1. **Bangladesh Geographic Data & Shipping Matrix:**
   - Seed all 64 Districts (Zillas) and primary Upazilas/Thanas.
   - Create `shipping_zones` (Inside Dhaka, Sub-Dhaka, Outside Dhaka) with customizable rates.
   - Implement `ShippingCalculatorService` based on selected district.
2. **Order Placement Domain Action:**
   - `ProcessCodOrderAction`:
     - Validate BD phone number (`013-019`, 11 digits).
     - Check client-generated `idempotency_key` and atomic cache lock (`Cache::lock`) to prevent duplicate orders from rapid button clicks.
     - Begin database transaction.
     - Acquire pessimistic lock (`lockForUpdate`) on each variant row in MySQL.
     - Verify stock sufficiency and decrement quantity.
     - Create `orders` record with unique order number and enforce database `UNIQUE(idempotency_key)` constraint.
     - Create `order_items` snapshots (with `is_restocked = false`).
     - Commit transaction.
3. **Anti-Spam & Fraud Prevention:**
   - Rate limiting middleware on checkout endpoint (throttle by IP and telephone).
   - Phone blacklist verification.
   - Honeypot field in checkout form to catch automated bots.
4. **Customer-Facing Checkout Component:**
   - Lightweight, mobile-first COD form component with instant district shipping fee updates.
   - Thank You / Order Confirmation page with order tracking number and WhatsApp inquiry button.

### Exit Criteria & Verification
- `php artisan test --filter=CodCheckoutTest` passes.
- Genuine multi-process / parallel HTTP test against MySQL (rejecting sequential `collect()->map()`) verifies simultaneous purchases of the last available item result in exactly 1 order placed (HTTP 201), remaining requests rejected with out-of-stock (HTTP 422), and zero negative stock.
- Anti-duplicate test verifies identical `idempotency_key` submissions return existing order (HTTP 200) without decrementing stock twice.

---

## Phase 3: Order Management Dashboard & Fulfillment Pipeline
**Goal:** Empower merchants and fulfillment staff to efficiently process, pack, and track orders with idempotent inventory restoration.

### Tasks
1. **Order Pipeline & State Machine:**
   - States: `Pending`, `Confirmed`, `Processing`, `Handed to Courier`, `In Transit`, `Delivered`, `Returned`, `Cancelled`, `Spam`.
   - Implement state transition guards (e.g., cannot move from `Delivered` to `Pending`).
   - Implement idempotent restocking: transition to `Cancelled` or `Returned` (via admin intervention or duplicate courier webhook delivery) restores inventory if and only if `order_items.is_restocked == false`, then sets `is_restocked = true`.
2. **Order Audit Trail (`order_histories`):**
   - Automatically record every status change, timestamp, and responsible admin user.
3. **Admin Order Management UI:**
   - Real-time orders data table with search, status tabs, date filters, and export to CSV.
   - Order detail drawer/modal: customer details, address, ordered variants, pricing breakdown, internal notes.
   - Bulk status updates (e.g., select 10 orders -> mark as `Confirmed`).
   - Printable Thermal Invoice / Packing Slip (A4 and 80mm POS slip format) with barcode/QR code.

### Exit Criteria & Verification
- `php artisan test --filter=OrderFsmTest` passes, verifying state transitions, idempotent inventory restoration, and audit trail logs.
- Repeated order cancellation and duplicate webhook delivery tests confirm inventory is not incremented multiple times.
- Admin order list loads with pagination and CSV export functionality verified.

---

## Phase 4: Visual Drag-and-Drop Landing Page Builder
**Goal:** A secure, intuitive block-based landing page builder allowing merchants to craft custom sales pages without touching code.

### Tasks
1. **Schema-Driven AST Engine & Validator:**
   - Define TypeScript AST schema (`Block`, `PageAst`, `BlockProps`, `BlockStyles`).
   - Create Laravel AST Validator (`PageAstValidator`):
     - Validate AST strictly against an approved allowlisted block registry.
     - Strict CSS property whitelist (colors, backgrounds, padding, margins, font-size, text-align); reject `position: fixed` overlays, `z-index > 50`, `expression()`, `@import`.
     - Strict URL protocol whitelist (`http`, `https`, `tel`, `mailto`, `#`).
     - Absolute rejection of `<script>`, `onerror=`, `onload=`, `javascript:`, `data:`, `vbscript:`, and arbitrary unsanitized HTML.
     - Never render arbitrary merchant-provided JavaScript or unsanitized raw HTML.
2. **Block Component Library:**
   - Build approved blocks: `HeroBlock`, `ProductSelectorBlock`, `CodCheckoutBlock`, `BenefitsGridBlock`, `ReviewsBlock`, `VideoBlock`, `FaqBlock`, `CountdownTimerBlock`, `StickyBarBlock`.
3. **Visual Editor Interface:**
   - Left Sidebar: Block Palette (drag/click to add) & Block Tree (reorder / delete).
   - Center Canvas: Interactive live preview with Desktop, Tablet, and Mobile viewport toggles.
   - Right Inspector: Block Property editor (text inputs, color pickers, image pickers, spacing sliders).
   - Top Bar: Revision history, Undo/Redo, Save Draft, and Publish buttons.
4. **Public Landing Page Rendering:**
   - Route `/{slug}` dynamically resolves the published revision AST.
   - Server-Rendered Blade AST renderer with a performance target of initial HTML TTFB under 150ms (design target, not guaranteed, subject to host TTFB and caching) plus hydration islands for swatches/checkout.

### Exit Criteria & Verification
- `php artisan test --filter=AstSecurityTest` passes: payloads containing `<script>`, `onerror=`, `javascript:`, `data:`, or disallowed CSS return HTTP 422.
- `npm run type-check` passes with zero type errors on all AST block models and Zustand stores.

---

## Phase 5: Bangladesh Courier & SMS Gateway Integrations
**Goal:** Automate delivery dispatch and SMS notifications using popular Bangladeshi services with offline-ready mock drivers.

### Tasks
1. **Courier Driver Architecture:**
   - `MockCourierDriver`: Simulated consignment generation and tracking for offline development and testing.
   - `SteadfastCourierDriver`: API consignment creation, bulk booking, webhook tracking.
   - `PathaoCourierDriver`: OAuth token management, store/hub selection, price estimation, delivery creation.
   - `RedXCourierDriver`: Parcel creation and tracking.
2. **Courier Integration UI:**
   - "Send to Courier" button in Order details: automatically populates customer name, phone, address, and COD collection amount.
   - Automatic recording of tracking consignment code and tracking URL.
3. **SMS Gateway Driver:**
   - `MockSmsDriver`: Simulates SMS delivery in local logs.
   - Driver implementations for Greenweb, SSL Wireless, and SMSPoh.
   - Customizable SMS templates (Order Placed, Order Confirmed, Out for Delivery) with variable placeholders (`{order_number}`, `{customer_name}`, `{total}`).
4. **Encrypted Settings Management & RBAC:**
   - Encrypted storage for API keys and secrets.
   - Rate limiting on authentication endpoints to prevent brute-force dictionary attacks.
   - Server-side authorization: 3-Tier RBAC (`super_admin`, `store_manager`, `fulfillment_agent`) enforced via policies and gates on all administrative endpoints and sensitive operations.

### Exit Criteria & Verification
- `php artisan test --filter=CourierDriverTest` passes using Mock Driver without requiring live API keys.
- `php artisan test --filter=RbacTest` passes, verifying fulfillment agents cannot edit product prices, settings, or access backups.

---

## Phase 6: Production Hardening, Backup Engine & Self-Hosted Installer
**Goal:** Provide single-tenant deployment readiness for non-technical or standard cPanel/VPS hosting environments.

### Tasks
1. **Pure-PHP Database Backup & Restore Engine:**
   - Designed for environments where shell commands and `mysqldump` may be unavailable.
   - `php artisan commerce:backup`: Streams complete MySQL dump and uploaded media into a timestamped zip archive without relying on `mysqldump` or `proc_open()`.
   - `php artisan commerce:restore {file}`: Restores database tables with pre-restore syntax validation, checksum verification, and automated snapshot before execution to guard against MySQL DDL non-transactional implicit commit failures; provides structured recovery procedures.
2. **Web Installer / CLI Setup Wizard & Deployment Preflight Checks:**
   - Automated pre-flight checks:
     - PHP version (>= 8.3 required for Laravel 13).
     - Required extensions (`pdo_mysql`, `gd`, `fileinfo`, `mbstring`, `openssl`, `zip`, `curl`).
     - Database connection and privileges.
     - Document root isolation: public access directed to `/public` with `.env` inaccessible via HTTP (not relying on `.htaccess` as a substitute for directory isolation).
     - File permissions (`storage/`, `bootstrap/cache/`).
     - HTTPS enforcement and secure cookies.
     - Scheduled tasks / cron configuration (`php artisan schedule:run`) and queue worker strategy.
   - Do not claim hosting provider or package compatibility without verification.
   - Step-by-step database setup, migrations run, initial Super Admin account creation, and default demo landing page seeding.
3. **Production Optimization:**
   - Pre-compiled assets (`npm run build`); production must not depend on a persistent Node.js process to serve assets.
   - Config caching, route caching, view caching.
   - Security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, `.htaccess` secondary defense for `.env` and `.git`).

### Exit Criteria & Verification
- `php artisan commerce:backup` creates a valid zip archive; `commerce:restore` restores the database state cleanly.
- `php artisan test` passes full suite on MySQL database.
- Web installer wizard seeds demo store in under 3 minutes.
