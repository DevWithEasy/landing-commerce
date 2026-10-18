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
**Status:** Pending
**Goal:** Build a high-performance, mobile-first generic e-commerce shopping experience with a 2-row navigation header, admin-controlled hero slider, category sections, faceted search, product detail pages, and a Quick Order popup.

### Scope & Dependencies
- Depends on: Phase 7 (Categories, Sliders, Theme Settings, Dual Homepage Router).
- Primary Deliverable: Storefront React + TypeScript components via Inertia.js, responsive header/footer layout, Home, Shop, Category, and Product Details views.

### Tasks & Technical Specifications
1. **Storefront Layout & 2-Row Header (`StorefrontLayout.tsx`):**
   - Row 1 (Utility & Brand Bar):
     - Brand logo with home link.
     - Central live search bar with instant autocomplete product preview.
     - Customer Hotline / WhatsApp quick-contact link.
     - Wishlist icon with dynamic counter badge.
     - Cart trigger with live count badge (opens slide-over Mini-cart Drawer).
     - Customer Account icon (links to login/register or customer dashboard dropdown).
   - Row 2 (Navigation Bar):
     - All Categories mega-dropdown menu (hierarchical parent-child display).
     - Primary navigation links: Home, Shop, New Arrivals, Featured, Offers, Contact Us.
   - Mobile Header & Bottom Navigation Bar:
     - Mobile top bar with hamburger menu drawer, brand logo, search toggle, and cart icon.
     - Sticky bottom navigation bar: Home, Categories, Search, Wishlist, Cart.
   - Storefront Footer:
     - Payment method badges (Cash on Delivery, bKash, Nagad, Rocket).
     - 4-column layout: About store, Quick links, Category links, Customer care.
     - BBS 64-district delivery guarantee badge, copyright, and social links.
2. **Dynamic Storefront Home Page (`/`):**
   - Hero Slider (directly below header):
     - Full-width responsive carousel with admin-controlled slides, text overlays, CTA buttons, and slide intervals.
   - Category Grid:
     - Interactive circular or card thumbnails for categories (Fashion, Electronics, Cosmetics, Grocery, Home & Kitchen, etc.).
   - New Arrivals Section:
     - Grid of recently created products with "New" badge, prices, and Quick Order button.
   - Featured Products & Best Sellers Sections:
     - Admin-curated showcase with sale discount badges and star ratings.
   - Category-Based Product Sections:
     - Tabbed or stacked product rows by category (e.g. "Smartphones & Gadgets", "Men's Fashion").
   - Trust & Value Proposition Badges:
     - 100% Authentic Products, Nationwide Cash on Delivery, Fast 24-72h Delivery, 7-Day Easy Return.
   - Admin Controls:
     - Dedicated controls to toggle section visibility, update section titles/subtitles, choose product limit, and reorder homepage sections.
3. **Faceted Shop & Catalog Browsing (`/shop`):**
   - Multi-parameter filtering with URL state synchronization:
     - Category filter (multi-select checkboxes with hierarchy counts).
     - Price range slider with min-max inputs (server-validated).
     - Stock status filter (in-stock only toggle).
     - Sorting: Newest, Price: Low to High, Price: High to Low, Popularity.
     - Search query matching title, slug, and variant SKU.
   - Responsive sidebar filter drawer on mobile devices.
   - Server-side pagination (12, 24, 48 items per page).
4. **Category Browsing Page (`/category/{slug}`):**
   - Category banner, title, description, and breadcrumb navigation.
   - Subcategory pill filters for instant child category drill-down.
   - Inherits all filtering, sorting, and pagination capabilities from Shop.
