# Testing Strategy & Quality Assurance: Landing Commerce Starter Kit

## 1. Testing Philosophy & Non-Negotiable Rules

In accordance with core engineering principles:
1. **Never claim a feature works or tests pass unless they have actually been executed and verified in the terminal log.**
2. **Never invent or fabricate successful test output.**
3. Every critical business rule (inventory deduction, checkout idempotency, AST sanitization, repeated cancellations, duplicate webhooks, and state transitions) must have automated tests.
4. When reporting results to users, quote exact command outputs and status codes from the terminal.

---

## 2. Test Architecture & Tooling

```
+-----------------------------------------------------------------------------------+
|                           End-to-End Tests (Playwright)                           |
|       - Full COD Checkout flow from visual landing page to Thank You screen       |
|       - Drag-and-drop block builder interactions, property edits, and publishing  |
+-----------------------------------------------------------------------------------+
                                          |
+-----------------------------------------------------------------------------------+
|               Feature & Integration Tests (Pest PHP 3 / PHPUnit)                  |
|  [Ordinary Functional Tests]            |  [MySQL Concurrency Harness]            |
|  - SQLite in-memory / fast pipeline     |  - Genuine parallel multi-process HTTP  |
|  - Order FSM transitions & audit trail  |  - Row locking (SELECT ... FOR UPDATE)  |
|  - Page Builder AST security sanitizer  |  - Simultaneous purchase of last unit   |
|  - Courier & SMS driver mock requests   |  - Duplicate checkout / idempotency     |
+-----------------------------------------------------------------------------------+
                                          |
+-----------------------------------------------------------------------------------+
|                    Unit Tests (Pest PHP 3 & Vitest)                               |
|       - BD Phone regex validation helper                                          |
|       - Price calculation & discount badges                                       |
|       - React block renderer & property parsers                                   |
+-----------------------------------------------------------------------------------+
```

### 2.1 Separation of Ordinary Tests vs. MySQL Concurrency Tests
- **Ordinary Functional Tests:** Fast, isolated tests for domain actions, validation rules, state machines, and AST sanitization run against SQLite (`:memory:`) or standard test connections.
- **MySQL-Specific Concurrency Tests:** Tests for simultaneous purchases, pessimistic locking, and race conditions **must** run against a genuine MySQL 8.4+ instance using an asynchronous multi-process HTTP test harness.

---

## 3. High-Priority Automated Test Suites

### 3.1 Concurrency & Simultaneous Purchase of Last Available Item (Requires MySQL Database)

