<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Landing Commerce - Web Installer' }}</title>
    <style>
        *, ::after, ::before { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #0f172a;
            color: #f1f5f9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .installer-container {
            width: 100%;
            max-width: 680px;
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
        }
        .installer-header {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            padding: 24px 32px;
            text-align: center;
        }
        .installer-header h1 {
            font-size: 22px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 6px;
            letter-spacing: -0.02em;
        }
        .installer-header p {
            font-size: 13px;
            color: #a7f3d0;
        }
        .stepper {
            display: flex;
            background: #0f172a;
            border-bottom: 1px solid #334155;
        }
        .step-item {
            flex: 1;
            padding: 12px 8px;
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            border-bottom: 2px solid transparent;
        }
        .step-item.active {
            color: #10b981;
            border-bottom-color: #10b981;
            background: rgba(16, 185, 129, 0.05);
        }
        .step-item.completed {
            color: #94a3b8;
        }
        .installer-body {
            padding: 32px;
        }
        .alert {
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        .alert-error {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid #ef4444;
            color: #fca5a5;
        }
        .alert-success {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid #10b981;
            color: #6ee7b7;
        }
        .alert-warning {
            background: rgba(245, 158, 11, 0.15);
            border: 1px solid #f59e0b;
            color: #fcd34d;
        }
        .form-group {
            margin-bottom: 18px;
        }
        .form-group label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 6px;
            color: #cbd5e1;
        }
        .form-control {
            width: 100%;
            padding: 10px 14px;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            color: #ffffff;
            font-size: 14px;
            outline: none;
            transition: border-color 0.15s;
        }
        .form-control:focus {
            border-color: #10b981;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .help-text {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
        }
        .btn {
            display: inline-block;
            width: 100%;
            padding: 12px 20px;
            background: #059669;
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            transition: background 0.15s;
        }
        .btn:hover {
            background: #047857;
        }
        .btn-secondary {
            background: #334155;
            color: #e2e8f0;
        }
        .btn-secondary:hover {
            background: #475569;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
        }
        .badge-pass { background: #065f46; color: #a7f3d0; }
        .badge-warn { background: #78350f; color: #fde68a; }
        .badge-fail { background: #7f1d1d; color: #fecaca; }
        .preflight-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 24px;
        }
        .preflight-table td, .preflight-table th {
            padding: 8px 12px;
            border-bottom: 1px solid #334155;
        }
        .preflight-table th {
            text-align: left;
            color: #94a3b8;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="installer-container">
        <div class="installer-header">
            <h1>Landing Commerce</h1>
            <p>One-Time cPanel Web Installation Wizard</p>
        </div>

        <div class="stepper">
            <div class="step-item {{ ($step ?? 1) >= 1 ? ($step == 1 ? 'active' : 'completed') : '' }}">1. Database</div>
            <div class="step-item {{ ($step ?? 1) >= 2 ? ($step == 2 ? 'active' : 'completed') : '' }}">2. Schema Import</div>
            <div class="step-item {{ ($step ?? 1) >= 3 ? ($step == 3 ? 'active' : 'completed') : '' }}">3. Super Admin</div>
            <div class="step-item {{ ($step ?? 1) >= 4 ? 'active' : '' }}">4. Ready</div>
        </div>

        <div class="installer-body">
            @if(session('error'))
                <div class="alert alert-error">
                    {{ session('error') }}
                </div>
            @endif

            @if(session('success'))
                <div class="alert alert-success">
                    {{ session('success') }}
                </div>
            @endif

            @if($errors->any())
                <div class="alert alert-error">
                    <ul style="padding-left: 18px;">
                        @foreach($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            @yield('content')
        </div>
    </div>
</body>
</html>
