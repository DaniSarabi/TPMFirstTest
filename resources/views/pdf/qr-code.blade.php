<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>QR Code for {{ $machine->name }}</title>
    <style>
        @page {
            margin: 0;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            text-align: center;
            margin: 0;
        }

        .container {
            border: 2px dashed #ccc;
            padding: 40px;
        }

        h1 {
            font-size: 24px;
            margin-bottom: 20px;
        }
    </style>
</head>

<body>

    <div class="container">
        <h1>{{ $machine->name }}</h1>
        {{-- This img tag points to our generateQrCode route --}}
        <img src="{{ route('machines.qr-code', $machine->id) }}" alt="QR Code for {{ $machine->name }}">
    </div>

</body>

</html>
