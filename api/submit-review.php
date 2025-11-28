<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$reviewsFile = '../reviews.json';
$statsFile = '../stats.json';
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!$input || !isset($input['name']) || !isset($input['email']) || !isset($input['rating']) || !isset($input['review']) || !isset($input['deviceId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$name = trim($input['name']);
$email = trim($input['email']);
$rating = intval($input['rating']);
$reviewText = trim($input['review']);
$deviceId = $input['deviceId'];
$clientIP = $_SERVER['REMOTE_ADDR'];

// Validate data
if (empty($name) || strlen($name) < 2) {
    http_response_code(400);
    echo json_encode(['error' => 'Name must be at least 2 characters']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

if ($rating < 1 || $rating > 5) {
    http_response_code(400);
    echo json_encode(['error' => 'Rating must be between 1 and 5']);
    exit;
}

if (strlen($reviewText) < 10 || strlen($reviewText) > 500) {
    http_response_code(400);
    echo json_encode(['error' => 'Review must be between 10 and 500 characters']);
    exit;
}

// Load existing reviews
$data = ['reviews' => []];
if (file_exists($reviewsFile)) {
    $data = json_decode(file_get_contents($reviewsFile), true);
}

// Check for duplicate submission (same device or IP within 24 hours)
$hashedDeviceId = hash('sha256', $deviceId);
$hashedIP = hash('sha256', $clientIP);
$currentTime = time();

foreach ($data['reviews'] as $existingReview) {
    $reviewTime = strtotime($existingReview['timestamp']);
    $timeDiff = $currentTime - $reviewTime;
    
    if ($timeDiff < 86400) { // 24 hours
        if ($existingReview['deviceId'] === $hashedDeviceId || $existingReview['ip'] === $hashedIP) {
            http_response_code(429);
            echo json_encode(['error' => 'You have already submitted a review recently. Please try again later.']);
            exit;
        }
    }
}

// Create new review
$newReview = [
    'id' => uniqid('review_', true),
    'name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
    'email' => $email,
    'rating' => $rating,
    'review' => htmlspecialchars($reviewText, ENT_QUOTES, 'UTF-8'),
    'deviceId' => $hashedDeviceId,
    'ip' => $hashedIP,
    'timestamp' => date('c'),
    'approved' => true // Auto-approve (set to false for manual moderation)
];

// Add to reviews array
$data['reviews'][] = $newReview;

// Save reviews
if (!file_put_contents($reviewsFile, json_encode($data, JSON_PRETTY_PRINT))) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save review']);
    exit;
}

// Update stats (recalculate average rating and increment review count)
if (file_exists($statsFile)) {
    $stats = json_decode(file_get_contents($statsFile), true);
    
    // Calculate new average rating from all approved reviews
    $approvedReviews = array_filter($data['reviews'], function($r) {
        return $r['approved'] === true;
    });
    
    $totalRating = array_sum(array_column($approvedReviews, 'rating'));
    $reviewCount = count($approvedReviews);
    
    $stats['rating'] = $reviewCount > 0 ? round($totalRating / $reviewCount, 1) : 0;
    $stats['reviews'] = $reviewCount;
    $stats['lastUpdated'] = date('c');
    
    file_put_contents($statsFile, json_encode($stats, JSON_PRETTY_PRINT));
}

echo json_encode([
    'success' => true,
    'message' => 'Thank you for your review!',
    'review' => [
        'id' => $newReview['id'],
        'name' => $newReview['name'],
        'rating' => $newReview['rating'],
        'review' => $newReview['review'],
        'timestamp' => $newReview['timestamp']
    ]
]);
?>
