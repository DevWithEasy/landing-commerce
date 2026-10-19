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

---

## Phase 7: Storefront Core Architecture, Category Management & Appearance Schema
**Status:** 100% COMPLETE
**Goal:** Establish the foundational category catalog hierarchy, storefront mode settings, policy/content pages, dual homepage routing, and the appearance/theme configuration schema without disrupting existing landing pages or visual builder functionality.

### Scope & Dependencies
- Depends on: Phase 0-6 foundation (Products, Variants, Settings, Media Upload Service, RBAC).
- Primary Deliverable: Database schemas, models, controllers, and admin UI for Categories, Policy Pages, Store Branding, Storefront Mode, and Theme/Slider schema foundation.

### Tasks & Technical Specifications
1. **Category Database Migrations & Models (Intact Core Deliverable):**
   - Table `categories`: `id`, `name`, `slug` (unique), `description`, `image_path` (nullable), `parent_id` (self-referencing nullable foreign key with cascade on delete for subcategories), `sort_order` (integer default 0), `is_active` (boolean default true), `timestamps`.
   - Table `category_product`: `category_id` (foreign key), `product_id` (foreign key), composite primary key `(category_id, product_id)`.
   - Eloquent Model `Category` in `app/Modules/Catalog/Models/Category.php` with:
     - Relationships: `parent()` (belongsTo), `children()` (hasMany), `products()` (belongsToMany).
     - Helpers: `toTree()` static method to generate nested parent-child hierarchies.
     - Scopes: `scopeActive($query)`, `scopeRoot($query)` (parent_id is null).
   - Update `Product` model with `categories()` BelongsToMany relationship.
2. **Admin Category Management UI (Inertia + React):**
   - Routes in `routes/admin.php`: `Route::resource('categories', CategoryController::class)->except(['show'])`.
   - Controller: `App\Modules\Catalog\Controllers\CategoryController` handling index, store, update, destroy, and sort order updates.
   - Admin UI in `resources/js/Pages/Admin/Categories/Index.tsx`:
     - Parent category dropdown (hierarchical indentation).
     - Drag/sort reordering, active status toggles.
     - Image upload via existing `MediaUploadService` (WebP conversion).
     - Product count badges per category.
   - Update Product Create (`resources/js/Pages/Admin/Products/Create.tsx`) and Edit (`Edit.tsx`) views with a multi-category selector checkbox list.
   - RBAC: Authorized for `super_admin` and `store_manager`; strictly forbidden for `fulfillment_agent` (HTTP 403).
3. **Storefront General Settings & Mode Architecture (Intact Core Deliverable):**
   - Extend `settings` table with storefront configuration keys:
     - `store_name`, `store_tagline`, `store_logo_url`, `store_favicon_url`, `contact_phone`, `contact_whatsapp`, `contact_email`, `store_address`.
     - `ecom_storefront_mode`: Enum `'full_storefront' | 'landing_page_home'` (default `'full_storefront'`).
     - `home_landing_page_id`: Nullable integer referencing `landing_pages.id` (used when mode is `'landing_page_home'`).
   - Admin Settings UI tab for Storefront Branding & Mode in `resources/js/Pages/Admin/Settings/Index.tsx`.
4. **Policy & Content Pages Module (Intact Core Deliverable):**
   - Table `policy_pages`: `id`, `slug` (unique), `title`, `content` (sanitized markdown or rich text), `meta_seo` (JSON), `is_published` (boolean default true), `timestamps`.
   - Model `PolicyPage` in `app/Modules/PageBuilder/Models/PolicyPage.php`.
   - Seed standard Bangladesh e-commerce policies: Privacy Policy, Terms & Conditions, Return & Refund Policy, Shipping Policy, About Us, Contact Us.
   - Admin CRUD at `/admin/pages` for editing policies and custom content under RBAC (`super_admin`, `store_manager`).
   - Public route: `Route::get('/pages/{slug}', [StorefrontPageController::class, 'show'])->name('storefront.page.show')`.