5. **Product Details Page (`/product/{slug}`):**
   - Image Gallery: Main image with zoom/lightbox and interactive thumbnail rail (touch swipe on mobile).
   - Pricing: Regular price, sale price, and dynamic discount percentage badge.
   - Variant Swatches: Interactive color pills (with variant image switching) and size buttons; real-time price and stock level update.
   - Quantity Stepper (+ / -) with min 1 and max available variant stock bounds.
   - Dual Call-to-Action Buttons:
     - **"Add to Cart"**: Adds item to session cart and opens the slide-over Mini-cart Drawer.
     - **"Buy Now" / "অর্ডার করুন"**: Adds item to cart and immediately redirects to `/checkout` for instant 1-click ordering.
   - Estimated Delivery Widget: Displays standard shipping charges and transit times for Inside Dhaka (24-48h ৳70) and Outside Dhaka (48-72h ৳130) based on BBS shipping zones.
   - Cash on Delivery available badge and direct WhatsApp inquiry link.
   - Tabbed Content: Overview / Description, Specifications table, Reviews, Related Products carousel.
   - Generic Category Compatibility: Seamlessly supports Fashion, Electronics, Cosmetics, Grocery, and Home Living products.
6. **Quick Order Popup (Foundation):**
   - Quick Order modal triggerable directly from product cards across Home, Shop, and Category grids.
   - Allows shoppers to select variants and quantity and proceed directly to order placement without leaving the page.

### Acceptance Criteria
- Storefront header renders 2-row layout cleanly on desktop and switches to responsive drawer and sticky bottom bar on mobile.
- Admin-controlled slider displays images, text, and links smoothly with mobile image fallback.
- Inactive or draft products return HTTP 404 on storefront routes.
- Product Details page dynamically switches prices, variant images, and stock badges upon swatch selection.
- All interactive elements adhere to strict TypeScript interfaces with zero `any`.

### Focused Tests
- `tests/Feature/StorefrontCatalogTest.php`: Public Shop, Category, and Product Details endpoints, active scopes, price range filters, and search queries.
- `tests/Feature/StorefrontSliderTest.php`: Hero slider display, sort order, and active status toggles.

---

## Phase 9: Server-Authoritative Cart Engine, Mini-Cart & Unified Storefront Checkout
**Status:** Pending
**Goal:** Build a robust, tamper-proof shopping cart and unified checkout engine that shares the existing pessimistic row-locking, anti-spam, and order pipeline infrastructure with landing pages.

### Scope & Dependencies
- Depends on: Phase 8 (Product Details, Quick Order UI), Phase 2 (Order Actions, Bangladesh Shipping Matrix).
- Primary Deliverable: `CartService`, Mini-cart Drawer, `/cart` page, unified `/checkout` controller, and Quick Order integration.

### Tasks & Technical Specifications
1. **Server-Authoritative Cart Service (`CartService.php`):**
   - Dual Storage Architecture:
     - Session-backed storage for guests (`cart_items` serialized in session).
     - Database-synchronized storage for authenticated customers (`cart_items` table: `id`, `customer_id`, `product_variant_id`, `quantity`, `timestamps`).
     - Automatic cart migration from guest session to customer account upon login.
   - Authoritative Price & Stock Validation:
     - Prices are calculated strictly on the server by loading active `ProductVariant` and `Product` models from the database.
     - Client-side prices are strictly ignored to prevent price tampering.
     - Stock boundary check: Adding or modifying item quantity validates against `variant.stock_quantity` when `variant.manage_stock === true`. If requested quantity exceeds available stock, clamp to available stock and return an informative message.
   - Endpoints:
     - `GET /cart`: Returns normalized cart state (items, subtotal, item count, currency, warnings).
     - `POST /cart/items`: Add item (`variant_id`, `quantity`).
     - `PATCH /cart/items/{id}`: Update quantity.
     - `DELETE /cart/items/{id}`: Remove item.
     - `POST /cart/clear`: Empty cart.
2. **Slide-Over Mini Cart Drawer & Dedicated Cart Page (`/cart`):**
   - Mini-cart slide-over drawer triggered from header cart icon or upon clicking "Add to Cart".
   - Itemized lines with variant swatches, quantity steppers, item removal, and subtotal.
   - Free shipping progress bar (e.g. "Add ৳500 more for Free Delivery!").
   - Dedicated full Cart Page at `/cart` with itemized order summary and checkout CTA.
3. **Quick Order Popup Integration:**
   - Connects the Quick Order popup directly to the checkout action or cart.
   - Allows instant 1-click Cash on Delivery order placement directly from product cards.
