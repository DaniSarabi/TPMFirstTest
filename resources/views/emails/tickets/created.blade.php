<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Ticket Created: #{{ $ticket->id }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
            line-height: 1.6;
            color: #3d4852;
            background-color: #f8fafc;
        }

        .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background-color: #ffffff;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }

        .header {
            background-color: #3b82f6;
            /* Blue for tickets */
            color: #ffffff;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }

        .header h1 {
            margin: 0;
            font-size: 24px;
        }

        .content {
            padding: 25px 0;
        }

        .content p {
            margin-top: 0;
        }

        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .details-table th,
        .details-table td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: left;
        }

        .details-table th {
            background-color: #f7fafc;
            width: 30%;
            font-weight: 600;
        }

        .priority-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
        }

        .priority-2 {
            background-color: #fecaca;
            color: #991b1b;
        }

        /* Critical */
        .priority-1 {
            background-color: #fef08a;
            color: #854d0e;
        }

        /* Warning */

        .button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
            font-weight: 600;
        }

        .footer {
            text-align: center;
            font-size: 0.9em;
            color: #718096;
            margin-top: 20px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>New Ticket Created</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>A new maintenance ticket has been created and requires attention. Please find the details below:</p>

            <table class="details-table">
                <tr>
                    <th>Ticket ID:</th>
                    <td>#{{ $ticket->id }}</td>
                </tr>
                <tr>
                    <th>Title:</th>
                    <td>{{ $ticket->title }}</td>
                </tr>
                <tr>
                    <th>Machine:</th>
                    <td>{{ $ticket->machine->name }}</td>
                </tr>
                <tr>
                    <th>Priority:</th>
                    <td>
                        @if ($ticket->priority == 2)
                            <span class="priority-badge priority-2">Critical</span>
                        @elseif($ticket->priority == 1)
                            <span class="priority-badge priority-1">Warning</span>
                        @else
                            <span>Normal</span>
                        @endif
                    </td>
                </tr>
                <tr>
                    <th>Created By:</th>
                    <td>{{ $ticket->creator->name }}</td>
                </tr>
                @if ($ticket->description)
                    <tr>
                        <th>Description:</th>
                        <td>{{ $ticket->description }}</td>
                    </tr>
                @endif
            </table>

            <p style="margin-top: 25px;">Please review the ticket details and take the appropriate action.</p>

            <a href="{{ route('tickets.show', $ticket->id) }}" class="button" style="color: #ffffff;">View Ticket
                Details</a>
        </div>
        <div class="footer">
            @include('emails.partials.signature')
        </div>
    </div>
</body>

</html>
