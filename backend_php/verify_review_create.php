<?php
/**
 * Runtime verification: reviews/create.php status normalization fix.
 * Tests:
 *  1. DB has a row with status='completed' (English from admin dashboard).
 *  2. Normalized comparison accepts it.
 *  3. Normalized comparison still rejects non-completed statuses.
 *  4. Duplicate-review guard is separate from the completion guard.
 */
require_once __DIR__ . '/config/db.php';

echo "=== VERIFICATION: reviews/create.php status fix ===\n\n";

// ── 1. Find real completed requests ─────────────────────────────────────────
$stmt = $conn->query(
    "SELECT id, student_id, service_title, status
     FROM service_requests
     WHERE status IN ('completed', 'مكتمل')
     ORDER BY id DESC
     LIMIT 5"
);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($rows)) {
    echo "⚠  No completed service requests found in DB.\n";
    echo "   Tip: mark one as completed from the admin dashboard, then re-run.\n\n";
} else {
    echo "── Completed service_requests found in DB ──\n";
    foreach ($rows as $r) {
        echo "  id={$r['id']}  student_id={$r['student_id']}  status=[{$r['status']}]  service=[{$r['service_title']}]\n";
    }
    echo "\n";
}

// ── 2. Simulate the normalization logic for each found row ───────────────────
echo "── Normalization simulation ──\n";
$testStatuses = ['completed', 'مكتمل', 'Completed', 'COMPLETED', 'under_review', 'pending_cash', 'in_progress', ''];
foreach ($testStatuses as $raw) {
    $normalized = mb_strtolower(trim((string)$raw), 'UTF-8');
    $isCompleted = in_array($normalized, ['completed', 'مكتمل'], true);
    $verdict = $isCompleted ? '✅ ACCEPT' : '❌ REJECT';
    echo "  raw=[{$raw}]  normalized=[{$normalized}]  → {$verdict}\n";
}
echo "\n";

// ── 3. Check for existing reviews on first found completed request ───────────
if (!empty($rows)) {
    $req = $rows[0];
    $reqId = (int)$req['id'];
    $studentId = (int)$req['student_id'];

    $dup = $conn->prepare(
        "SELECT id FROM service_reviews WHERE student_id = ? AND service_request_id = ?"
    );
    $dup->execute([$studentId, $reqId]);
    $existing = $dup->fetch(PDO::FETCH_ASSOC);

    echo "── Duplicate guard for request id={$reqId}, student_id={$studentId} ──\n";
    if ($existing) {
        echo "  Existing review found: review_id={$existing['id']}\n";
        echo "  Submission would return 409 (already reviewed).\n";
    } else {
        echo "  No existing review found → submission would proceed to INSERT.\n";
    }
    echo "\n";
}

// ── 4. Full file syntax re-confirmation ─────────────────────────────────────
echo "── PHP syntax check: reviews/create.php ──\n";
$lint = shell_exec('php -l ' . escapeshellarg(__DIR__ . '/api/reviews/create.php') . ' 2>&1');
echo "  " . trim($lint) . "\n\n";

echo "=== DONE ===\n";
