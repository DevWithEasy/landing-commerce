@extends('installer.layout', ['title' => 'Step 1: Database Setup - Landing Commerce', 'step' => 1])

@section('content')
    <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">System Preflight & MySQL Database</h2>
    <p style="font-size: 13px; color: #94a3b8; margin-bottom: 20px;">
        Before proceeding, verify that your cPanel hosting environment satisfies all requirements and configure your MySQL database credentials.
    </p>

    <table class="preflight-table">
        <thead>
            <tr>
                <th>Requirement</th>
                <th>Status</th>
                <th>Details</th>
            </tr>
        </thead>
        <tbody>
            @foreach($preflight['checks'] as $check)
                <tr>
                    <td><strong>{{ $check['name'] }}</strong></td>
                    <td>
                        <span class="badge {{ $check['status'] === 'PASS' ? 'badge-pass' : ($check['status'] === 'WARN' ? 'badge-warn' : 'badge-fail') }}">
                            {{ $check['status'] }}
                        </span>
                    </td>
                    <td style="color: #cbd5e1;">{{ $check['message'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if($preflight['has_failures'])
        <div class="alert alert-error">
            <strong>Critical Requirements Unmet:</strong> Please resolve the failed checks above in your cPanel PHP Selector before continuing.
        </div>
    @endif

    <form method="POST" action="{{ route('installer.database.post') }}">
        @csrf

        <div class="form-row">
            <div class="form-group">
                <label for="db_host">MySQL Host</label>
                <input type="text" id="db_host" name="db_host" class="form-control" value="{{ old('db_host', $savedDb['host'] ?? '127.0.0.1') }}" required>
                <div class="help-text">Typically 127.0.0.1 or localhost in cPanel.</div>
            </div>
            <div class="form-group">
                <label for="db_port">MySQL Port</label>
                <input type="number" id="db_port" name="db_port" class="form-control" value="{{ old('db_port', $savedDb['port'] ?? 3306) }}" required>
                <div class="help-text">Default port is 3306.</div>
            </div>
        </div>

        <div class="form-group">
            <label for="db_database">Database Name</label>
            <input type="text" id="db_database" name="db_database" class="form-control" value="{{ old('db_database', $savedDb['database'] ?? '') }}" placeholder="e.g. cpaneluser_commerce" required>
            <div class="help-text">Must be created in cPanel &gt; MySQL Databases beforehand.</div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="db_username">Database Username</label>
                <input type="text" id="db_username" name="db_username" class="form-control" value="{{ old('db_username', $savedDb['username'] ?? '') }}" placeholder="e.g. cpaneluser_dbuser" required>
            </div>
            <div class="form-group">
                <label for="db_password">Database Password</label>
                <input type="password" id="db_password" name="db_password" class="form-control" placeholder="••••••••" autocomplete="off">
                <div class="help-text">Never saved to logs or redisplayed.</div>
            </div>
        </div>

        <div style="margin-top: 24px;">
            <button type="submit" class="btn" {{ $preflight['has_failures'] ? 'disabled' : '' }}>
                Test Connection &amp; Proceed &rarr;
            </button>
        </div>
    </form>
@endsection