5. **Dual Homepage Controller Architecture (Intact Core Deliverable):**
   - Update root route `/` handler:
     - If `ecom_storefront_mode === 'landing_page_home'` and valid published landing page exists, delegate seamlessly to `PublicLandingPageController::show`.
     - If `ecom_storefront_mode === 'full_storefront'`, delegate to `StorefrontHomeController::index` rendering the complete storefront home page.
     - Preserves existing landing page URLs under `/p/{slug}` and legacy redirects without route shadowing.
6. **Appearance & Theme Settings Schema Foundation:**
   - Extend `settings` with structured appearance tokens:
     - `theme_colors`: Primary brand accent, secondary accent, header background, footer background, body background, text color, sale badge color.
     - `theme_typography`: Google Font family (`Inter`, `Outfit`, `Hind Siliguri`, `Tiro Bangla`, `Poppins`), base font size.
     - `theme_ui`: Button style (`rounded`, `pill`, `sharp`), border radius (`sm`, `md`, `lg`, `full`).
     - `theme_header_footer`: Top announcement bar text, announcement background, sticky header toggle, footer payment icons toggle.
   - Admin Appearance Route: `Route::get('appearance/theme', [ThemeController::class, 'index'])->name('appearance.theme')` and `POST` update endpoint.
   - Architecture Boundary: Global Theme tokens strictly control the generic storefront (`/`, `/shop`, `/product/*`, `/cart`). Landing pages preserve their independent AST settings (`ast.settings`) and page-specific theme overrides, which apply strictly per landing page and never mutate the Global Theme.
7. **Hero Slider & Homepage Sections Schema Foundation:**
   - Table `sliders`: `id`, `title`, `subtitle`, `image_path`, `mobile_image_path` (nullable), `link_url`, `button_text`, `sort_order` (default 0), `is_active` (boolean default true), `timestamps`.
   - Model `Slider` in `app/Modules/Catalog/Models/Slider.php`.
   - Admin Slider CRUD at `/admin/appearance/sliders`.

### Acceptance Criteria
- `categories` and `category_product` migrations run cleanly on SQLite test database and MySQL without errors.
- Products can be assigned to multiple categories, and deleting a category cascades cleanly on the pivot table without deleting products.
- Toggling `ecom_storefront_mode` between `full_storefront` and `landing_page_home` instantly updates the root route `/` response.
- All existing landing page URLs under `/p/{slug}` and legacy root redirects (`/{slug}`) remain 100% operational.
- Policy pages render sanitized content with strict protection against XSS.
- `fulfillment_agent` role is strictly rejected (HTTP 403) from category, policy, and appearance mutations.

### Focused Tests
- `tests/Feature/CategoryAdminTest.php`: Category CRUD, image upload, parent-child nesting tree, and product association.
- `tests/Feature/DualHomepageModeTest.php`: Mode switching between storefront home and landing page home.
- `tests/Feature/PolicyPagesTest.php`: Public policy page rendering, draft protection, and admin CRUD.

---

## Phase 8: Responsive Storefront UI, Homepage Slider/Sections, Shop & Product Details
**Status:** Complete
**Goal:** Build a high-performance, mobile-first generic e-commerce shopping experience with a 2-row navigation header, admin-controlled hero slider, category sections, faceted search, product detail pages, and a Quick Order popup.

### Scope & Dependencies
- Depends on: Phase 7 (Categories, Sliders, Theme Settings, Dual Homepage Router).
- Primary Deliverable: Storefront React + TypeScript components via Inertia.js, responsive header/footer layout, Home, Shop, Category, and Product Details views.

### Tasks & Technical Specifications
1. **Storefront Layout & 2-Row Header (`StorefrontLayout.tsx`):**
   - Row 1 (Utility & Brand Bar):
     - Brand logo with home link.
     - Central live search bar with instant submit to `/shop`.
     - Customer Hotline / WhatsApp quick-contact link.
     - Wishlist icon with indicator badge.
     - Cart trigger with live count badge.
     - Customer Account icon (links to login/register).
   - Row 2 (Navigation Bar):
     - All Categories mega-dropdown menu (hierarchical parent-child flyout display).
     - Primary navigation links: Home, Shop, Top Categories, About, Contact.
   - Mobile Header & Bottom Navigation Bar:
     - Mobile top bar with hamburger menu drawer, brand logo, search toggle, and cart icon.
     - Slide-over mobile drawer containing Category accordion (expandable subcategories), store links, and hotline/WhatsApp.
     - Sticky bottom navigation bar: Home, Categories, Shop, Cart, Account.
   - Storefront Footer:
     - Payment & delivery badges (Cash on Delivery, 64-district delivery guarantee).
     - 4-column layout: About store, Quick links, Policy pages, Customer care.
