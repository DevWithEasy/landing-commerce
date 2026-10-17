# Project Specification: Landing Commerce Starter Kit

## 1. Executive Summary & Vision

**Landing Commerce Starter Kit** is an enterprise-grade, secure, self-hosted e-commerce application tailored specifically for single-product and high-converting campaign landing pages in Bangladesh. 

Unlike multi-tenant SaaS platforms (e.g., Shopify, StoreX) where businesses pay recurring monthly subscription fees and share a single database, this system is a **reusable, white-label core application**. Each client receives their own standalone installation, custom domain, independent database, and dedicated server environment (such as shared cPanel hosting, VPS, or Docker).

The starter kit combines the conversion power of a **visual drag-and-drop landing page builder** with a robust **e-commerce core** featuring product variants, inventory control, and a localized **Cash on Delivery (COD)** checkout flow optimized for the Bangladesh market.

---

## 2. Business & Operational Model

### 2.1 Single-Tenant Core Architecture (Non-SaaS)
* **One Client = One Instance:** Every client gets a dedicated deployment with its own `.env` configuration, database, and asset storage.
* **Zero Cross-Tenant Risk:** No shared database tables, preventing accidental data leaks between competing merchants.
* **Customizability:** Allows per-installation customizations (custom courier APIs, bespoke checkout hooks, unique payment gateways) without branching core code destructively.
* **Self-Hostable on Standard Infrastructure:** Must run smoothly on self-hosted environments (cPanel/LiteSpeed, standard VPS with Nginx, or Docker), provided the target environment satisfies PHP >= 8.3 and all required extensions. Target hosting compatibility must be individually verified per client deployment; do not claim that every package or hosting provider is compatible without verification.
* **Environment Architecture & Workspaces:**
  * *Documented Local Workspace:* Local development workspace is documented as `I:\coding_world\laragon\www\landing-commerce` (using Laragon on Windows with PHP 8.3.33 CLI, MySQL 8.4.3, Node.js 24.19.0 / npm 11.17.0, Composer 2.10.2). Do not move files or create directories without explicit authorization.
  * *Production Hosting Distinction:* Production requires PHP 8.3+ and verified extensions. Production assets must be pre-compiled into static bundles (`npm run build`); production must not depend on a persistent Node.js process merely to serve those assets.
  * *Document Root Isolation:* Placing `.env`, application code, and logs outside the publicly accessible document root is mandatory wherever possible. An `.htaccess` rewrite defense is an extra defense-in-depth layer and not an acceptable substitute for physical directory isolation.

### 2.2 Target Market Specifics (Bangladesh E-Commerce)
* **Primary Payment Method:** Cash on Delivery (COD) accounts for 85%+ of SME e-commerce orders in Bangladesh.
* **Simplified One-Page Checkout:** Frictionless checkout forms directly embedded on the landing page (Name, Mobile Phone, Delivery Address, District/Area selection).
* **Delivery Charge Differentiation:** Distinct rates for "Inside Dhaka" (e.g., ৳60–80), "Sub-Dhaka / Dhaka Suburbs" (e.g., ৳100), and "Outside Dhaka" (e.g., ৳120–150).
* **Fraud & Fake Order Mitigation:** Throttling repeated submissions, phone number formatting (`+8801[3-9]XXXXXXXX`), blacklist management, and order confirmation workflows.
* **Courier Integrations:** Automated delivery booking with leading Bangladeshi couriers: Steadfast Courier, Pathao Courier, RedX, and Paperfly.
* **SMS Gateway Integration:** Order confirmations, delivery updates, and OTPs via local BD SMS gateways (e.g., Greenweb, SSL Wireless, SMSPoh, BulkSMSBD).

---

## 3. Functional Requirements

### 3.1 Product & Inventory Management
* **Single & Multi-Product Support:** Support standalone hero products or product bundles with add-on upsells.
* **Attribute & Variant Matrix:** Manage variants such as Size, Color, Volume, or Material with separate SKU, stock quantity, and pricing.
* **Pricing Engine:** Regular price, promotional/sale price, wholesale/bulk discount tiers, and automated badge calculations (e.g., "Save 25%").
* **Inventory Control & Race-Condition Safety:** Real-time stock decrementing inside database transactions with pessimistic row locks (`lockForUpdate()`) on MySQL, stock reservations during checkout processing, out-of-stock indicators, and backorder toggles.

