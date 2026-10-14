<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

session_start();
requireMethod('GET');

$userId = (int) ($_SESSION['user_id'] ?? 0);
if ($userId <= 0) {
    jsonResponse([
        'ok' => true,
        'loggedIn' => false,
    ]);
}

$pdo = db();

$userStmt = $pdo->prepare('SELECT user_id, full_name, email FROM users WHERE user_id = :userId');
$userStmt->execute([':userId' => $userId]);
$user = $userStmt->fetch();

if (!$user) {
    unset($_SESSION['user_id']);
    jsonResponse([
        'ok' => true,
        'loggedIn' => false,
    ]);
}

$profileStmt = $pdo->prepare('SELECT batch_name, course_name, semester_id FROM student_profiles WHERE user_id = :userId');
$profileStmt->execute([':userId' => $userId]);
$profile = $profileStmt->fetch() ?: [];

$savedRows = [];
if (!empty($profile['batch_name']) && !empty($profile['course_name']) && !empty($profile['semester_id'])) {
    $rowsStmt = $pdo->prepare(
        'SELECT attendance_payload
         FROM attendance_records
         WHERE user_id = :userId AND batch_name = :batchName AND course_name = :courseName AND semester_id = :semesterId
         LIMIT 1'
    );
    $rowsStmt->execute([
        ':userId' => $userId,
        ':batchName' => (string) $profile['batch_name'],
        ':courseName' => (string) $profile['course_name'],
        ':semesterId' => (int) $profile['semester_id'],
    ]);

    $savedRow = $rowsStmt->fetch();
    if ($savedRow && !empty($savedRow['attendance_payload'])) {
        $decoded = json_decode((string) $savedRow['attendance_payload'], true);
        if (is_array($decoded)) {
            $savedRows = array_map(static function (array $row): array {
                return [
                    'subjectId' => (string) ($row['subjectId'] ?? ''),
                    'subjectName' => (string) ($row['subjectName'] ?? ''),
                    'totalSemesterClasses' => (int) ($row['totalSemesterClasses'] ?? 0),
                    'attended' => (int) ($row['attended'] ?? 0),
                    'conducted' => (int) ($row['conducted'] ?? 0),
                ];
            }, $decoded);
        }
    }
}

jsonResponse([
    'ok' => true,
    'loggedIn' => true,
    'user' => [
        'id' => (int) $user['user_id'],
        'fullName' => (string) $user['full_name'],
        'email' => (string) $user['email'],
    ],
    'profile' => [
        'batch' => (string) ($profile['batch_name'] ?? ''),
        'course' => (string) ($profile['course_name'] ?? ''),
        'semester' => (int) ($profile['semester_id'] ?? 0),
    ],
    'savedRows' => $savedRows,
]);
