<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Maintenance Schedule for {{ $machine->name }}</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            font-size: 11px;
            color: #333;
        }

        .header {
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
            overflow: auto;
        }

        .header .logo {
            width: 120px;
            float: left;
        }

        .header .report-title {
            text-align: right;
        }

        .header h1 {
            margin: 0;
            font-size: 22px;
        }

        .header p {
            margin: 5px 0;
            color: #555;
        }

        .schedule-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .schedule-table th,
        .schedule-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        .schedule-table th {
            background-color: #f2f2f2;
        }

        .section-title {
            border-bottom: 2px solid #fcfcfc;
            padding-bottom: 5px;
            font-size: 16px;
            margin-top: 20px;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            color: white;
            font-weight: bold;
            font-size: 10px;
        }

        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 10px;
            color: #777;
        }
    </style>
</head>

<body>
    <div class="header">
        <img src="{{ public_path('logo.png') }}" alt="Company Logo" class="logo">
        <div class="report-title">
            <h1>Maintenance Schedule</h1>
            <p>Machine: {{ $machine->name }}</p>
        </div>
    </div>

    <h3 style="margin-top: 30px" class="section-title">Upcoming Schedule</h3>
    <table class="schedule-table">
        <thead>
            <tr>
                <th>Task</th>
                <th>Target</th>
                <th>Scheduled Date</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @php
                $statusColors = [
                    'scheduled' => '#3b82f6', // blue-500
                    'in_progress' => '#eab308', // yellow-500
                    'in_progress_overdue' => '#eab308', // yellow-500
                    'completed' => '#22c55e', // green-500
                    'overdue' => '#ef4444', // red-500
                    'completed_overdue' => '#f97316', // orange-500
                ];
            @endphp
            @forelse($upcoming as $item)
                <tr>
                    <td>{{ $item->title }}</td>
                    <td>{{ $item->schedulable->name }}</td>
                    <td>{{ $item->scheduled_date->format('M d, Y') }}</td>
                    <td>
                        <span class="status-badge"
                            style="background-color: {{ $statusColors[$item->status] ?? '#6b7280' }};">
                            {{ str_replace('_', ' ', Str::title($item->status)) }}
                        </span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" style="text-align: center;">No upcoming maintenance scheduled.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <h3 class="section-title">Maintenance History</h3>
    <table class="schedule-table">
        <thead>
            <tr>
                <th>Task</th>
                <th>Target</th>
                <th>Completion Date</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($history as $item)
                <tr>
                    <td>{{ $item->title }}</td>
                    <td>{{ $item->schedulable->name }}</td>
                    <td>{{ $item->report ? $item->report->completed_at->format('M d, Y') : 'N/A' }}</td>
                    <td>
                        <span class="status-badge"
                            style="background-color: {{ $statusColors[$item->status] ?? '#6b7280' }};">
                            {{ str_replace('_', ' ', Str::title($item->status)) }}
                        </span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" style="text-align: center;">No maintenance history.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Generated on {{ now()->format('M d, Y') }}
    </div>
</body>

</html>
