<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

session_start();
requireMethod('POST');

$payload = readJsonBody();

$course = trim((string) ($payload['course'] ?? ''));
$batch = trim((string) ($payload['batch'] ?? ''));
$semesterId = (int) ($payload['semester'] ?? 0);
$rows = $payload['rows'] ?? [];

if ($batch === '' || $course === '' || $semesterId <= 0) {
    jsonError('Batch, course and semester are required.');
}

if (!is_array($rows) || count($rows) === 0) {
    jsonError('Attendance rows are required.');
}

$analyzed = analyzeRows($rows);
$overall = buildOverall($analyzed);
$totalAttended = (int) ($overall['attended'] ?? 0);
$totalConducted = (int) ($overall['conducted'] ?? 0);
$subjectAttendanceSummary = implode(' | ', array_map(
    static function (array $row): string {
        $subjectName = trim((string) ($row['subjectName'] ?? 'Subject'));
        $attended = (int) ($row['attended'] ?? 0);
        $conducted = (int) ($row['conducted'] ?? 0);

        return $subjectName . ': Attended ' . $attended . ', Conducted ' . $conducted;
    },
    $rows
));

$userId = (int) ($_SESSION['user_id'] ?? 0);
if ($userId > 0) {
    $pdo = db();
    $pdo->beginTransaction();

    try {
        $profileStmt = $pdo->prepare(
            'INSERT INTO student_profiles (user_id, batch_name, course_name, semester_id)
             VALUES (:userId, :batchName, :courseName, :semesterId)
             ON DUPLICATE KEY UPDATE
               batch_name = VALUES(batch_name),
               course_name = VALUES(course_name),
               semester_id = VALUES(semester_id),
               updated_at = CURRENT_TIMESTAMP'
        );
        $profileStmt->execute([
            ':userId' => $userId,
            ':batchName' => $batch,
            ':courseName' => $course,
            ':semesterId' => $semesterId,
        ]);

        $attendanceJson = json_encode(array_values($rows), JSON_UNESCAPED_UNICODE);
        if ($attendanceJson === false) {
            throw new RuntimeException('Unable to encode attendance data.');
        }

        $saveAttendanceStmt = $pdo->prepare(
            'INSERT INTO attendance_records
             (user_id, batch_name, course_name, semester_id, attendance_payload, total_attended, total_conducted, subject_attendance_summary)
             VALUES
             (:userId, :batchName, :courseName, :semesterId, :attendancePayload, :totalAttended, :totalConducted, :subjectAttendanceSummary)
             ON DUPLICATE KEY UPDATE
               attendance_payload = VALUES(attendance_payload),
               total_attended = VALUES(total_attended),
               total_conducted = VALUES(total_conducted),
               subject_attendance_summary = VALUES(subject_attendance_summary),
               updated_at = CURRENT_TIMESTAMP'
        );
        $saveAttendanceStmt->execute([
            ':userId' => $userId,
            ':batchName' => $batch,
            ':courseName' => $course,
            ':semesterId' => $semesterId,
            ':attendancePayload' => $attendanceJson,
            ':totalAttended' => $totalAttended,
            ':totalConducted' => $totalConducted,
            ':subjectAttendanceSummary' => $subjectAttendanceSummary,
        ]);

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonError('Attendance analyzed but could not be saved: ' . $e->getMessage(), 500);
    }
}

jsonResponse([
    'ok' => true,
    'minPercent' => MIN_PERCENT,
    'results' => $analyzed,
    'overall' => $overall,
]);