> [!IMPORTANT]
> **Why Sequential Loops are Invalid for Concurrency:**
> In PHP, sequential iteration (such as `collect()->map()` or `foreach`) executes requests one after another on a single thread. It cannot test true parallel race conditions or verify whether `SELECT ... FOR UPDATE` prevents deadlocks and overselling.
> Furthermore, SQLite does **not** support row-level pessimistic locks (`SELECT ... FOR UPDATE`) and locks the entire database file. Concurrency tests **must** be executed against a running MySQL 8.4+ instance using an asynchronous multi-process HTTP test harness (e.g., parallel `curl_multi` or a worker process pool).
> **Local HTTP Server Prerequisite:** Genuine parallel multi-process HTTP concurrency tests require an active local HTTP server process (such as Laragon's web server or a background `php artisan serve` instance listening on the local test URL) to receive and process parallel incoming HTTP requests simultaneously against MySQL.

* **Objective:** Ensure that when inventory for a product variant reaches 1, five simultaneous requests competing for that unit result in exactly 1 successful order (HTTP 201) and 4 out-of-stock rejections (HTTP 422), with remaining stock ending at exactly 0.
* **Test Implementation Architecture:**
  ```php
  it('prevents overselling under genuine parallel checkout requests on MySQL', function () {
      $product = Product::factory()->create();
      $variant = ProductVariant::factory()->create([
          'product_id' => $product->id,
          'stock_quantity' => 1, // Only 1 item available
          'manage_stock' => true,
      ]);

      // Spawn 5 concurrent asynchronous worker processes firing HTTP requests simultaneously
      $url = route('checkout.cod.store');
      $payloads = array_map(fn($i) => json_encode([
          'name' => "Customer {$i}",
          'phone' => '01712345678',
          'address' => 'Mirpur-10, Dhaka',
          'district' => 'Dhaka',
          'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
          'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
      ]), range(1, 5));

      // Execute via parallel multi-process HTTP test harness
      $results = runParallelHttpRequests($url, $payloads);

      $successCount = count(array_filter($results, fn($r) => $r['status'] === 201));
      $exhaustedCount = count(array_filter($results, fn($r) => $r['status'] === 422));

      expect($successCount)->toBe(1);
      expect($exhaustedCount)->toBe(4);
      expect($variant->fresh()->stock_quantity)->toBe(0); // Zero negative stock
  })->group('concurrency', 'mysql');
  ```

### 3.2 Anti-Duplicate Checkout & Idempotency Key Test
* **Objective:** Verify that when a user accidentally clicks "Order Now" multiple times in rapid succession, only one order is generated and inventory is only decremented once.
* **Test Implementation:**
  ```php
  it('returns existing order when duplicate idempotency key is submitted', function () {
      $variant = ProductVariant::factory()->create(['stock_quantity' => 10, 'manage_stock' => true]);
      $idempotencyKey = (string) \Illuminate\Support\Str::uuid();

      $payload = [
          'name' => 'Rahim Ahmed',
          'phone' => '01700000000',
          'address' => 'Dhanmondi, Dhaka',
          'district' => 'Dhaka',
          'idempotency_key' => $idempotencyKey,
          'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
      ];

      $res1 = $this->postJson(route('checkout.cod.store'), $payload);
      $res2 = $this->postJson(route('checkout.cod.store'), $payload);

      expect($res1->status())->toBe(201);
      expect($res2->status())->toBe(200); // Idempotent response with existing order
      expect(Order::where('idempotency_key', $idempotencyKey)->count())->toBe(1);
      expect($variant->fresh()->stock_quantity)->toBe(9); // Decremented exactly once
  });
  ```

### 3.3 Repeated Cancellation & Duplicate Webhook Delivery Tests (Idempotent Restocking)
* **Objective:** Verify that cancelling an order multiple times or receiving duplicate courier return webhooks does not replenish stock more than once.
* **Test Implementation:**
  ```php
  it('replenishes inventory exactly once upon repeated cancellation', function () {
      $variant = ProductVariant::factory()->create(['stock_quantity' => 5, 'manage_stock' => true]);
      $order = createOrderWithItems($variant, quantity: 2); // Stock was decremented to 3
      expect($variant->fresh()->stock_quantity)->toBe(3);

      // Cancel order (first attempt)
      $this->postJson(route('admin.orders.cancel', $order), ['reason' => 'Customer changed mind']);
      expect($variant->fresh()->stock_quantity)->toBe(5);
      expect($order->items()->first()->is_restocked)->toBeTrue();

      // Duplicate cancel attempt
      $this->postJson(route('admin.orders.cancel', $order), ['reason' => 'Duplicate cancellation attempt']);
      expect($variant->fresh()->stock_quantity)->toBe(5); // Must remain 5, not 7
  });

  it('replenishes inventory exactly once upon duplicate courier return webhook delivery', function () {
      $variant = ProductVariant::factory()->create(['stock_quantity' => 5, 'manage_stock' => true]);
      $order = createOrderWithItems($variant, quantity: 2);
      expect($variant->fresh()->stock_quantity)->toBe(3);

      // First webhook delivery: order marked returned
      $webhookPayload = ['consignment_id' => $order->courier_tracking_id, 'status' => 'returned'];
      $res1 = $this->postJson(route('webhooks.courier.update'), $webhookPayload);
      expect($res1->status())->toBe(200);
      expect($variant->fresh()->stock_quantity)->toBe(5);

      // Duplicate webhook delivery with identical consignment ID
      $res2 = $this->postJson(route('webhooks.courier.update'), $webhookPayload);
      expect($res2->status())->toBe(200);
      expect($variant->fresh()->stock_quantity)->toBe(5); // Must not increment to 7
  });
  ```

### 3.4 Page Builder AST Security & Sanitization Test
* **Objective:** Ensure that malicious payloads injected into the page builder JSON cannot execute arbitrary JavaScript or store dangerous tags in the database. Never render arbitrary merchant-provided JavaScript or unsanitized raw HTML.
* **Test Matrix:**
  * Payload containing `<script>alert(1)</script>` in headline or text props -> **Must be rejected with HTTP 422**.
  * Payload containing `<iframe src="javascript:alert(1)">` -> **Must be rejected with HTTP 422**.
  * Payload with `onerror=alert(1)` or `onload=alert(1)` or `onclick=alert(1)` attributes -> **Must be rejected with HTTP 422**.
  * Payload with JavaScript URL `javascript:void(0)` or `data:text/html,...` or `vbscript:` in CTA links -> **Must be rejected with HTTP 422**.
  * Payload with unsafe CSS injection `position: fixed; width: 100vw; height: 100vh` -> **Must be rejected (prevents clickjacking overlay attacks)**.
  * Payload with CSS `@import` or `expression()` -> **Must be rejected with HTTP 422**.
  * Payload attempting to define unregistered block type `EvilIframeBlock` -> **Must be rejected with HTTP 422 (Unknown block type)**.

### 3.5 Bangladesh Geography & Shipping Matrix Test
* **Test Cases:**
  * District `Dhaka` -> Shipping fee equals `BDT 70` (Inside Dhaka rate).
  * District `Gazipur` -> Shipping fee equals `BDT 100` (Sub-Dhaka rate).
  * District `Chittagong` -> Shipping fee equals `BDT 130` (Outside Dhaka rate).
  * Phone number variations:
    * `01712345678` -> Valid (Grameenphone).
    * `+8801812345678` -> Valid (Robi, sanitized to `01812345678`).
    * `8801912345678` -> Valid (Banglalink, sanitized).
    * `01112345678` -> Invalid (Citycell discontinued).
    * `01512345678` -> Valid (Teletalk).
    * `123456` or `0171234567899` -> Invalid (length mismatch).

### 3.6 Media Upload & MIME Security Test
* **Test Cases:**
  * Uploading genuine JPEG/PNG/WebP -> Success; converted to WebP; dimensions constrained.
  * Uploading a PHP script named `shell.php.jpg` with spoofed extension -> Fails server-side `finfo_file` MIME inspection.
  * Uploading raw unparsed SVG -> Blocked by default; requires maintained, security-reviewed SVG sanitizer (`enshrined/svg-sanitize`).

### 3.7 Database Backup & Restore Integrity Test
* **Objective:** Verify that `php artisan commerce:backup` creates a restorable SQL stream and `commerce:restore` reinstates all tables and records, with pre-restore snapshots and checksum validation guarding against MySQL DDL non-transactional failures.

---

## 4. Test Execution & Verification Protocol

### 4.1 Test Commands

```bash
# 1. Run fast ordinary unit and feature tests on SQLite
php artisan test

# 2. Run tests with coverage
php artisan test --coverage --min=80

# 3. Run genuine parallel concurrency suite against MySQL (Multi-process harness)
DB_CONNECTION=mysql php artisan test --group=concurrency

# 4. Run specific domain test suites
php artisan test tests/Feature/Checkout/CodCheckoutTest.php
php artisan test tests/Feature/PageBuilder/AstSecurityTest.php
php artisan test tests/Feature/Orders/OrderFsmTest.php

# 5. Run TypeScript type check
npm run type-check

# 6. Run Frontend unit tests
npm run test:unit
```

### 4.2 Test Verification Mandate
- **No Inventions:** AI agents and developers must execute tests in the terminal and inspect actual exit codes and stdout logs.
- **Reporting:** Summaries must cite the command executed, the test counts, and exact terminal error snippets if any failure occurs.
- Tests must never be claimed to have passed based on assumptions or past runs.