4. **Unified Checkout Controller & Experience (`/checkout`):**
   - Update `CheckoutPageController@show` and `resources/js/Pages/Checkout/Show.tsx` to handle BOTH checkout modes:
     1. **Cart Checkout:** When accessed via `/checkout` without parameters, automatically populates checkout with all items from the active cart.
     2. **Direct Product / Campaign Checkout:** When accessed with a product slug (`/checkout/{product:slug}`) or arriving with explicit variant/quantity payload from a landing page, uses direct item checkout while keeping session cart intact.
   - Unified Order Placement via `ProcessCodOrderAction`:
     - Reuses the existing, battle-tested `ProcessCodOrderAction` without code duplication.
     - Pessimistic row locking (`lockForUpdate()`) on MySQL inventory.
     - UUID `idempotency_key` with 15-second cache lock preventing duplicate rapid submissions.
     - BBS 64-district and upazila dynamic shipping rate calculation via `ShippingCalculatorService`.
     - Anti-spam phone blacklist inspection and dual IP/phone rate limiting.
     - Payment method support: Cash on Delivery (`cod`, status `unpaid`) and manual MFS (`bkash`, `nagad`, `rocket`, requires TrxID, status `pending_verification`).
     - Clears the active cart upon successful order placement.
   - Redirects cleanly to the itemized Thank You screen at `/checkout/thank-you/{order:order_number}`.

### Acceptance Criteria
- Client-submitted prices are completely disregarded; final order totals are 100% computed from database pricing.
- Out-of-stock items cannot be added to cart; item quantity cannot exceed available variant inventory.
- Unified checkout seamlessly accepts orders from both the multi-item shopping cart and landing pages.
- Duplicate rapid clicks on checkout trigger the cache lock and return the existing order without duplicate stock deduction.

### Focused Tests
- `tests/Feature/StorefrontCartTest.php`: Cart additions, quantity updates, removals, stock clamping, price tampering prevention, and guest-to-customer cart migration.
- `tests/Feature/UnifiedCheckoutTest.php`: Both cart checkout and landing page campaign checkout through `ProcessCodOrderAction`.

---

## Phase 10: Customer Authentication, Account Portal, Order Tracking & Wishlist
**Status:** Pending
**Goal:** Empower customers with optional accounts, self-service order tracking, saved address books, and wishlists while strictly maintaining zero-friction guest checkout.

### Scope & Dependencies
- Depends on: Phase 7 (Core), Phase 9 (Checkout, Orders).
- Primary Deliverable: `Customer` model, `customer` auth guard, Customer Portal, Public Order Tracking, and Wishlist.

### Tasks & Technical Specifications
1. **Customer Multi-Auth Guard Architecture:**
   - Table `customers`: `id`, `name`, `phone` (unique), `email` (nullable unique), `password` (hashed), `address`, `district`, `upazila`, `is_active` (boolean default true), `email_verified_at` (nullable), `timestamps`.
   - Model `Customer` in `app/Modules/Customer/Models/Customer.php`.
   - Separate auth guard `'customer'` in `config/auth.php` using `eloquent` provider pointing to `Customer`.
   - Complete isolation between admin `'web'` guard and customer `'customer'` guard to prevent privilege leakage.
2. **Customer Authentication & Guest Checkout Coexistence:**
   - Guest checkout remains the primary, zero-friction default for all storefront and landing page orders.
   - On checkout, guest shoppers can optionally check: "Save my information for faster checkout next time" with an optional password field to automatically create a customer account upon order completion.
   - Customer Auth Routes:
     - `GET /customer/login`, `POST /customer/login` (rate-limited via `throttle:5,1`).
     - `GET /customer/register`, `POST /customer/register`.
     - `POST /customer/logout`.
