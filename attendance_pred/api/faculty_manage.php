<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

session_start();

$facultyId = (int) ($_SESSION['faculty_id'] ?? 0);
if ($facultyId <= 0) {
    jsonError('Unauthorized. Faculty login required.', 401);
}

requireMethod('POST');
$payload = readJsonBody();
$action = strtolower(trim((string) ($payload['action'] ?? '')));

if ($action === '') {
    jsonError('Action is required.');
}

try {
    $pdo = db();

    // USER STORY 9: Update Total Classes Conducted
    if ($action === 'update_conducted_classes') {
        $updates = $payload['updates'] ?? [];
        if (!is_array($updates) || count($updates) === 0) {
            jsonError('No subject updates provided.');
        }

        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            'UPDATE courses
             SET conducted_hours = :conducted
             WHERE course_id = :courseId'
        );

        foreach ($updates as $u) {
            $courseId = (int) ($u['subjectId'] ?? 0);
            $conducted = (int) ($u['conducted'] ?? 0);

            // Acceptance criteria: Total classes must be greater than zero
            if ($conducted <= 0) {
                $pdo->rollBack();
                jsonError('Total classes conducted must be greater than zero (Subject ID: ' . $courseId . ').');
            }

            // Verify conducted does not exceed required semester classes (total_hours)
            $checkStmt = $pdo->prepare('SELECT course_name, COALESCE(total_hours, 0) AS total_hours FROM courses WHERE course_id = :courseId');
            $checkStmt->execute([':courseId' => $courseId]);
            $courseRow = $checkStmt->fetch();
            if ($courseRow) {
                $maxHours = (int) $courseRow['total_hours'];
                if ($maxHours > 0 && $conducted > $maxHours) {
                    $pdo->rollBack();
                    jsonError('Total classes conducted (' . $conducted . ') cannot exceed required semester classes (' . $maxHours . ') for ' . ($courseRow['course_name'] ?? ('Subject #' . $courseId)) . '.');
                }
            }

            $stmt->execute([
                ':conducted' => $conducted,
                ':courseId' => $courseId,
            ]);
        }

        $pdo->commit();
        jsonResponse([
            'ok' => true,
            'message' => 'Total classes conducted updated successfully.',
        ]);
    }

    // USER STORY 10: Manage Student Attendance
    if ($action === 'update_student_attendance') {
        $studentUserId = (int) ($payload['userId'] ?? 0);
        $rows = $payload['rows'] ?? [];

        if ($studentUserId <= 0) {
            jsonError('Student User ID is required.');
        }

        if (!is_array($rows) || count($rows) === 0) {
            jsonError('Attendance records are required.');
        }

        // Validate each attendance value: cannot exceed conducted classes and >= 0
        $totalAttended = 0;
        $totalConducted = 0;
        foreach ($rows as $r) {
            $subjectName = (string) ($r['subjectName'] ?? 'Subject');
            $attended = (int) ($r['attended'] ?? 0);
            $conducted = (int) ($r['conducted'] ?? 0);

            if ($attended < 0) {
                jsonError('Attended classes cannot be negative for ' . $subjectName . '.');
            }
            if ($attended > $conducted) {
                jsonError('Attended classes (' . $attended . ') cannot exceed total classes conducted (' . $conducted . ') for ' . $subjectName . '.');
            }
            $totalAttended += $attended;
            $totalConducted += $conducted;
        }

        $pdo->beginTransaction();

        $summary = implode(' | ', array_map(static function (array $r): string {
            return ($r['subjectName'] ?? 'Subject') . ': Attended ' . (int)$r['attended'] . ', Conducted ' . (int)$r['conducted'];
        }, $rows));

        $jsonPayload = json_encode(array_values($rows), JSON_UNESCAPED_UNICODE);

        $stmt = $pdo->prepare(
            'UPDATE attendance_records
             SET attendance_payload = :payload,
                 total_attended = :attended,
                 total_conducted = :conducted,
                 subject_attendance_summary = :summary,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = :userId'
        );
        $stmt->execute([
            ':payload' => $jsonPayload,
            ':attended' => $totalAttended,
            ':conducted' => $totalConducted,
            ':summary' => $summary,
            ':userId' => $studentUserId,
        ]);

        $pdo->commit();
        jsonResponse([
            'ok' => true,
            'message' => 'Student attendance records updated successfully.',
            'totalAttended' => $totalAttended,
            'totalConducted' => $totalConducted,
        ]);
    }

    jsonError('Unsupported action.');
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonError('Error managing faculty updates: ' . $e->getMessage(), 500);
}
