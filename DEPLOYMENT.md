# cPanel Deployment & Web Installer Guide

This guide details how to deploy and configure the **Landing Commerce Starter Kit** on shared cPanel hosting environments without SSH or terminal access.

---

## 1. Prerequisites & Hosting Requirements

Before uploading, ensure your cPanel hosting account provides:
- **PHP Version:** PHP 8.3 or higher (selected via cPanel > *Select PHP Version* or *MultiPHP Manager*).
- **Required PHP Extensions:**
  - `pdo_mysql` (MySQL database connection)
  - `gd` (WebP image processing and responsive catalog thumbnails)
  - `fileinfo` (Strict binary MIME-type inspection for file uploads)
  - `mbstring` (Multibyte UTF-8 string manipulation)
  - `openssl` (AES-256 encrypted settings vault)
  - `zip` (ZipArchive extraction and backup generation)
  - `curl` (Courier API and SMS gateway integrations)
- **Database:** One MySQL database and associated MySQL user with full privileges created via cPanel > *MySQL Databases*.
- **Pre-Compiled Assets:** The deployment archive must contain pre-compiled frontend assets (`public/build/`) and the complete production `vendor/` directory. No Node.js or Composer runtime execution is required on the server.

---

## 2. Directory Layout & Document Root Setup

### Option A: Standard Setup with Document Root Pointing to `public/` (Recommended)

1. Upload the project zip archive to your user home directory (e.g. `/home/username/landing-commerce/`).
2. Extract the archive outside of `public_html`.
3. In cPanel > *Domains* (or *Subdomains* / *Addon Domains*), set the Document Root directly to `/home/username/landing-commerce/public`.
4. This ensures `.env`, `vendor/`, `storage/`, and application source code reside physically outside the public web root.

### Option B: Shared Hosting with Fixed `public_html` Document Root

If your cPanel host does not allow modifying the primary domain's document root away from `public_html`:

1. Upload and extract the project files into a private folder in your home directory (e.g. `/home/username/landing-commerce-app/`).
2. Move only the contents of `/home/username/landing-commerce-app/public/` into `/home/username/public_html/`.
3. In `/home/username/public_html/index.php`, update the paths to point to your private application directory:
   ```php
   // Change:
   require __DIR__.'/../vendor/autoload.php';
   $app = require_once __DIR__.'/../bootstrap/app.php';

   // To:
   require __DIR__.'/../landing-commerce-app/vendor/autoload.php';
   $app = require_once __DIR__.'/../landing-commerce-app/bootstrap/app.php';
   ```
4. **Security Notice:** Never copy `.env`, `vendor/`, `storage/`, or `.git` into `public_html`. Do not rely on `.htaccess` alone to protect private configuration files.

---

## 3. Storage & Cache Permissions

In cPanel > *File Manager*, ensure the following directories have write permissions (chmod `0755` or `0775`):
- `storage/` (including `storage/app/`, `storage/framework/`, and `storage/logs/`)
- `bootstrap/cache/`

---

## 4. One-Time Web Installation Wizard

Once deployed, open your website URL in any browser. The system will automatically detect that installation has not yet completed and route you to `/install`.

### Step 1: Preflight Diagnostics & Database Setup
- Review the automated diagnostic checks table (verifying PHP 8.3+, required extensions, and file write permissions).
- Enter your MySQL credentials:
  - **Host:** `127.0.0.1` or `localhost`
  - **Port:** `3306`
  - **Database Name:** The cPanel database name (e.g. `cpaneluser_commerce`)
  - **Database Username:** The cPanel database user (e.g. `cpaneluser_dbuser`)
  - **Database Password:** The MySQL user password
- The wizard tests the PDO connection immediately. Passwords are never logged, redisplayed, or embedded in URLs.

### Step 2: MySQL Schema Import
- **Option 1 (Recommended):** Use the pre-bundled official starter schema (`database/schema/mysql-starter.sql`). This creates all 22 core tables and seeds the Bangladesh shipping zones.
- **Option 2:** Upload a custom `.sql` or `.zip` dump (up to 50 MB).
- **Security Protections:** The schema validator automatically rejects:
  - Dangerous commands (`DROP DATABASE`, `CREATE DATABASE`, `CREATE USER`, `GRANT`, `LOAD DATA`, `INTO OUTFILE`, `USE other_db`)
  - Embedded executable scripts (`<?php`, `<script>`)
  - Zip-Slip path traversal attacks inside uploaded archives
  - SQLite syntax (`AUTOINCREMENT` instead of MySQL `AUTO_INCREMENT`)
- **MySQL DDL Recovery Advice:** In MySQL, DDL statements (`CREATE TABLE`, `DROP TABLE`) trigger implicit commits and cannot be rolled back atomically. If an import fails midway, use cPanel > *phpMyAdmin* to drop any partially created tables before retrying.

### Step 3: Initial Super Admin Setup
- Enter the store administrator's name, email, and password (minimum 8 characters with confirmation).
- Passwords are securely hashed using Laravel's bcrypt implementation.
- Overwriting or creating duplicate Super Admin accounts is strictly prohibited.

### Step 4: Finalization & Security Lockout
- The installer writes database credentials to `.env` using atomic write operations.
- If server filesystem permissions prevent writing to `.env`, the wizard presents manual configuration instructions with masked passwords.
- A durable installation marker is written to `storage/installed` outside the public web root.
- The installer mutex lock (`storage/framework/installer.lock`) is released and session secrets are invalidated.
- All `/install*` endpoints are **permanently disabled** (HTTP 404).

---

## 5. Security & Self-Healing Guarantees