### 3.2 Landing Page Builder (Visual, Schema-Driven)
* **Unlimited Pages:** No arbitrary cap on the number of landing pages or product campaign funnels created on a single store.
* **Drag-and-Drop Block Architecture:** Merchants can reorder, duplicate, add, and remove pre-approved blocks without touching code.
* **Approved Component Block Library:**
  1. *Hero Block:* Headline, subtitle, product hero gallery, primary CTA button, guarantee badges.
  2. *Product Selection & Variant Selector:* Interactive swatch selector (color pills, size buttons, image swatches).
  3. *Sticky / Embedded COD Checkout Form:* Instant one-click order form embedded right below the fold or triggered via sticky bar.
  4. *Feature / Benefits Grid:* Highlighting unique selling propositions (USPs) with custom icons and images.
  5. *Customer Reviews / Testimonials:* Verified buyer badges, star ratings, review text, and customer photo proof.
  6. *Video Demonstration Block:* Embedded YouTube/Vimeo or self-hosted MP4 product demos.
  7. *Comparison Table:* "Our Product vs Cheap Alternatives" comparison grid.
  8. *FAQ Accordion:* Frequently asked questions to resolve objections.
  9. *Urgency & Scarcity Elements:* Countdown timers, limited stock progress bars, and recent order ticker popups.
  10. *Floating Sticky Bar:* Mobile-first sticky bottom bar with "Order Now" anchor CTA and WhatsApp contact button.
* **Security & Sandboxing:**
  * Strict AST (Abstract Syntax Tree) schema validated against an approved, allowlisted block registry (`HeroBlock`, `ProductSelectorBlock`, `CodCheckoutBlock`, `BenefitsGridBlock`, `ReviewsBlock`, `VideoBlock`, `FaqBlock`, `CountdownTimerBlock`, `StickyBarBlock`).
  * **Strict Rejection:** Never render arbitrary merchant-provided JavaScript or unsanitized raw HTML. Raw `<script>`, `<iframe>` (except sanitized YouTube/Vimeo embeds), unrestricted inline HTML, inline event handlers (`onclick`, `onload`, `onerror`), and JavaScript URLs (`javascript:`, `data:`, `vbscript:`) are rejected.
  * **CSS Style Whitelist:** Allowed properties are restricted to colors, backgrounds, padding, margin, border-radius, font-size, border-width, and text-align. Prohibit `position: fixed` overlays, `z-index > 50`, `expression()`, and `@import`.
  * Dynamic user-side interactions (timers, swatch selections, COD calculations) are executed exclusively by pre-compiled React/Blade components with sanitized properties, never by merchant-provided script strings.

### 3.3 Checkout & Order Processing
* **One-Step COD Checkout Form:** Form fields limited to essential fields to maximize conversion:
  * Full Name (required)
  * Mobile Phone Number (required; validated against Bangladeshi 11-digit operator prefixes)
  * Full Delivery Address (required)
  * Shipping Region / City (Inside Dhaka / Dhaka Suburbs / Outside Dhaka)
  * Order Notes / Special Instructions (optional)
* **Anti-Duplicate & Idempotency Safeguards:**
  * Client-side form submission debounce and unique client token (UUID `idempotency_key`).
  * Server-side idempotency lock via atomic cache lock (`Cache::lock`) and database `UNIQUE(idempotency_key)` constraint on `orders`, preventing duplicate orders and double stock deductions on network re-transmissions.
* **Order Status Life Cycle & Idempotent Restocking:**
  * `Pending` (New order received, awaiting merchant verification)
  * `Confirmed` (Merchant called customer and confirmed delivery)
  * `Processing` (Order picked and packed)
  * `Handed to Courier` (Consignment created with tracking ID)
  * `In Transit` (Courier delivering)
  * `Delivered` (Cash collected)
  * `Returned / Cancelled` (Return processed; prevent repeated cancellation or duplicate webhook processing from restocking inventory more than once; stock replenished strictly once via an idempotent `is_restocked` audit flag on `order_items` inside a database transaction with row locks)
  * `Fake / Spam` (Flagged and blacklisted)
* **Order Audit Trail:** Immutable log of every status change, timestamp, and user ID.

### 3.4 Media & Asset Management
* Upload manager supporting WebP, PNG, JPEG, and MP4.
* **Image Upload Security Policy:** Restrict uploads to approved raster formats (WebP, JPEG, PNG) by default. Reject arbitrary SVG uploads; if SVG support is introduced in future revisions, require a maintained, security-reviewed sanitizer (`enshrined/svg-sanitize`).
* Automatic server-side image optimization and multi-resolution generation (thumbnail, medium, full-width) converting all uploaded photos to optimized **WebP** formats using PHP `gd` (or `imagick`).
* Strict server-side MIME type verification using `finfo_file` (never trusting client-supplied `Content-Type`).

