<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$reviewsFile = '../reviews.json';
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$perPage = 10;

if (!file_exists($reviewsFile)) {
    echo json_encode(['reviews' => [], 'total' => 0, 'page' => $page]);
    exit;
}

$data = json_decode(file_get_contents($reviewsFile), true);
$allReviews = $data['reviews'] ?? [];

// Filter approved reviews only
$approvedReviews = array_filter($allReviews, function($review) {
    return isset($review['approved']) && $review['approved'] === true;
});

// Sort by timestamp (newest first)
usort($approvedReviews, function($a, $b) {
    return strtotime($b['timestamp']) - strtotime($a['timestamp']);
});

// Remove sensitive data
$publicReviews = array_map(function($review) {
    return [
        'id' => $review['id'],
        'name' => $review['name'],
        'rating' => $review['rating'],
        'review' => $review['review'],
        'timestamp' => $review['timestamp']
    ];
}, $approvedReviews);

// Paginate
$total = count($publicReviews);
$offset = ($page - 1) * $perPage;
$paginatedReviews = array_slice($publicReviews, $offset, $perPage);

echo json_encode([
    'reviews' => $paginatedReviews,
    'total' => $total,
    'page' => $page,
    'perPage' => $perPage,
    'totalPages' => ceil($total / $perPage)
]);
?>
