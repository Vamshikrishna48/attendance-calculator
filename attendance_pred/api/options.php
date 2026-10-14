<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

requireMethod('GET');

try {
    $pdo = db();

    $batchRows = [];
    $batchTableStmt = $pdo->query("SHOW TABLES LIKE 'batches'");
    if ($batchTableStmt->fetch()) {
        $batchStmt = $pdo->query('SELECT batch_name FROM batches ORDER BY batch_name');
        $batchRows = $batchStmt->fetchAll();
    } else {
        $batchStmt = $pdo->query('SELECT DISTINCT batch_name FROM programs WHERE batch_name IS NOT NULL AND batch_name <> "" ORDER BY batch_name');
        $batchRows = $batchStmt->fetchAll();
    }

    $batches = array_map(static function (array $row): array {
        return [
            'label' => (string) ($row['batch_name'] ?? ''),
            'value' => (string) ($row['batch_name'] ?? ''),
        ];
    }, $batchRows);

    $programStmt = $pdo->query('SELECT program_name, batch_name FROM programs ORDER BY batch_name, program_id');
    $programRows = $programStmt->fetchAll();

    $courses = array_map(static function (array $row): array {
        $programName = trim((string) ($row['program_name'] ?? ''));
        $batchName = trim((string) ($row['batch_name'] ?? ''));

        return [
            'label' => formatProgramLabel($programName),
            'value' => $programName,
            'batch' => $batchName,
        ];
    }, $programRows);

    $semesterStmt = $pdo->query('SELECT semester_id, semester_name FROM semesters ORDER BY semester_id');
    $semesterRows = $semesterStmt->fetchAll();

    $semesters = array_map(static function (array $row): array {
        return [
            'id' => (int) ($row['semester_id'] ?? 0),
            'name' => (string) ($row['semester_name'] ?? ''),
        ];
    }, $semesterRows);

    if (count($semesters) === 0) {
        for ($i = 1; $i <= 8; $i++) {
            $semesters[] = ['id' => $i, 'name' => 'Semester ' . $i];
        }
    }

    jsonResponse([
        'ok' => true,
        'batches' => $batches,
        'courses' => $courses,
        'semesters' => $semesters,
    ]);
} catch (Throwable $e) {
    jsonError('Unable to load dropdown data: ' . $e->getMessage(), 500);
}
