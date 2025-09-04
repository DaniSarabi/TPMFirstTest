<!DOCTYPE html>
<html>

<head>
    <title>Part Request for Ticket #{{ $ticket->id }}</title>
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
            background-color: #3a6edf;
            color: #ffffff;
            padding: 15px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }

        .content {
            padding: 20px 0;
        }

        .footer {
            font-size: 0.9em;
            color: #777;
            margin-top: 20px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }

        .ticket-details {
            background-color: #f9f9f9;
            border: 1px solid #eee;
            padding: 15px;
            margin-top: 20px;
        }
        .ticket-details h3 {
            margin-top: 0;
            color: #3a6edf;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h2>New Part Request</h2>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>A new part request has been submitted by <strong>{{ $requester->name }}</strong> for a maintenance
                ticket.</p>

            <div class="ticket-details">
                <h3>Request Details:</h3>
                {!! $bodyContent !!}
            </div>

            <p><strong>Ticket Information:</strong></p>
            <ul>
                <li><strong>Ticket ID:</strong> #{{ $ticket->id }}</li>
                <li><strong>Ticket Title:</strong> {{ $ticket->title }}</li>
                <li><strong>Machine:</strong> {{ $ticket->machine->name }}</li>
            </ul>

            <p>If you have any questions, please reply to this email to contact {{ $requester->name }} directly at
                {{ $requester->email }}.</p>
        </div>
        <div class="footer">
            {{-- Aquí es donde incluiremos nuestra nueva firma --}}
            @include('emails.partials.signature')
        </div>
    </div>
</body>

</html>