2. **Dynamic Storefront Home Page (`/`):**
   - Hero Slider (directly below header):
     - Full-width responsive carousel with admin-controlled slides, text overlays, CTA buttons, and autoplay pause on hover/focus.
   - Category Grid:
     - Interactive circular thumbnails for categories with child subcategory counts.
   - New Arrivals Section:
     - Grid of recently created products with discount badges, pricing, and Quick Order button.
   - Featured Products & Best Sellers Sections:
     - Curated showcase with sale discount badges and Quick Order.
   - Category-Based Product Sections:
     - Root categories with active product cards.
   - Trust & Value Proposition Badges:
     - 100% Authentic Products, Nationwide Cash on Delivery, Fast 24-72h Delivery, 7-Day Easy Return.
   - Admin Controls:
     - Configurable section toggles in `SettingsService` (`homepage.hero_slider_enabled`, `homepage.categories_enabled`, etc.).
3. **Faceted Shop & Catalog Browsing (`/shop`):**
   - Multi-parameter filtering with URL state synchronization:
     - Category filter (sidebar accordion with parent-child subcategory hierarchy).
     - Stock status filter (in-stock only toggle).
     - Sorting: Newest, Price: Low to High, Price: High to Low, Popularity.
     - Search query matching title and description.
   - Responsive sidebar filter drawer on mobile devices.
   - Server-side pagination with query string preservation.
4. **Category Browsing Page (`/category/{slug}`):**
   - Category header, title, description, and breadcrumb navigation.
   - Subcategory drill-down with active status validation (HTTP 404 for missing/inactive categories).
   - Inherits all filtering, sorting, and pagination capabilities from Shop.
5. **Product Details Page (`/product/{slug}`):**
   - Image Gallery: Main image with hover zoom and interactive thumbnail rail.
   - Pricing: Regular price, sale price, and dynamic discount percentage badge.
   - Variant Swatches: Interactive option pills (with variant image switching); real-time price and stock level update.
   - Quantity Stepper (+ / -) with min 1 and max available variant stock bounds.
   - Dual Call-to-Action Buttons:
     - **"Buy Now" / "সরাসরি অর্ডার করুন"**: Routes directly into unified `/checkout/{product:slug}?variant={id}&quantity={qty}` without duplicating checkout code.
     - **"Add to Cart"**: UI entry point with toast alert.
     - **"WhatsApp Inquiry"**: Direct WhatsApp inquiry with product title prefilled.
   - Estimated Delivery Widget: Displays standard BBS shipping charges and transit times for Inside Dhaka (24-48h ৳70) and Outside Dhaka (48-72h ৳130).
   - Tabbed Content: Overview / Description, Specifications table, and Delivery Policies.
   - Related Products collection sharing categories.
6. **Hero Slider Admin Management (`/admin/sliders`):**
   - Admin CRUD UI (`Admin/Sliders/Index.tsx`), Controller (`SliderController`), and Form Requests.
   - Secure raster image upload (JPEG, PNG, WebP) converted to WebP via `MediaUploadService` with desktop & mobile variants.

### Acceptance Criteria & Verification
- Storefront header renders 2-row layout cleanly on desktop and switches to responsive drawer and sticky bottom bar on mobile.
- Admin-controlled slider displays images, text, and links smoothly with mobile image fallback.
- Inactive or draft products return HTTP 404 on storefront routes.
- Product Details page dynamically switches prices, variant images, and stock badges upon swatch selection.
- All interactive elements adhere to strict TypeScript interfaces with zero `any`.
- Verified with 23 dedicated Phase 8 feature tests (250+ assertions):
  - `tests/Feature/SliderAdminTest.php` (6 tests, 34 assertions)
  - `tests/Feature/StorefrontShopTest.php` (7 tests, 100 assertions)
  - `tests/Feature/StorefrontProductDetailTest.php` (3 tests, 43 assertions)
  - `tests/Feature/StorefrontHomeSectionsTest.php` (3 tests, 52 assertions)
  - `tests/Feature/HomepageModeRoutingTest.php` (5 tests, 20 assertions)