1. **Permanent Route Lockout:** Once `storage/installed` exists, any request to `/install` aborts with HTTP 404.
2. **Self-Healing Protection:** If an attacker attempts to delete `storage/installed` via a file exploit, the system checks whether a Super Admin exists in the database. If so, it automatically restores the marker and keeps setup routes locked out.
3. **Reserved Slugs:** Public landing page dynamic routes (`/{slug}`) strictly prohibit `install` to avoid capturing installer paths.
4. **No Public Commands Required:** No terminal, SSH, Composer, or Artisan execution is necessary on the live cPanel server.

---

## 6. Production Deployment & Readiness Checklist (VPS / Terminal Environments)

For automated deployments or dedicated/VPS servers with terminal access, follow this strict checklist:

### 6.1 Environment Configuration (.env)
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false` (Critical: Never run `APP_DEBUG=true` in production to prevent stack trace information disclosure)
- [ ] `APP_URL=https://yourdomain.com` (Must match canonical HTTPS production domain)
- [ ] `SESSION_SECURE_COOKIE=true` (Enforce HTTPS-only transmission of session cookies)
- [ ] `DB_CONNECTION=mysql` with dedicated unprivileged MySQL user
- [ ] `CACHE_STORE=file` or `redis` (file cache works with zero external services)
- [ ] `QUEUE_CONNECTION=database` or `redis`

### 6.2 Pre-Deployment Build Pipeline
Run these on CI/CD or staging machine before deploying:
```bash
# 1. Install production dependencies (zero dev packages)
composer install --no-dev --prefer-dist --optimize-autoloader

# 2. Compile frontend assets
npm ci
npm run build

# 3. Verify static types & code quality
npm run type-check
./vendor/bin/pint --test
```

### 6.3 Server Deployment Routine
On the production server:
```bash
# 1. Enter maintenance mode with secret bypass
php artisan down --secret="your-deploy-secret"

# 2. Execute non-destructive database migrations
php artisan migrate --force

# 3. Create public storage symlink if missing
php artisan storage:link

# 4. Cache configuration, routes, and views for maximum performance
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 5. Clear application runtime cache
php artisan cache:clear

# 6. Restart queue workers to pick up new code
php artisan queue:restart

# 7. Exit maintenance mode
php artisan up
```

### 6.4 Systemd / Supervisor Queue Worker Setup
For background processing (courier webhooks, SMS notifications, order restock listeners):
```ini
[program:landing-commerce-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/landing-commerce/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/landing-commerce/storage/logs/worker.log
```

### 6.5 Production Cron Scheduling
Add a single cron entry to the web server user's crontab:
```bash
* * * * * cd /var/www/landing-commerce && php artisan schedule:run >> /dev/null 2>&1
```

### 6.6 Rollback Procedure
If a critical error is detected post-deployment:
1. `php artisan down`
2. Checkout previous known-stable Git commit tag: `git checkout <previous-tag>`
3. Roll back any newly added migrations: `php artisan migrate:rollback --step=1`
4. Re-compile or restore previous `public/build` assets.
5. `php artisan config:cache && php artisan route:cache && php artisan view:cache`
6. `php artisan up`
7. In case of database restore, use `php artisan commerce:restore <backup-filename>`.

---

## 7. Environment-Specific Deployment Matrix

| Feature / Concern | Local Windows (Laragon) | Linux VPS / Dedicated (Ubuntu/Debian) | Shared cPanel (Without SSH) |
|---|---|---|---|
| **PHP Runtime** | Laragon PHP 8.3.33 CLI (`php.exe`) | PHP 8.3+ FPM (`php8.3-fpm`) | cPanel MultiPHP / EA-PHP 8.3+ |
| **Required Extensions** | `pdo_mysql`, `gd`, `fileinfo`, `zip`, `mbstring`, `curl` | Same (via `apt install php8.3-gd php8.3-zip ...`) | Enabled in cPanel > Select PHP Extensions |
| **Web Server** | Nginx or Apache (Laragon default) | Nginx with root `/path/to/public` | Apache / LiteSpeed (`.htaccess` / Option B) |
| **Node.js / Vite Assets** | `npm run dev` (HMR) or `npm run build` | Pre-compiled via CI/CD before deployment | Pre-compiled locally before archive upload |
| **Database** | MySQL 8.4.3 or SQLite | MySQL 8.0+ / MariaDB 10.6+ | cPanel MySQL database & user |
| **Queue Execution** | `QUEUE_CONNECTION=sync` (or `artisan queue:work`) | `QUEUE_CONNECTION=database`/`redis` via Supervisor | `QUEUE_CONNECTION=sync` or cPanel Cron artisan queue:work |
| **Scheduled Tasks** | Manual or Windows Task Scheduler | System crontab (`* * * * * php artisan schedule:run`) | cPanel > Cron Jobs (`php /path/to/artisan schedule:run`) |
| **Backups & Restores** | `php artisan commerce:backup` CLI | `php artisan commerce:backup` / `commerce:restore` | Pure-PHP Backup Command or cPanel phpMyAdmin |
| **Installer Interface** | CLI `commerce:install` or browser | CLI `commerce:install` | One-Time Browser Web Installer (`/install`) |

> [!NOTE]
> **Shared Hosting Limitations:** Shared hosting environments frequently impose CloudLinux LVE memory ceilings (e.g. 1GB RAM) and disable shell execution functions (`exec`, `shell_exec`, `proc_open`). The Landing Commerce codebase is specifically engineered with zero-dependency pure-PHP solutions (such as `DatabaseDumpService`, `BarcodeGeneratorService`, and the Blade AST renderer) so that no native shell binaries (like `mysqldump`) or persistent Node.js servers are required. Always verify with your specific host that PHP >= 8.3 and all required extensions are supported before provisioning.
