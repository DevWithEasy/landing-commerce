@extends('installer.layout', ['title' => 'Step 2: Schema Import - Landing Commerce', 'step' => 2])

@section('content')
    <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">MySQL Database Schema Setup</h2>
    <p style="font-size: 13px; color: #94a3b8; margin-bottom: 20px;">
        Initialize your Landing Commerce database tables and initial catalog records. You may import the pre-bundled official starter schema or upload a custom MySQL dump.
    </p>

    <div class="alert alert-warning">
        <strong>Important Notice on MySQL DDL:</strong> In MySQL, table creation and modification statements trigger implicit commits and cannot be rolled back atomically. If an import fails midway, you may need to drop and re-create a clean empty database in cPanel phpMyAdmin before retrying.
    </div>

    <form method="POST" action="{{ route('installer.schema.post') }}" enctype="multipart/form-data">
        @csrf

        <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
            <label style="display: flex; align-items: flex-start; cursor: pointer;">
                <input type="radio" name="schema_source" value="bundled" checked style="margin-top: 3px; margin-right: 12px;" id="radio_bundled" onchange="toggleUploadSection()">
                <div>
                    <strong style="color: #ffffff; font-size: 14px;">Use Official Pre-Bundled MySQL Starter Schema (Recommended)</strong>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                        Automatically imports all 22 core tables (products, orders, variants, settings, AST page builder, and Bangladesh shipping matrix).
                    </div>
                </div>
            </label>
        </div>

        <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
            <label style="display: flex; align-items: flex-start; cursor: pointer;">
                <input type="radio" name="schema_source" value="upload" style="margin-top: 3px; margin-right: 12px;" id="radio_upload" onchange="toggleUploadSection()">
                <div>
                    <strong style="color: #ffffff; font-size: 14px;">Upload Custom MySQL Dump (.sql or .zip)</strong>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                        Upload an existing schema or backup export (max 50 MB). Dangerous commands such as DROP DATABASE or GRANT are strictly rejected.
                    </div>
                </div>
            </label>

            <div id="upload_section" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px dashed #334155;">
                <label for="sql_file" style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #cbd5e1;">Select .sql or .zip file:</label>
                <input type="file" id="sql_file" name="sql_file" accept=".sql,.zip" class="form-control">
                <div class="help-text">Must contain MySQL-compatible DDL. SQLite dumps (AUTOINCREMENT) will be rejected.</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-top: 24px;">
            <a href="{{ route('installer.index') }}" class="btn btn-secondary">&larr; Back</a>
            <button type="submit" class="btn">Import Schema &amp; Continue &rarr;</button>
        </div>
    </form>

    <script>
        function toggleUploadSection() {
            var isUpload = document.getElementById('radio_upload').checked;
            document.getElementById('upload_section').style.display = isUpload ? 'block' : 'none';
        }
    </script>
@endsection