- `npm run type-check` and `npm run build` completed with zero errors. All regression test suites passing 100%.

---

## Phase 9: Server-Authoritative Cart Engine, Mini-Cart & Unified Storefront Checkout
**Status:** Completed
**Goal:** Build a robust, tamper-proof shopping cart and unified checkout engine that shares the existing pessimistic row-locking, anti-spam, and order pipeline infrastructure with landing pages.

### Scope & Deliverables
- Completed Deliverables: `Cart` and `CartItem` models and migration, `CartManagerService`, `CartController`, Slide-over `MiniCartDrawer`, dedicated `/cart` page, unified `CheckoutPageController`, `StoreCodOrderRequest` server-side cart population, and `CodCheckoutController` post-order cart clearance.

### Implemented Architecture & Technical Highlights
1. **Cart Persistence & Cryptographic Guest Token Architecture:**
   - Database tables `carts` and `cart_items` with explicit foreign key constraints (`fk_cart_items_cart_id`, `fk_cart_items_variant_id`) ensuring zero collision and clean cascading.
   - Secure 64-character hex unpredictable guest token stored in session and HttpOnly cookie (`landing_commerce_cart_token`), preventing IDOR enumeration or cross-guest tampering.
   - Unique database constraint `UNIQUE(cart_id, variant_id)` (`cart_items_cart_variant_unique`) guaranteeing that duplicate additions automatically merge into existing line items.
2. **Server-Authoritative Price & Stock Validation:**
   - Stored and client-supplied prices are completely disregarded. Prices and line totals are dynamically calculated from active database models (`Product` & `ProductVariant`), taking into account active sale prices and regular prices.
   - Stock boundary checks enforce positive integers (1 to 100) and prevent adding or updating beyond available `variant.stock_quantity`.
3. **Slide-Over Mini-Cart Drawer & Dedicated `/cart` Page:**
   - Accessible slide-over drawer triggered by header/sticky bar cart icons or after "কার্টে যোগ করুন" (Add to Cart). Supports keyboard ESC closing, backdrop tap, and accessible focus.
   - Steppers for quantity modification, remove item buttons, line items with variant labels and thumbnails, and subtotal.
   - Full `/cart` page at `/cart` with clear itemized tables, empty-cart states, order summary card, and proceed to checkout action.
4. **Unified Checkout Controller & Experience (`/checkout`):**
   - Seamlessly supports Journey A (Cart Checkout) and Journey B (Direct Quick Order / Campaign Buy Now).
   - In Cart Mode (`checkout_source: 'cart'`), items are populated server-side from the guest's authenticated cart session.
   - In Direct Mode (`/checkout/{slug}?variant={id}&quantity={qty}`), direct product is purchased while preserving the customer's cart.
   - Upon successful order placement via `ProcessCodOrderAction`, only the purchased cart is cleared. Direct checkouts do not clear unrelated cart items.
   - Idempotent replays with an existing `idempotency_key` return the existing order without failing on empty cart validation or double-deducting stock.

### Acceptance Criteria & Verification
- 100% of automated tests pass:
  - `tests/Feature/CartEngineTest.php`: 13 tests, 66 assertions (persistence, guest isolation, simple/variant product additions, duplicate line merging, stock boundaries, invalid quantity rejection, server-authoritative pricing, item removal, cart clearing, IDOR protection, summary).
  - `tests/Feature/UnifiedCheckoutTest.php`: 8 tests, 65 assertions (cart mode vs direct mode, server item population, price tampering rejection, out of stock rejection, safe cart clearance on success, cart preservation on failed checkout, direct checkout cart isolation, idempotent replay without double deduction).
  - Full checkout regressions passing: `tests/Feature/CodCheckoutTest.php`, `tests/Feature/CustomerCheckoutComponentTest.php`, `tests/Feature/StorefrontShopTest.php`, `tests/Feature/StorefrontProductDetailTest.php` (22 tests, 256 assertions).
  - Live MySQL concurrency verification: `tests/Feature/CodConcurrencyMysqlTest.php` passed on MySQL 8.4.3.
