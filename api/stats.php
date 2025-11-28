<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$statsFile = '../stats.json';

// Handle GET request - fetch stats
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($statsFile)) {
        $stats = file_get_contents($statsFile);
        echo $stats;
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Stats file not found']);
    }
    exit;
}

// Handle POST request - update stats (admin only, add authentication if needed)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input && isset($input['downloads']) && isset($input['rating']) && isset($input['reviews'])) {
        $stats = [
            'downloads' => intval($input['downloads']),
            'rating' => floatval($input['rating']),
            'reviews' => intval($input['reviews']),
            'lastUpdated' => date('c')
        ];
        
        if (file_put_contents($statsFile, json_encode($stats, JSON_PRETTY_PRINT))) {
            echo json_encode(['success' => true, 'stats' => $stats]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update stats']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
