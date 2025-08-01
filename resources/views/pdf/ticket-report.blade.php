<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Ticket Report #{{ $ticket->id }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 12px; color: #333; }
        .header { width: 100%; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .header .logo { width: 150px; float: left; }
        .header .report-title { text-align: right; }
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .details-table td { padding: 8px; border: 1px solid #ddd; vertical-align: middle; }
        .details-table .label { font-weight: bold; background-color: #f9f9f9; width: 25%; }
        .section-header { background-color: #eee; padding: 10px; font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
        .activity-log { width: 100%; border-collapse: collapse; }
        .activity-log th, .activity-log td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .activity-log th { background-color: #f2f2f2; }
        .status-badge { display: inline-block; padding: 3px 8px; border-radius: 9999px; color: white; font-weight: bold; font-size: 10px; }
        .description-box { background-color: #fffbe6; border: 1px solid #fde68a; padding: 15px; margin-top: 10px; border-radius: 5px; }
        .ticket-image {  max-width: 400px; max-height: 300px; margin-top: 10px; border-radius: 5px; border: 1px solid #ddd; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #777; }
    </style>
</head>
<body>

    <div class="header">
        {{-- You can place your company logo here --}}
        <img src="{{ public_path('logo.png') }}" alt="Company Logo" class="logo">
        <div class="report-title">
            <h1>Maintenance Ticket Report</h1>
            <p>Ticket ID: #{{ $ticket->id }}</p>
        </div>
    </div>

    <h2>Ticket Details</h2>
    <table class="details-table">
        <tr>
            <td class="label">Title:</td>
            <td colspan="3">{{ $ticket->title }}</td>
        </tr>
        <tr>
            <td class="label">Machine:</td>
            <td>{{ $ticket->machine->name }}</td>
            <td class="label">Current Status:</td>
            <td>
                <span class="status-badge" style="background-color: {{ $ticket->status->bg_color }}; color: {{ $ticket->status->text_color }};">
                    {{ $ticket->status->name }}
                </span>
            </td>
        </tr>
        <tr>
            <td class="label">Created By:</td>
            <td>{{ $ticket->creator->name }}</td>
            <td class="label">Priority:</td>
            <td>
                @php
                    $priorityText = 'Low';
                    $priorityBg = '#d1d5db'; // Gray
                    $priorityColor = '#1f2937';
                    if ($ticket->priority == 1) {
                        $priorityText = 'Medium';
                        $priorityBg = '#ffe600'; // Yellow
                        $priorityColor = '#4a4000';
                    } elseif ($ticket->priority == 2) {
                        $priorityText = 'High';
                        $priorityBg = '#fecaca'; // Red
                        $priorityColor = '#991b1b';
                    }
                @endphp
                <span class="status-badge" style="background-color: {{ $priorityBg }}; color: {{ $priorityColor }};">
                    {{ $priorityText }}
                </span>
            </td>
        </tr>
        <tr>
            <td class="label">Created At:</td>
            <td colspan="3">{{ $ticket->created_at->format('M d, Y, h:i A') }}</td>
        </tr>
    </table>

    <div class="section-header">Problem Description & Photo</div>
    <div class="description-box">
        <p>{{ $ticket->description ?? 'No description provided.' }}</p>
        @if($ticket->inspectionItem && $ticket->inspectionItem->image_url)
            @php
                $imagePath = public_path($ticket->inspectionItem->image_url);
            @endphp
            @if(file_exists($imagePath))
                <img src="{{ $imagePath }}" alt="Ticket Image" class="ticket-image">
            @endif
        @endif
    </div>

    <div class="section-header">Activity Log</div>
    <table class="activity-log">
        <thead>
            <tr>
                <th>Date</th>
                <th>User</th>
                <th>Action / Comment</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($ticket->updates->sortBy('created_at') as $update)
                <tr>
                    <td width="25%">{{ $update->created_at->format('M d, Y, h:i A') }}</td>
                    <td width="20%">{{ $update->user->name }}</td>
                    <td>
                        @if($update->new_status_id && !$update->old_status_id)
                            Ticket created and set to status: 
                            <span class="status-badge" style="background-color: {{ $update->newStatus->bg_color }}; color: {{ $update->newStatus->text_color }};">{{ $update->newStatus->name }}</span>
                        @elseif($update->new_status_id && $update->old_status_id)
                            Status changed from <strong>{{ $update->oldStatus->name }}</strong> to 
                            <span class="status-badge" style="background-color: {{ $update->newStatus->bg_color }}; color: {{ $update->newStatus->text_color }};">{{ $update->newStatus->name }}</span>
                        @endif
                        
                        @if($update->action_taken)
                            <p><strong>Action Taken:</strong> {{ $update->action_taken }}</p>
                        @endif

                        @if($update->parts_used)
                            <p><strong>Parts Used:</strong> {{ $update->parts_used }}</p>
                        @endif

                        @if($update->comment)
                            <p><strong>Comment:</strong> {{ $update->comment }}</p>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Generated on {{ now()->format('M d, Y') }}
    </div>

</body>
</html>
