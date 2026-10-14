<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

requireMethod('GET');

$course = trim((string) ($_GET['course'] ?? ''));
$batch = trim((string) ($_GET['batch'] ?? ''));
$semesterId = (int) ($_GET['semester'] ?? 0);

if ($batch === '' || $course === '' || $semesterId <= 0) {
    jsonError('Batch, course and semester are required.');
}

$programName = mapCourseToProgramName($course);
if ($programName === '') {
    jsonError('Invalid course selected.');
}

try {
    $pdo = db();

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
        $totalSem = (int) ($row['totalSemesterClasses'] ?? 0);
        $cond = (int) ($row['conductedClasses'] ?? 0);
        if ($totalSem > 0 && $cond > $totalSem) {
            $cond = $totalSem;
        }
        return [
            'id' => (string) ($row['id'] ?? ''),
            'name' => (string) ($row['name'] ?? ''),
            'totalSemesterClasses' => $totalSem,
            'conductedClasses' => $cond,
        ];
    }, $stmt->fetchAll());

    jsonResponse([
        'ok' => true,
        'subjects' => $subjects,
    ]);
} catch (Throwable $e) {
    jsonError('Unable to load subjects: ' . $e->getMessage(), 500);
}
