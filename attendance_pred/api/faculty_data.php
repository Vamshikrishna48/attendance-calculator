<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

session_start();

$facultyId = (int) ($_SESSION['faculty_id'] ?? 0);
if ($facultyId <= 0) {
    jsonError('Unauthorized. Faculty login required.', 401);
}

requireMethod('GET');
$action = strtolower(trim((string) ($_GET['action'] ?? 'options')));

try {
    $pdo = db();

    // Option catalog for Faculty US 9: batches, courses, semesters
    if ($action === 'options') {
        $batches = $pdo->query('SELECT batch_id, batch_name FROM batches ORDER BY batch_name')->fetchAll();
        $programs = $pdo->query('SELECT program_id, program_name, batch_name FROM programs ORDER BY batch_name, program_name')->fetchAll();
        $semesters = $pdo->query('SELECT semester_id, semester_name FROM semesters ORDER BY semester_id')->fetchAll();

        jsonResponse([
            'ok' => true,
            'batches' => array_map(static fn($r) => ['value' => (string)$r['batch_name'], 'label' => (string)$r['batch_name']], $batches),
            'courses' => array_map(static fn($r) => ['value' => (string)$r['program_name'], 'label' => formatProgramLabel((string)$r['program_name']), 'batch' => (string)$r['batch_name']], $programs),
            'semesters' => array_map(static fn($r) => ['id' => (int)$r['semester_id'], 'name' => (string)$r['semester_name']], $semesters),
        ]);
    }

    // US 9: Get subjects with conducted_hours
    if ($action === 'subjects') {
        $batch = trim((string)($_GET['batch'] ?? ''));
        $course = trim((string)($_GET['course'] ?? ''));
        $semesterId = (int)($_GET['semester'] ?? 0);

        if ($batch === '' || $course === '' || $semesterId <= 0) {
            jsonError('Batch, course and semester are required.');
        }

        $programName = mapCourseToProgramName($course);

        $sql = 'SELECT c.course_id AS id, c.course_name AS name,
                       COALESCE(c.total_hours, 0) AS totalSemesterClasses,
                       COALESCE(c.conducted_hours, 0) AS conductedClasses
                FROM program_semester_courses psc
                INNER JOIN programs p ON p.program_id = psc.program_id
                INNER JOIN semesters s ON s.semester_id = psc.semester_id
                INNER JOIN courses c ON c.course_id = psc.course_id
                WHERE p.program_name = :programName
                  AND p.batch_name = :batchName
                  AND s.semester_id = :semesterId
                ORDER BY c.course_name';

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':programName' => $programName,
            ':batchName' => $batch,
            ':semesterId' => $semesterId,
        ]);

        $subjects = array_map(static function (array $row): array {
            $totalSem = (int) $row['totalSemesterClasses'];
            $cond = (int) $row['conductedClasses'];
            if ($totalSem > 0 && $cond > $totalSem) {
                $cond = $totalSem;
            }
            return [
                'id' => (string) $row['id'],
                'name' => (string) $row['name'],
                'totalSemesterClasses' => $totalSem,
                'conductedClasses' => $cond,
            ];
        }, $stmt->fetchAll());

        jsonResponse(['ok' => true, 'subjects' => $subjects]);
    }

    // US 10: Search students by Name or Student ID (ID / Email)
    if ($action === 'search_students') {
        $query = trim((string)($_GET['q'] ?? ''));

        $sql = 'SELECT u.user_id, u.full_name, u.email,
                       sp.batch_name, sp.course_name, sp.semester_id,
                       ar.attendance_payload, ar.total_attended, ar.total_conducted
                FROM users u
                LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
                LEFT JOIN attendance_records ar ON ar.user_id = u.user_id
                WHERE (:q = "" OR u.full_name LIKE :qlike OR u.email LIKE :qlike OR CAST(u.user_id AS CHAR) = :q)
                ORDER BY u.full_name
                LIMIT 30';

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':q' => $query,
            ':qlike' => '%' . $query . '%',
        ]);

        $students = array_map(static function (array $row): array {
            $records = [];
            if (!empty($row['attendance_payload'])) {
                $decoded = json_decode((string)$row['attendance_payload'], true);
                if (is_array($decoded)) {
                    $records = $decoded;
                }
            }
            return [
                'userId' => (int) $row['user_id'],
                'fullName' => (string) $row['full_name'],
                'email' => (string) $row['email'],
                'batch' => (string) ($row['batch_name'] ?? ''),
                'course' => (string) ($row['course_name'] ?? ''),
                'semesterId' => (int) ($row['semester_id'] ?? 0),
                'totalAttended' => (int) ($row['total_attended'] ?? 0),
                'totalConducted' => (int) ($row['total_conducted'] ?? 0),
                'records' => $records,
            ];
        }, $stmt->fetchAll());

        jsonResponse(['ok' => true, 'students' => $students]);
    }

    jsonError('Unsupported action.');
} catch (Throwable $e) {
    jsonError('Faculty query error: ' . $e->getMessage(), 500);
}
