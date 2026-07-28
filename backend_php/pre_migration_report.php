<?php
require_once __DIR__ . '/config/db.php';

// Fetch all distinct apartment locations
$apts = $conn->query("SELECT id, title, location FROM apartments")->fetchAll(PDO::FETCH_ASSOC);

// Fetch all districts
$districts = $conn->query("SELECT id, name FROM districts")->fetchAll(PDO::FETCH_ASSOC);

$report = [
    'districts' => $districts,
    'distinct_locations' => [],
    'exact_matches' => [],
    'normalized_matches' => [],
    'unmatched' => []
];

// Get distinct locations
$locations = [];
foreach ($apts as $apt) {
    if (!in_array($apt['location'], $locations)) {
        $locations[] = $apt['location'];
    }
}
$report['distinct_locations'] = $locations;

// Normalization function (strip non-arabic/english alphanumerics, make lowercase)
function normalizeString($str) {
    $str = mb_strtolower(trim($str), 'UTF-8');
    // Remove anything that is not letter/number (including Arabic letters)
    $str = preg_replace('/[^\p{L}\p{N}]+/u', '', $str);
    return $str;
}

$districtNorms = [];
foreach ($districts as $d) {
    $districtNorms[$d['id']] = normalizeString($d['name']);
}

foreach ($apts as $apt) {
    $loc = trim($apt['location']);
    $locNorm = normalizeString($loc);
    
    $matched = false;
    // 1. Exact Match
    foreach ($districts as $d) {
        if ($d['name'] === $loc) {
            $report['exact_matches'][] = ['apt_id' => $apt['id'], 'apt_title' => $apt['title'], 'location' => $loc, 'district_id' => $d['id'], 'district_name' => $d['name']];
            $matched = true;
            break;
        }
    }
    
    if ($matched) continue;

    // 2. Normalized Match
    foreach ($districts as $d) {
        $dNorm = $districtNorms[$d['id']];
        // If the location contains the district name or vice versa after normalization
        if (strpos($locNorm, $dNorm) !== false || strpos($dNorm, $locNorm) !== false) {
            $report['normalized_matches'][] = ['apt_id' => $apt['id'], 'apt_title' => $apt['title'], 'location' => $loc, 'district_id' => $d['id'], 'district_name' => $d['name'], 'reason' => "norm_contains"];
            $matched = true;
            break;
        }
    }

    if ($matched) continue;

    // 3. Unmatched
    $report['unmatched'][] = ['apt_id' => $apt['id'], 'apt_title' => $apt['title'], 'location' => $loc];
}

echo json_encode($report, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
