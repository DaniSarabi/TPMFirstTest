<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upcoming Maintenance Reminder</title>
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
            border-radius: 5px;
        }

        .header {
            background-color: #68cccf;
            color: #ffffff;
            padding: 15px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }

        .content {
            padding: 20px 0;
        }

        .content h2 {
            color: #0056b3;
        }

        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .details-table th,
        .details-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        .details-table th {
            background-color: #f9f9f9;
        }

        .footer {
            text-align: left;
            font-size: 0.9em;
            color: #777;
            margin-top: 20px;
        }

        .button {
            display: inline-block;
            background-color: #0056b3;
            color: #ffffff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>Maintenance Reminder</h1>
        </div>
        <div class="content">
            <h2>Hello,</h2>
            <p>This is a reminder that the following scheduled maintenance is approaching its due date:</p>

            <table class="details-table">
                <tr>
                    <th>Task:</th>
                    <td>{{ $maintenance->title }}</td>
                </tr>
                <tr>
                    <th>Machine / Subsystem:</th>
                    <td>{{ $maintenance->schedulable->name }}</td>
                </tr>
                <tr>
                    <th>Scheduled Date:</th>
                    <td>{{ $maintenance->scheduled_date->format('M d, Y') }}</td>
                </tr>
            </table>

            <p>Please ensure all necessary preparations are made to complete this task on time.</p>

            <a href="{{ route('maintenance-calendar.index') }}" class="button" style="color: #ffffff;">View Calendar</a>
        </div>
        <div class="footer">
            {{-- Aquí es donde incluiremos nuestra nueva firma --}}
            @include('emails.partials.signature')
        </div>
    </div>
</body>

</html>
