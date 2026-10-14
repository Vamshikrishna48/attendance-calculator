<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_common.php';

requireMethod('GET');

$pdo = db();
ensureAdminSchema($pdo);
$admin = requireAdmin();

$batches = $pdo->query('SELECT batch_id, batch_name FROM batches ORDER BY batch_name')->fetchAll();
$programs = $pdo->query('SELECT program_id, program_name, batch_name FROM programs ORDER BY batch_name, program_name')->fetchAll();
$semesters = $pdo->query('SELECT semester_id, semester_name FROM semesters ORDER BY semester_id')->fetchAll();
$subjects = $pdo->query('SELECT course_id, course_name, credits, total_hours FROM courses ORDER BY course_name')->fetchAll();
$admins = [];
$studentProfiles = [];
$mappings = $pdo->query(
    'SELECT psc.id, b.batch_name, p.program_id, p.program_name, s.semester_id, s.semester_name,
            c.course_id, c.course_name, COALESCE(c.credits, 0) AS credits, COALESCE(c.total_hours, 0) AS total_hours
     FROM program_semester_courses psc
     INNER JOIN programs p ON p.program_id = psc.program_id
     INNER JOIN semesters s ON s.semester_id = psc.semester_id
     INNER JOIN courses c ON c.course_id = psc.course_id
     LEFT JOIN batches b ON b.batch_name = p.batch_name
     ORDER BY p.batch_name, p.program_name, s.semester_id, c.course_name'
)->fetchAll();

if (!empty($admin['isDefault'])) {
    $admins = $pdo->query(
        'SELECT admin_id, full_name, email, is_default_admin, created_at
         FROM admin_users
         WHERE is_active = 1
         ORDER BY is_default_admin DESC, full_name, email'
    )->fetchAll();

    $studentProfiles = $pdo->query(
        'SELECT u.user_id, u.full_name, u.email,
                sp.batch_name, sp.course_name, sp.semester_id,
                COUNT(ar.user_id) AS attendance_count
         FROM users u
         LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
         LEFT JOIN attendance_records ar ON ar.user_id = u.user_id
         GROUP BY u.user_id, u.full_name, u.email, sp.batch_name, sp.course_name, sp.semester_id
         ORDER BY u.full_name, u.email'
    )->fetchAll();
}

jsonResponse([
    'ok' => true,
    'admin' => $admin,
    'batches' => array_map(static function (array $row): array {
        return [
            'id' => (int) $row['batch_id'],
            'name' => (string) $row['batch_name'],
        ];
    }, $batches),
    'programs' => array_map(static function (array $row): array {
        return [
            'id' => (int) $row['program_id'],
            'name' => (string) $row['program_name'],
            'batch' => (string) $row['batch_name'],
        ];
    }, $programs),
    'semesters' => array_map(static function (array $row): array {
        return [
            'id' => (int) $row['semester_id'],
            'name' => (string) $row['semester_name'],
        ];
    }, $semesters),
    'subjects' => array_map(static function (array $row): array {
        return [
            'id' => (int) $row['course_id'],
            'name' => (string) $row['course_name'],
            'credits' => (int) ($row['credits'] ?? 0),
            'totalHours' => (int) ($row['total_hours'] ?? 0),
        ];
    }, $subjects),
    'mappings' => array_map(static function (array $row): array {
        return [
            'id' => (int) $row['id'],
            'batch' => (string) ($row['batch_name'] ?? ''),
            'programId' => (int) $row['program_id'],
            'programName' => (string) $row['program_name'],
            'semesterId' => (int) $row['semester_id'],
            'semesterName' => (string) $row['semester_name'],
            'subjectId' => (int) $row['course_id'],
            'subjectName' => (string) $row['course_name'],
            'credits' => (int) ($row['credits'] ?? 0),
            'totalHours' => (int) ($row['total_hours'] ?? 0),
        ];
    }, $mappings),
    'admins' => array_map(static function (array $row): array {
        return [
            'id' => (int) $row['admin_id'],
            'fullName' => (string) $row['full_name'],
            'email' => (string) $row['email'],
            'isDefault' => ((int) ($row['is_default_admin'] ?? 0)) === 1,
            'createdAt' => (string) ($row['created_at'] ?? ''),
        ];
    }, $admins),
    'studentProfiles' => array_map(static function (array $row): array {
        return [
            'id' => (int) $row['user_id'],
            'fullName' => (string) $row['full_name'],
            'email' => (string) $row['email'],
            'batch' => (string) ($row['batch_name'] ?? ''),
            'course' => (string) ($row['course_name'] ?? ''),
            'semester' => (int) ($row['semester_id'] ?? 0),
            'attendanceCount' => (int) ($row['attendance_count'] ?? 0),
        ];
    }, $studentProfiles),
]);