3. **Customer Account Portal (`/customer/*`):**
   - Protected by `auth:customer` middleware.
   - Pages in `resources/js/Pages/Customer/`:
     - **Dashboard (`/customer/dashboard`):** Welcome banner, recent orders summary, default shipping address card.
     - **Order History (`/customer/orders`):** Paginated list of customer orders with status badges, item summaries, total amount, and link to order details.
     - **Order Detail (`/customer/orders/{order_number}`):** Detailed view showing delivery address, courier tracking consignment number, live courier tracking status, itemized products, and downloadable invoice.
     - **Address Book (`/customer/addresses`):** Manage saved delivery addresses (District, Upazila, Street Address) with default selection for 1-click checkout autofill.
     - **Profile Settings (`/customer/profile`):** Update name, email, phone, and change password.
4. **Public Self-Service Order Tracking (`/track-order`):**
   - Public page accessible to all shoppers without requiring account login.
   - Input: Order Number (e.g. `ORD-20261018-XXXXXX`) + Customer Phone Number (normalized 11-digit BD mobile).
   - Form validation & anti-enumeration rate limiting (`throttle:10,1`).
   - Displays live order status timeline:
     - Pending -> Confirmed -> Processing -> Handed to Courier -> In Transit -> Delivered.
     - If dispatched, displays courier name (Steadfast, Pathao, RedX), tracking ID, and direct external tracking URL.
5. **Customer Wishlist Engine (`/wishlist`):**
   - Storage: LocalStorage for guest users, database table `wishlists` (`customer_id`, `product_id`) for authenticated customers.
   - Instant toggle on product cards and product detail pages with heart icon animation.
   - Dedicated Wishlist Page (`/wishlist`): Displays saved products with "Move to Cart" and "Remove" actions.

### Acceptance Criteria
- Customer login sessions are completely isolated from admin dashboard sessions; customers cannot access `/admin/*`.
- Order tracking strictly returns order details only when the phone number exactly matches the order record.
- Guest shoppers can complete purchases without creating an account; registered customers enjoy pre-filled addresses.

### Focused Tests
- `tests/Feature/CustomerAuthTest.php`: Customer registration, login, logout, guard isolation, and address management.
- `tests/Feature/OrderTrackingTest.php`: Public order lookup, phone verification, and rate limiting.

---

## Phase 11: End-to-End Quality Tooling, Performance Optimization & Verification
**Status:** Pending
**Goal:** Validate all storefront and landing page flows against rigorous regression suites, multi-process MySQL concurrency harnesses, and production build standards.

### Scope & Dependencies
- Depends on: Completion of Phases 7, 8, 9, 10.
- Primary Deliverable: Full-suite test passes, live MySQL concurrency verification, static asset production bundle, Pint formatting, and deployment manual.

### Tasks & Technical Specifications
1. **Full-Suite Automated Regression & Concurrency Testing:**
   - Execute complete Pest test suite covering:
     - Phase 0-6 baseline tests (Catalog, Orders, FSM, AST Builder, Couriers, SMS, RBAC, Backups, Web Installer).
     - Phase 7-10 tests (Categories, Storefront Catalog, Cart, Unified Checkout, Customer Portal, Order Tracking).
   - Multi-process parallel HTTP concurrency test on live MySQL:
     - Simulate 10 parallel processes attempting to purchase the last unit of stock via both storefront cart checkout and landing page COD checkout simultaneously.
     - Verify exactly 1 order succeeds, 9 fail with HTTP 422 insufficient stock, and final MySQL inventory ends at exactly 0 with zero overselling.
2. **Production Asset Pre-compilation & Performance Optimization:**
   - Run `npm run type-check` (strictly zero `any`, zero TypeScript errors).
   - Run `npm run build` to verify clean production Vite bundling of all storefront, admin, and builder assets.
   - Verify server-side response times: Storefront home and catalog pages must achieve sub-200ms TTFB under local PHP runtime.
   - Code formatting with Laravel Pint (`./vendor/bin/pint --test`).
3. **Deployment Documentation & User Manual:**
   - Update `PROJECT_STATUS.md` with final milestone achievements.
   - Document storefront mode toggle, category management, customer account configuration, and order tracking usage in `DEPLOYMENT.md`.

### Acceptance Criteria
- 100% of automated tests pass without errors (`php artisan test`).
- `npm run type-check` exits with code 0.
- `npm run build` pre-compiles production assets cleanly without persistent Node.js dependencies.
- `./vendor/bin/pint --test` passes with zero violations.


