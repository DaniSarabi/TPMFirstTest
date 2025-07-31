<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inspection Report #{{ $report->id }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            color: #333;
        }

        .header {
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }

        .header .logo {
            width: 150px;
            float: left;
        }

        .header .report-title {
            text-align: right;
        }

        .report-details {
            width: 100%;
            margin-bottom: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }

        .report-details td {
            padding: 8px;
        }

        .report-details .label {
            font-weight: bold;
            background-color: #f9f9f9;
        }

        .subsystem-header {
            background-color: #eee;
            padding: 10px;
            font-size: 14px;
            font-weight: bold;
            margin-top: 20px;
        }

        .item-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .item-table th,
        .item-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }

        .item-table th {
            background-color: #f2f2f2;
        }

        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
        }

        .inspection-image {
            max-width: 200px;
            margin-top: 10px;
            border-radius: 5px;
        }

        .footer {
            position: fixed;
            bottom: 0px;
            left: 0px;
            right: 0px;
            height: 50px;
            text-align: center;
            font-size: 10px;
            color: #777;
        }
    </style>
</head>

<body>

    <div class="header">
        {{-- You can place your company logo here --}}
        <img src="{{ public_path('logo.png') }}" alt="Company Logo" class="logo">
        <div class="report-title">
            <h1>Inspection Report</h1>
            <p>Report ID: #{{ $report->id }}</p>
        </div>
    </div>

    <h2>Report Summary</h2>
    <table class="report-details">
        <tr>
            <td class="label" width="25%">Machine Name:</td>
            <td width="25%">{{ $report->machine->name }}</td>
            <td class="label" width="25%">Inspected By:</td>
            <td width="25%">{{ $report->user->name }}</td>
        </tr>
        <tr>
            <td class="label">Start Time:</td>
            <td>{{ $report->created_at->format('M d, Y, h:i A') }}</td>
            <td class="label">Completion Time:</td>
            <td>{{ $report->completed_at ? $report->completed_at->format('M d, Y, h:i A') : 'N/A' }}</td>
        </tr>
    </table>

    <h2>Inspection Results</h2>

    @foreach ($groupedItems as $subsystemName => $items)
    <div class="subsystem-header">{{ $subsystemName }}</div>
    <table class="item-table">
        <thead>
            <tr>
                <th width="40%">Inspection Point</th>
                <th width="15%">Status</th>
                <th width="45%">Comments & Notes</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($items as $item)
            <tr>
                <td>{{ $item->point->name }}</td>
                <td>
                    <span class="status-badge" style="background-color: {{ $item->status->bg_color }}; color: {{ $item->status->text_color }};">
                        {{ $item->status->name }}
                    </span>
                </td>
                <td>
                    @if($item->comment)
                    <p><strong>Comment:</strong> {{ $item->comment }}</p>
                    @endif
                    {{-- --- ACTION: Add the image to the PDF --- --}}
                    @if(isset($item->full_image_path) && file_exists($item->full_image_path))
                    <img src="{{ $item->full_image_path }}" class="inspection-image">
                    @elseif($item->image_url)
                    <p><em>An image was attached but could not be loaded.</em></p>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endforeach

    <div class="footer">
        Generated on {{ now()->format('M d, Y') }}
    </div>

</body>

</html>