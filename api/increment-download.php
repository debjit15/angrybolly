<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$statsFile = '../stats.json';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Rate limiting check (simple file-based)
$rateLimitFile = '../.rate_limit_downloads.json';
$clientIP = $_SERVER['REMOTE_ADDR'];
$currentTime = time();

// Load rate limit data
$rateLimitData = [];
if (file_exists($rateLimitFile)) {
    $rateLimitData = json_decode(file_get_contents($rateLimitFile), true) ?: [];
}

// Clean old entries (older than 1 hour)
$rateLimitData = array_filter($rateLimitData, function($timestamp) use ($currentTime) {
    return ($currentTime - $timestamp) < 3600;
});

// Check if IP has downloaded recently (within 5 minutes)
if (isset($rateLimitData[$clientIP]) && ($currentTime - $rateLimitData[$clientIP]) < 300) {
    echo json_encode(['success' => true, 'message' => 'Download already counted']);
    exit;
}

// Update rate limit
$rateLimitData[$clientIP] = $currentTime;
file_put_contents($rateLimitFile, json_encode($rateLimitData));

// Read current stats
if (!file_exists($statsFile)) {
    http_response_code(404);
    echo json_encode(['error' => 'Stats file not found']);
    exit;
}

$stats = json_decode(file_get_contents($statsFile), true);

// Increment downloads
$stats['downloads'] = intval($stats['downloads']) + 1;
$stats['lastUpdated'] = date('c');

// Save updated stats
if (file_put_contents($statsFile, json_encode($stats, JSON_PRETTY_PRINT))) {
    echo json_encode([
        'success' => true,
        'stats' => $stats
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update stats']);
}
?>
