<!DOCTYPE html>
<html>

<head>
    <title>Overdue Maintenance Alert</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }

        .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header {
            background-color: #ef4444;
            color: #ffffff;
            padding: 15px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }

        .header h2 {
            margin: 0;
            font-size: 24px;
        }

        .content {
            padding: 20px 0;
        }

        .details-box {
            background-color: #f9f9f9;
            border: 1px solid #eee;
            padding: 15px;
            margin-top: 20px;
            border-radius: 5px;
        }

        .details-box h3 {
            margin-top: 0;
            color: #ef4444;
        }

        .button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }

        .footer {
            font-size: 0.9em;
            color: #777;
            margin-top: 20px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h2>Overdue Maintenance Alert</h2>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>This is an automated notification to inform you that a scheduled maintenance task is now overdue.</p>

            <div class="details-box">
                <h3>Maintenance Details:</h3>
                <ul>
                    <li><strong>Task:</strong> {{ $maintenance->title }}</li>
                    <li><strong>Target:</strong> {{ $maintenance->schedulable->name }}
                        ({{ class_basename($maintenance->schedulable_type) }})</li>
                    <li><strong>Scheduled Date:</strong> {{ $maintenance->scheduled_date->format('M d, Y') }}</li>
                    <li><strong>Due Date:</strong>
                        {{ $maintenance->scheduled_date->addDays($maintenance->grace_period_days)->format('M d, Y') }}
                    </li>
                </ul>
            </div>

            <p>Please ensure this maintenance is completed as soon as possible to prevent potential equipment failure.
            </p>

            <a href="{{ route('maintenance.perform.show', $maintenance->id) }}" class="button">View & Perform
                Maintenance</a>
        </div>
        <div class="footer">
            {{-- Aquí es donde incluiremos nuestra nueva firma --}}
            @include('emails.partials.signature')
        </div>
    </div>
</body>

</html>
