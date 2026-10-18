@extends('installer.layout', ['title' => 'Step 3: Super Admin Account - Landing Commerce', 'step' => 3])

@section('content')
    <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Create Initial Super Admin Account</h2>
    <p style="font-size: 13px; color: #94a3b8; margin-bottom: 20px;">
        Database schema imported successfully! Now configure the primary Super Administrator account for your store management dashboard.
    </p>

    <form method="POST" action="{{ route('installer.admin.post') }}">
        @csrf

        <div class="form-group">
            <label for="name">Super Admin Name</label>
            <input type="text" id="name" name="name" class="form-control" value="{{ old('name', 'Store Administrator') }}" required>
        </div>

        <div class="form-group">
            <label for="email">Admin Email Address</label>
            <input type="email" id="email" name="email" class="form-control" value="{{ old('email', 'admin@example.com') }}" required>
            <div class="help-text">Used to log in to the admin panel.</div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" class="form-control" placeholder="••••••••" required>
                <div class="help-text">Minimum 8 characters.</div>
            </div>
            <div class="form-group">
                <label for="password_confirmation">Confirm Password</label>
                <input type="password" id="password_confirmation" name="password_confirmation" class="form-control" placeholder="••••••••" required>
            </div>
        </div>

        <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 14px; margin-top: 16px; margin-bottom: 24px; font-size: 12px; color: #94a3b8;">
            <strong style="color: #cbd5e1;">Finalization Step:</strong> Upon clicking complete, the installer will write your <code style="color: #a7f3d0;">.env</code> configuration file, mark installation as completed, and permanently disable all installer endpoints for security.
        </div>

        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px;">
            <a href="{{ route('installer.schema') }}" class="btn btn-secondary">&larr; Back</a>
            <button type="submit" class="btn">Finalize Installation &rarr;</button>
        </div>
    </form>
@endsection
