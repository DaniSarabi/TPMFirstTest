<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forbidden</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
    <style>
        body {
            font-family: 'Instrument Sans', sans-serif;
        }
    </style>
</head>
<body class="bg-gray-100 dark:bg-gray-900">
    <div class="flex items-center justify-center min-h-screen">
        <div class="w-full max-w-md p-8 space-y-6 text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            
            <!-- You can place your company logo here -->
            <img src="{{ asset('images/logo.png') }}" alt="Company Logo" class="w-32 mx-auto mb-4">

            <h1 class="text-8xl font-extrabold text-primary">403</h1>
            <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Access Forbidden</h2>
            <p class="text-gray-600 dark:text-gray-400">
                Sorry, you do not have the necessary permissions to access this page. Please contact your system administrator if you believe this is an error.
            </p>
            <a href="{{ route('dashboard') }}" class="inline-block px-6 py-3 mt-4 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring">
                Go to Dashboard
            </a>
        </div>
    </div>
</body>
</html>
