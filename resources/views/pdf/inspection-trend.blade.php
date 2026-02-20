<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $machine->name }} - Inspection Records</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #333;
            margin: 0;
            padding: 0;
        }

        /* --- JST Corporate Colors --- */
        .jst-blue {
            color: #344a8a;
        }

        .jst-red {
            color: #e53330;
        }

        .bg-jst-blue {
            background-color: #344a8a;
            color: #ffffff;
        }

        /* --- Header Styles --- */
        .header {
            width: 100%;
            margin-bottom: 15px;
            border-bottom: 2px solid #344a8a;
            /* JST Blue border */
            padding-bottom: 10px;
            height: 50px;
        }

        .header .logo {
            width: 130px;
            float: left;
        }

        .header .report-title {
            text-align: right;
            float: right;
        }

        .header .report-title h1 {
            margin: 0;
            font-size: 18px;
            color: #344a8a;
            /* JST Blue */
            text-transform: uppercase;
        }

        .header .report-title p {
            margin: 4px 0 0 0;
            font-size: 11px;
            color: #555;
        }

        /* --- Summary Box --- */
        .report-details {
            width: 100%;
            margin-bottom: 30px;
            border: 1px solid #ddd;
            border-radius: 4px;
            border-collapse: collapse;
            margin-left: 140px;
        }

        .report-details td {
            padding: 6px 8px;
            font-size: 10px;
        }

        .report-details .label {
            font-weight: bold;
            background-color: #f8fafc;
            border-right: 1px solid #ddd;
            width: 15%;
            color: #344a8a;
            /* Subtle JST Blue for labels */
        }

        .report-details .value {
            border-right: 1px solid #ddd;
            width: 35%;
        }

        /* --- Matrix Table Styles --- */
        table.matrix-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 20px;
        }

        .matrix-table th,
        .matrix-table td {
            border: 1px solid #ddd;
            padding: 6px 4px;
            text-align: center;
            vertical-align: middle;
            word-wrap: break-word;
        }

        .matrix-table th {
            background-color: #f8fafc;
            font-weight: bold;
            font-size: 10px;
            color: #344a8a;
            /* JST Blue */
            text-transform: uppercase;
        }

        .matrix-table .point-name {
            text-align: left;
            font-weight: bold;
            width: 30%;
            /* Slightly wider for portrait mode */
            font-size: 9px;
            color: #444;
        }

        .matrix-table .subsystem-row {
            background-color: #344a8a;
            /* JST Blue */
            color: #ffffff;
            /* White text */
            font-weight: bold;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            padding: 4px 8px;
        }

        /* --- Subtle Status Badges --- */
        .status-badge {
            display: inline-block;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
            background-color: #ffffff;
            /* White background makes it subtle */
            /* Border and Text color will be injected dynamically */
        }

        .empty-cell {
            color: #e53330;
            /* JST Red */
            font-size: 8px;
            font-weight: bold;
            font-style: italic;
        }

        /* --- Utils --- */
        .page-break {
            page-break-after: always;
        }

        .footer {
            position: fixed;
            bottom: -20px;
            left: 0px;
            right: 0px;
            height: 30px;
            text-align: center;
            font-size: 9px;
            color: #777;
            border-top: 1px solid #ddd;
            padding-top: 5px;
        }

        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
    </style>
</head>

<body>

    <div class="footer">
        JST Power Equipment - Inspection Records - Generated on {{ now()->format('M d, Y H:i A') }}
    </div>

    @foreach ($dateChunks as $chunkIndex => $chunk)
        <div class="{{ !$loop->last ? 'page-break' : '' }}">

            <div class="header clearfix">
                <img src="{{ public_path('logo.png') }}" alt="JST Logo" class="logo">
                <div class="report-title">
                    <h1>Inspection Records</h1>
                    <p>Page {{ $chunkIndex + 1 }} of {{ count($dateChunks) }}</p>
                </div>
            </div>

            <table class="report-details">
                <tr>
                    <td class="label">Machine:</td>
                    <td class="value"><strong>{{ $machine->name }}</strong></td>
                    <td class="label">Period:</td>
                    <td class="value">{{ $startDate->format('M d, Y') }} to {{ $endDate->format('M d, Y') }}</td>
                </tr>
            </table>

            <table class="matrix-table">
                <thead>
                    <tr>
                        <th class="point-name">Inspection Point</th>
                        @foreach ($chunk as $date)
                            <th>{{ \Carbon\Carbon::parse($date)->format('M d (D)') }}</th>
                        @endforeach
                    </tr>
                </thead>
                <tbody>
                    @foreach ($matrix as $subsystemName => $points)
                        <tr>
                            <td colspan="{{ count($chunk) + 1 }}" class="subsystem-row">
                                {{ $subsystemName }}
                            </td>
                        </tr>

                        @foreach ($points as $pointName => $dates)
                            <tr>
                                <td class="point-name">{{ $pointName }}</td>

                                @foreach ($chunk as $date)
                                    @php
                                        $status = $dates[$date] ?? null;
                                    @endphp

                                    @if ($status)
                                        <td>
                                            {{-- ACTION: Subtle Badge Implementation --}}
                                            <span class="status-badge"
                                                style="border: 1px solid {{ $status->bg_color }}; ">
                                                {{ $status->name }}
                                            </span>
                                        </td>
                                    @else
                                        <td>
                                            <span class="empty-cell">No Record</span>
                                        </td>
                                    @endif
                                @endforeach
                            </tr>
                        @endforeach
                    @endforeach
                </tbody>
            </table>
        </div>
    @endforeach

</body>

</html>
