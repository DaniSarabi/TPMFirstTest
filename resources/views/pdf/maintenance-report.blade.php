<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Maintenance Report #{{ $report->id }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 11px; color: #333; }
        .header { width: 100%; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; overflow: auto; }
        .header .logo { width: 120px; float: left; }
        .header .report-title { text-align: right; }
        .header h1 { margin: 0; font-size: 22px; }
        .header p { margin: 5px 0; color: #555; }
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .details-table td { padding: 8px; border: 1px solid #ddd; vertical-align: top; }
        .details-table .label { font-weight: bold; background-color: #f9f9f9; width: 25%; }
        .section-header { background-color: #eee; padding: 10px; font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
        .task-item { border: 1px solid #ddd; margin-bottom: 10px; padding: 10px; page-break-inside: avoid; border-radius: 5px; }
        .task-label { font-weight: bold; font-size: 13px; }
        .task-description { font-size: 11px; color: #555; margin-top: 4px; }
        .task-result { margin-top: 8px; }
        .task-comment { font-style: italic; color: #555; margin-top: 5px; background-color: #f9f9f9; border-left: 3px solid #ccc; padding: 8px; }
        .photo-gallery { margin-top: 10px; }
        .photo-gallery img { max-width: 150px; max-height: 150px; border-radius: 4px; margin-right: 10px; border: 1px solid #ccc; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #777; }
        .icon { display: inline-block; width: 16px; height: 16px; vertical-align: middle; margin-right: 5px; }
        .result-text { font-size: 1.1em; font-weight: bold; }
    </style>
</head>
<body>
    @php
        // Crear un mapa de tareas para una búsqueda eficiente
        $tasksMap = $report->scheduledMaintenance->template->tasks->keyBy('label');
    @endphp

    <div class="header">
        <img src="{{ public_path('logo.png') }}" alt="Company Logo" class="logo">
        <div class="report-title">
            <h1>Maintenance Report</h1>
            <p>Report ID: #{{ $report->id }}</p>
        </div>
    </div>

    <div style="margin-top: 60px" class="section-header">Report Summary</div>
    <table class="details-table">
        <tr>
            <td class="label">Task Title:</td>
            <td colspan="3">{{ $report->scheduledMaintenance->title }}</td>
        </tr>
        <tr>
            <td class="label">Target:</td>
            <td>{{ $report->scheduledMaintenance->schedulable->name }}</td>
            <td class="label">Completed By:</td>
            <td>{{ $report->user->name }}</td>
        </tr>
        <tr>
            <td class="label">Scheduled Date:</td>
            <td>{{ $report->scheduledMaintenance->scheduled_date->format('M d, Y') }}</td>
            <td class="label">Completion Date:</td>
            <td>{{ $report->completed_at->format('M d, Y, h:i A') }}</td>
        </tr>
    </table>

    @if($report->notes)
        <div class="section-header">General Notes</div>
        <p>{{ $report->notes }}</p>
    @endif

    <div class="section-header">Checklist Results</div>
    @foreach($report->results as $result)
        @php
            $task = $tasksMap->get($result->task_label);
        @endphp
        <div class="task-item">
            <p style="color:#3B82F6" class="task-label">{{ $result->task_label }}</p>
            @if($task && $task->description)
                <p class="task-description">{{ $task->description }}</p>
            @endif
            <div class="task-result">
                <strong>Result:</strong>
                <span class="result-text">
                    @if(is_null($result->result))
                        <em>Optional field, not filled out.</em>
                    @elseif($task && $task->task_type === 'checkbox')
                        {{ $result->result ? 'Marked as completed' : 'Not completed' }}
                    @elseif($result->result === 'pass')
                        Pass the inspection
                    @elseif($result->result === 'fail')
                        Fail the inspection
                    @else
                        {{ $result->result }}
                    @endif
                </span>
            </div>
            @if($task && ($task->options['comment_required'] ?? false))
                <p class="task-comment">
                    <strong>Comment:</strong>
                    {{ $result->comment ?? 'Optional comment not provided.' }}
                </p>
            @endif
            @if($result->photos->isNotEmpty())
                <div class="photo-gallery">
                    <strong>Photos:</strong><br>
                    @foreach($result->photos as $photo)
                        <img src="{{ public_path(str_replace('/storage', 'storage', $photo->photo_url)) }}" alt="Maintenance Photo">
                    @endforeach
                </div>
            @endif
        </div>
    @endforeach

    <div class="footer">
        Generated on {{ now()->format('M d, Y') }} by the TPM Application
    </div>
</body>
</html>