- `npm run type-check`: 0 TypeScript errors.
- `./vendor/bin/pint --test`: All files adhere to Laravel Pint standards.
- `npm run build`: Production assets pre-compiled cleanly in 7.78s.

---

## Phase 10: Customer Authentication, Account Portal, Order Tracking & Wishlist
**Status:** **100% COMPLETE**
**Goal:** Empower customers with secure accounts, self-service order tracking, order history, and persistent wishlists while strictly maintaining zero-friction guest checkout.

### Scope & Deliverables
- Completed Deliverables: `Customer` model & migration, `customer` guard & session provider, `CustomerAuthController`, `CustomerDashboardController`, `CustomerOrderController`, `OrderTrackingController`, `WishlistController`, `Wishlist` model & migration, `tracking_token_hash` on `orders`, React customer portal (`Login`, `Register`, `Dashboard`, `Orders`, `OrderDetail`, `Wishlist`, `TrackOrder`), and responsive `CustomerLayout`.

### Implemented Architecture & Technical Highlights
1. **Multi-Auth Guard Isolation & Session Security:**
   - Database table `customers` (`id`, `name`, `email` unique, `phone`, `password`, `address`, `district`, `upazila`, `is_active`, `timestamps`).
   - Authenticatable Eloquent model `Customer` with separate `'customer'` guard in `config/auth.php` and dedicated provider.
   - Complete isolation between admin `'web'` guard and customer `'customer'` guard (`Route::middleware(['web', 'auth:web'])` on admin routes; `Route::middleware('auth:customer')` on customer routes). Customers attempting to access `/admin` are strictly redirected to admin login.
   - Rate-limited login (5 attempts per minute with custom localized error messages) and secure session invalidation + token regeneration upon logout.
2. **Customer Account Portal & IDOR Protection:**
   - Dedicated portal views in `resources/js/Pages/Customer/` wrapped by `CustomerLayout.tsx`:
     - **Dashboard (`/customer/dashboard`):** Account overview, profile stats, and recent 5 orders.
     - **Order History (`/customer/orders`):** Paginated orders with status badges, item quantities, totals, and direct tracking buttons.
     - **Order Detail (`/customer/orders/{order:order_number}`):** Itemized breakdown, unit prices, delivery address, payment status, and courier consignment details.
   - Strict backend IDOR protection: all order and order-detail queries are explicitly scoped via `where('customer_id', $customer->id)`. Accessing another customer's order number returns HTTP 404.
3. **Secure Self-Service Order Tracking (`/track-order`):**
   - Direct tracking via unpredictable 64-character cryptographic token (`tracking_token` generated on checkout with SHA-256 hash stored in `tracking_token_hash`).
   - Guest tracking via Order Number + matching Customer Phone Number (normalized using `BdPhoneRule`).
   - Authenticated customer tracking by order number alone.
   - Anti-enumeration protection: mismatched phone numbers or non-existent order numbers return the exact same generic error (`No matching order found for the provided information.`) with HTTP 404.
   - Rate limiting via `throttle:10,1` rejecting automated scraping with HTTP 429.
   - Displays live order status timeline, delivery district, item summaries, totals, and live courier tracking URLs without exposing internal merchant audit notes or token hashes.
4. **Persistent Wishlist Engine (`/customer/wishlist`):**
   - Database table `wishlists` with unique constraint `UNIQUE(customer_id, product_id, variant_id)` preventing duplicate entries.
   - Server-side validation rejecting draft, archived, or non-existent products.
   - Responsive grid view (`Wishlist.tsx`) with product thumbnails, live prices, variant pills, "Add to Cart" directly into the cart engine, and item removal.
   - Strict ownership scoping on deletion (`Wishlist::where('id', $id)->where('customer_id', $customer->id)->firstOrFail()`).
