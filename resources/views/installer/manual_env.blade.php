@extends('installer.layout', ['title' => 'Manual Configuration Required - Landing Commerce', 'step' => 4])

@section('content')
    <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #f59e0b;">Manual File Configuration Required</h2>
    <p style="font-size: 13px; color: #94a3b8; margin-bottom: 20px;">
        Database and Super Admin account have been created, but your server filesystem permissions prevented automatically writing to <code style="color: #a7f3d0;">.env</code>.
    </p>

    <div class="alert alert-warning">
        Please complete this one-time step via <strong>cPanel &gt; File Manager</strong> before accessing your store.
    </div>

    <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <ol style="padding-left: 18px; font-size: 13px; line-height: 1.8; color: #cbd5e1;">
            <li>Log into your cPanel account and open <strong>File Manager</strong>.</li>
            <li>Navigate to the root directory where your application is installed.</li>
            <li>Locate or create the file named <code style="color: #a7f3d0;">.env</code>.</li>
            <li>Ensure the following settings are updated with your MySQL database details:
                <pre style="background: #020617; padding: 12px; border-radius: 6px; margin: 8px 0; color: #38bdf8; font-family: monospace; font-size: 12px; overflow-x: auto;">
DB_CONNECTION=mysql
DB_HOST={{ $dbHost ?? '127.0.0.1' }}
DB_PORT={{ $dbPort ?? 3306 }}
DB_DATABASE={{ $dbDatabase ?? 'your_database_name' }}
DB_USERNAME={{ $dbUsername ?? 'your_database_user' }}
DB_PASSWORD="[Your Database Password]"
APP_ENV=production
APP_DEBUG=false
                </pre>
            </li>
            <li>Set file permissions on <code style="color: #a7f3d0;">.env</code> to <strong>0640</strong> or <strong>0644</strong>.</li>
        </ol>
    </div>

    <div style="margin-top: 24px;">
        <a href="{{ route('login') }}" class="btn">I Have Configured .env &mdash; Proceed to Login &rarr;</a>
    </div>
@endsection
