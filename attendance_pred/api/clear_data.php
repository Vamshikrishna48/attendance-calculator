<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

session_start();
requireMethod('POST');

$userId = (int) ($_SESSION['user_id'] ?? 0);
if ($userId <= 0) {
    jsonError('Please login first.', 401);
}

$pdo = db();
$pdo->beginTransaction();

try {
    $deleteAttendanceStmt = $pdo->prepare(
        'DELETE FROM attendance_records WHERE user_id = :userId'
    );
    $deleteAttendanceStmt->execute([
        ':userId' => $userId,
    ]);

    $deleteProfileStmt = $pdo->prepare(
        'DELETE FROM student_profiles WHERE user_id = :userId'
    );
    $deleteProfileStmt->execute([
        ':userId' => $userId,
    ]);

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonError('Unable to clear saved data: ' . $e->getMessage(), 500);
}

jsonResponse([
    'ok' => true,
    'message' => 'Saved data cleared successfully.',
]);
