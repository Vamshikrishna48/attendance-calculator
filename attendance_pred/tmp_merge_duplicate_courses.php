<?php
declare(strict_types=1);

require __DIR__ . '/api/db.php';

$pdo = db();
$pdo->beginTransaction();

try {
    $duplicates = $pdo->query(
        'SELECT course_name
         FROM courses
         GROUP BY course_name
         HAVING COUNT(*) > 1
         ORDER BY course_name'
    )->fetchAll();

    $selectRowsStmt = $pdo->prepare(
        'SELECT course_id, COALESCE(credits, 0) AS credits, COALESCE(total_hours, 0) AS total_hours
         FROM courses
         WHERE course_name = :courseName
         ORDER BY course_id'
    );
    $updateCanonicalStmt = $pdo->prepare(
        'UPDATE courses
         SET credits = :credits, total_hours = :totalHours
         WHERE course_id = :courseId'
    );
    $mappingRowsStmt = $pdo->prepare(
        'SELECT id, program_id, semester_id
         FROM program_semester_courses
         WHERE course_id = :courseId'
    );
    $mappingExistsStmt = $pdo->prepare(
        'SELECT id
         FROM program_semester_courses
         WHERE program_id = :programId AND semester_id = :semesterId AND course_id = :courseId
         LIMIT 1'
    );
    $updateMappingStmt = $pdo->prepare(
        'UPDATE program_semester_courses
         SET course_id = :targetCourseId
         WHERE id = :mappingId'
    );
    $deleteMappingStmt = $pdo->prepare(
        'DELETE FROM program_semester_courses WHERE id = :mappingId'
    );
    $deleteCourseStmt = $pdo->prepare(
        'DELETE FROM courses WHERE course_id = :courseId'
    );

    $mergedCourseNames = [];
    $deletedCourseIds = [];
    $deletedMappingIds = [];
    $updatedMappingIds = [];

    foreach ($duplicates as $duplicate) {
        $courseName = (string) $duplicate['course_name'];
        $selectRowsStmt->execute([':courseName' => $courseName]);
        $rows = $selectRowsStmt->fetchAll();

        if (count($rows) < 2) {
            continue;
        }

        $canonicalId = (int) $rows[0]['course_id'];
        $maxCredits = 0;
        $maxTotalHours = 0;

        foreach ($rows as $row) {
            $maxCredits = max($maxCredits, (int) $row['credits']);
            $maxTotalHours = max($maxTotalHours, (int) $row['total_hours']);
        }

        $updateCanonicalStmt->execute([
            ':credits' => $maxCredits,
            ':totalHours' => $maxTotalHours,
            ':courseId' => $canonicalId,
        ]);

        for ($i = 1; $i < count($rows); $i++) {
            $duplicateId = (int) $rows[$i]['course_id'];

            $mappingRowsStmt->execute([':courseId' => $duplicateId]);
            $mappingRows = $mappingRowsStmt->fetchAll();

            foreach ($mappingRows as $mappingRow) {
                $mappingId = (int) $mappingRow['id'];
                $programId = (int) $mappingRow['program_id'];
                $semesterId = (int) $mappingRow['semester_id'];

                $mappingExistsStmt->execute([
                    ':programId' => $programId,
                    ':semesterId' => $semesterId,
                    ':courseId' => $canonicalId,
                ]);
                $existingTarget = $mappingExistsStmt->fetch();

                if ($existingTarget) {
                    $deleteMappingStmt->execute([':mappingId' => $mappingId]);
                    $deletedMappingIds[] = $mappingId;
                } else {
                    $updateMappingStmt->execute([
                        ':targetCourseId' => $canonicalId,
                        ':mappingId' => $mappingId,
                    ]);
                    $updatedMappingIds[] = $mappingId;
                }
            }

            $deleteCourseStmt->execute([':courseId' => $duplicateId]);
            $deletedCourseIds[] = $duplicateId;
        }

        $mergedCourseNames[] = $courseName;
    }

    $indexRows = $pdo->query("SHOW INDEX FROM courses WHERE Key_name = 'uq_courses_name'")->fetchAll();
    if (count($indexRows) === 0) {
        $pdo->exec('ALTER TABLE courses ADD UNIQUE KEY uq_courses_name (course_name)');
    }

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'mergedCourseNames' => $mergedCourseNames,
        'deletedCourseIds' => $deletedCourseIds,
        'updatedMappingIds' => count($updatedMappingIds),
        'deletedMappingIds' => count($deletedMappingIds),
    ], JSON_PRETTY_PRINT), PHP_EOL;
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    fwrite(STDERR, $e->getMessage() . PHP_EOL);
    exit(1);
}