5. **Preservation of Phase 9 Unified Cart & Checkout:**
   - Guest checkout remains 100% operational with zero account creation required.
   - Quick Order and Cart Checkout pipelines remain intact and identical.
   - Customer ID is automatically attached to orders placed by authenticated customers (`StoreCodOrderRequest` injecting `customer_id => auth('customer')->id()`).

### Acceptance Criteria & Verification
- 100% of automated tests pass:
  - `tests/Feature/CustomerAuthTest.php`: 10 tests, 39 assertions (registration, unique email, validation, login, invalid credentials, throttling, logout, guest route protection, admin isolation).
  - `tests/Feature/CustomerOrderAndWishlistTest.php`: 9 tests, 42 assertions (customer order scoping, IDOR protection on order detail, own order inspection, wishlist add, duplicate prevention, variant addition, invalid product rejection, wishlist item removal, IDOR deletion rejection, wishlist page view).
  - `tests/Feature/OrderTrackingTest.php`: 8 tests, 48 assertions (cryptographic token tracking, no secret hash leakage, guest order number + phone tracking, international phone normalization, phone mismatch rejection, anti-enumeration identical response, customer order lookup, rate limiting to HTTP 429, GET token preloading).
  - Full regression suite passing: `tests/Feature/CartEngineTest.php`, `tests/Feature/UnifiedCheckoutTest.php`, `tests/Feature/CodCheckoutTest.php`, `tests/Feature/CustomerCheckoutComponentTest.php` (33 tests, 244 assertions).
- `npm run type-check`: 0 TypeScript errors.
- `./vendor/bin/pint --test`: Clean code style across all PHP files.
- `npm run build`: Production bundle built cleanly with all customer pages compiled.

### Focused Tests
- `tests/Feature/CustomerAuthTest.php`: Customer registration, login, logout, guard isolation, and address management.
- `tests/Feature/OrderTrackingTest.php`: Public order lookup, phone verification, and rate limiting.

---

## Phase 11: SEO Foundations, Evidence-Backed Performance, Accessibility & Production Readiness
**Status:** **100% COMPLETE**
**Goal:** Implement enterprise SEO foundations, evidenced performance caching, accessible customer flows, and production deployment readiness without altering underlying architectures.

### Scope & Dependencies
- Depends on: Completion of Phases 7, 8, 9, 10.
- Primary Deliverables: Dynamic SEO metadata & JSON-LD sanitizer (`SeoHead.tsx`), dynamic `/sitemap.xml`, production-ready `public/robots.txt`, query performance & model caching, accessible form controls & dialogs, production checklist & deployment manual in `DEPLOYMENT.md`.

### Completed Tasks & Technical Specifications
1. **Storefront SEO Foundations & Metadata:**
   - Zero-dependency, XSS-safe JSON-LD sanitizer escaping `<` and `>` (`SeoHead.tsx`).
   - Integrated Open Graph, Twitter cards, and canonical tags across Home, Shop, Product Detail, Policy, and Landing Page templates.
   - Structured data schemas for `WebSite`, `Organization`, `Product`, `Offer` (with real BDT pricing and live stock availability), and `BreadcrumbList`.
   - Private customer routes (`/checkout/*`, `/customer/*`, `/cart`, `/track-order`) guarded with `<meta name="robots" content="noindex, nofollow" />`.
   - Dynamic cached `/sitemap.xml` generated with active products, categories, published policies, and landing pages (`/p/{slug}`).
   - Comprehensive `public/robots.txt` disallowing private and administrative endpoints.
2. **Evidence-Backed Performance Optimization & Model Cache Invalidation:**
   - Resolved global eager load collection truncation on `$categorySections->products` in `StorefrontHomeController.php`.
   - Cached category trees (`Category::toTree()`) with automatic cache busting on save and delete.
   - Cached sitemap (`storefront_sitemap_xml`) with automatic cache busting on `Category`, `Product`, and `LandingPage` save and delete.