### 3.5 Administration, Security, Backup & Updates
* **Authentication & Rate Limiting:** Multi-guard session-based authentication with aggressive rate-limiting on login endpoints to defeat brute-force dictionary attacks.
* **Server-Side Authorization & 3-Tier RBAC:** Strict gate/policy authorization enforced on all administrative endpoints and sensitive backup operations (never relying on UI-level hiding):
  * `Super Admin`: Complete access to settings, users, catalog, builder, raw logs, and backup exports.
  * `Store Manager`: Catalog, landing pages, and full order processing; no access to system settings or user management.
  * `Order Fulfillment Agent`: View orders, update delivery status (Pending -> Confirmed -> Handed to Courier), print invoices; no permission to modify prices, delete products, access backups, or edit page builder templates.
* **Database Backup & Resilient Restore:**
  * CLI and web-accessible backup tool (`php artisan commerce:backup`).
  * Pure-PHP SQL export and import streaming engine ensuring backups work on shared cPanel hosts where shell commands like `mysqldump` or `exec()` are disabled.
  * **DDL Non-Transactional Recovery Strategy:** Because MySQL DDL statements (`CREATE TABLE`, `DROP TABLE`, `ALTER TABLE`) trigger implicit commits and cannot be rolled back within a database transaction, the restore engine must execute pre-restore syntax validation, verify file checksums, create an automated pre-restore snapshot, and provide structured error reporting with rollback/recovery procedures if a restore fails mid-execution.
* **Update Strategy:**
  * Single-tenant core updateable via standard `git pull` or archive overwrite.
  * Migrations are strictly additive; seeders preserve existing user records, orders, and page revisions.

---

## 4. Non-Functional Requirements & Performance Reality

| Metric | Target | Context / Conditions |
| :--- | :--- | :--- |
| **First Contentful Paint (FCP)** | < 0.8s on 4G | On regional hosting (Singapore/India/BD) or with Cloudflare edge caching enabled |
| **Largest Contentful Paint (LCP)** | < 1.8s | With WebP optimized hero imagery and pre-compressed static assets |
| **Time to Interactive (TTI)** | < 2.0s | Light DOM footprint on low-end mobile devices (< 1200 DOM nodes per landing page) |
| **Checkout API Response Time** | < 200ms | Server execution time under transactional row lock |
| **Database Concurrency** | Zero overselling | Guaranteed by pessimistic locking (`lockForUpdate()`) inside database transaction on MySQL |
| **Framework Baseline** | **Laravel 13.x (PHP ^8.3)** | Tested against PHP 8.3.33; requires verification of PHP version and extensions on target host |
| **Asset Serving** | Pre-compiled static assets | Compiled via `npm run build`; production must not depend on a persistent Node.js process |
| **Security Standards** | OWASP Top 10 Compliant | Protection against SQLi, XSS, CSRF, IDOR, SSRF, and file upload execution |

---

## 5. Exclusions & Constraints

* **No Multi-Tenant SaaS Engine:** The core code will not contain tenant ID resolution, shared database migrations, or cross-tenant billing modules.
* **No Unsandboxed User Code:** Users will not be able to write arbitrary React/Vue code, `<script>` tags, or raw PHP within the visual editor. Never render arbitrary merchant-provided JavaScript or unsanitized raw HTML.
* **No Live API Dependency for Tests:** All courier (Steadfast, Pathao, RedX) and SMS (Greenweb, SSL Wireless) modules must include mock drivers so the starter kit can be developed and automatedly tested 100% offline without live external API keys.
* **Pre-Development Scaffolding Check:** Add a pre-development check for the missing PHP `zip` extension. Instruct the developer to verify the active CLI `php.ini`, enable `extension=zip`, and verify Composer's ability to install dependencies before scaffolding. AI agents must not edit PHP configuration or enable extensions directly.
* **Deployment Verification Mandate:** Target hosting compatibility (PHP version >= 8.3, `pdo_mysql`, `gd`, `fileinfo`, `mbstring`, `zip`, `openssl`, `curl`, document root isolation, scheduled tasks) must be verified via preflight checks before attempting production deployment. Do not claim hosting provider or package compatibility without verification.
* **Self-Contained Updates:** Updates from the upstream repository must be deployable via Git pull without breaking client-specific database states.