3. **Accessibility (a11y) Improvements:**
   - Explicit `<label htmlFor="...">` and `<input id="...">` associations, `aria-required`, `aria-invalid`, and `aria-live` error announcements on Checkout and Customer Auth screens.
   - Descriptive `aria-label`s on icon-only buttons (cart drawer triggers, quantity adjustments, order actions).
   - Dialog semantics (`role="dialog"`, `aria-modal="true"`) on mobile navigation drawer in `StorefrontLayout.tsx`.
   - Explicit image dimensions (`width={400} height={400}`) on `ProductCard.tsx` preventing layout shifts (CLS).
4. **Production Readiness & Deployment Manual:**
   - Updated `DEPLOYMENT.md` with Section 6 covering environment configurations, pre-deployment build pipeline, supervisor queue worker template, cron scheduling, and rollback instructions.

### Acceptance Criteria & Verification
- 100% of automated tests pass:
  - `tests/Feature/SeoAndPerformanceTest.php`: 9 tests, 69 assertions (SEO metadata, JSON-LD escaping, canonical tags, noindex on private pages, dynamic sitemap, robots.txt, category caching & invalidation, sitemap invalidation).
  - Regression suites passing: `tests/Feature/MultipleLandingPagesTest.php` (11 tests, 127 assertions), `tests/Feature/ProductionHardeningTest.php` (8 tests, 48 assertions), `tests/Feature/PublicLandingPageTest.php` (6 tests, 31 assertions), `tests/Feature/HomepageModeRoutingTest.php` (5 tests, 20 assertions), `tests/Feature/StorefrontHomeSectionsTest.php`, `tests/Feature/StorefrontProductDetailTest.php`, `tests/Feature/StorefrontShopTest.php`, `tests/Feature/StorefrontThemeAndSettingsTest.php` (16 tests, 214 assertions), `tests/Feature/CartEngineTest.php`, `tests/Feature/UnifiedCheckoutTest.php` (21 tests, 131 assertions), `tests/Feature/CustomerAuthTest.php`, `tests/Feature/CustomerOrderAndWishlistTest.php`, `tests/Feature/OrderTrackingTest.php` (27 tests, 129 assertions).
- `npm run type-check`: 0 TypeScript errors.
- `./vendor/bin/pint --test`: Clean code style across all PHP files.
- `npm run build`: Production bundle pre-compiled cleanly in 12.88s.

---

## Phase 12: Final Project Wrap-up, End-to-End Testing & Production Handover
**Status:** **100% COMPLETE**
**Goal:** Verify complete application across all customer and administrative workflows, perform full-system regression testing, document environment matrices, and prepare a battle-tested production handover.

### Scope & Technical Deliverables
- **Full-System Regression Verification:**
  - 100% pass across all 376 tests and 2,527 assertions (`php artisan test`).
- **Cross-Module Master Integration Testing (`tests/Feature/EndToEndLifecycleTest.php`):**
  - Complete guest purchase flow from catalog through variant cart, COD checkout, and thank-you confirmation.
  - Complete admin fulfillment lifecycle: order management, courier dispatch with tracking generation, printable 80mm thermal receipt, and idempotent inventory restocking on cancellation.
  - Complete customer account journey: registration, wishlist to cart addition, duplicate prevention, and anti-enumeration self-service order tracking.
  - Complete campaign landing page SSR rendering and direct Quick Order checkout.
- **Production Preflight & Health Verification:**
  - `php artisan commerce:preflight` executed: 13 PASS, 0 FAIL, 1 development WARN (HTTPS guidance).
  - Database schema & backup integrity verified (`commerce:backup` and `commerce:restore` testing passing).
- **Environment Matrix & Deployment Guide:**
  - Documented environment comparison matrix across Windows (Laragon), Linux VPS, and Shared cPanel in `DEPLOYMENT.md` Section 7.
- **Code Quality Gates:**
  - TypeScript type-check: `npm run type-check` (0 errors).
  - Laravel Pint code style: `./vendor/bin/pint --test` (0 violations).
  - Static asset pre-compilation: `npm run build` (built cleanly in 15.82s).
- **Handover Status:** All 12 Planned Phases are 100% COMPLETE. No Phase 13 exists.


