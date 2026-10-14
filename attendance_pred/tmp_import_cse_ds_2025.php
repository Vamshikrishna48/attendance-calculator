<?php
declare(strict_types=1);

require __DIR__ . '/api/db.php';

$pdo = db();
$pdo->beginTransaction();

try {
    $batchName = '2025-2029';
    $programName = 'CSE-DS';

    $semesterMap = [
        'Semester 1' => [
            ['Calculus', 4],
            ['Physics', 4],
            ['Basic Electrical and Electronics Engineering', 3],
            ['Computational Thinking for Problem Solving', 4],
            ['Engineering Graphics and Design', 2],
            ['Essential Electronics Practices', 1],
            ['Engineering Ethics', 1],
            ['Indian Knowledge System', 0],
            ['Constitution of India', 0],
        ],
        'Semester 2' => [
            ['Linear Algebra and Differential Equations', 4],
            ['Quantum Physics', 3],
            ['Elements of Biology', 3],
            ['Product Realization', 2],
            ['English Communication', 1],
            ['Transforming Ideas to Innovation', 1],
            ['Environmental Science', 0],
            ['Management Accounting for Engineers', 2],
            ['Object Oriented Programming', 2],
            ['Object Oriented Programming Lab', 1],
        ],
        'Semester 3' => [
            ['Technical Communication', 1],
            ['Probability and Statistics', 3],
            ['Programming with Python', 2],
            ['Data Structures and Algorithms', 3],
            ['Data Structures and Algorithms Lab', 1],
            ['Computer Networks', 4],
            ['Discrete Mathematics', 3],
            ['Digital Circuits and Computer Architecture', 4],
            ['Community Service', 0],
            ['Program Elective-I', 2],
        ],
        'Semester 4' => [
            ['Database Management Systems', 3],
            ['Database Management Systems Lab', 1],
            ['Design and Analysis of Algorithms', 4],
            ['Artificial Intelligence Algorithms', 4],
            ['Applied Machine Learning', 4],
            ['Interpersonal Skills', 1],
            ['Website Designing and Development', 3],
            ['Design Experience I', 1],
            ['Program Elective-II', 2],
        ],
        'Semester 5' => [
            ['Software Engineering', 4],
            ['Operating Systems', 4],
            ['Principles of Data, Signal, and Image Analysis', 3],
            ['Program Elective-III', 4],
            ['Open Elective-I', 3],
            ['Open Elective-II', 3],
            ['Design Experience II', 2],
            ['Career Guidance', 0],
        ],
        'Semester 6' => [
            ['Principles of Economics and Management', 3],
            ['Data Wrangling Fundamentals', 3],
            ['Data Visualization', 2],
            ['Program Elective-IV', 4],
            ['Program Elective-V', 4],
            ['Open Elective-III', 3],
            ['Open Elective-IV', 3],
            ['Design Experience III', 2],
        ],
        'Semester 7' => [
            ['Deep Learning: Fundamentals and Applications', 4],
            ['Big Data Analytics for Engineers', 3],
            ['Program Elective-VI', 4],
            ['Open Elective-V', 3],
            ['Capstone Project', 5],
        ],
        'Semester 8' => [
            ['Project', 10],
        ],
    ];

    $selectBatch = $pdo->prepare('SELECT batch_id FROM batches WHERE batch_name = :batchName LIMIT 1');
    $insertBatch = $pdo->prepare('INSERT INTO batches (batch_name) VALUES (:batchName)');
    $selectBatch->execute([':batchName' => $batchName]);
    if (!$selectBatch->fetch()) {
        $insertBatch->execute([':batchName' => $batchName]);
    }

    $selectProgram = $pdo->prepare(
        'SELECT program_id FROM programs WHERE program_name = :programName AND batch_name = :batchName LIMIT 1'
    );
    $insertProgram = $pdo->prepare(
        'INSERT INTO programs (program_name, batch_name) VALUES (:programName, :batchName)'
    );
    $selectProgram->execute([
        ':programName' => $programName,
        ':batchName' => $batchName,
    ]);
    $programRow = $selectProgram->fetch();
    $programId = $programRow ? (int) $programRow['program_id'] : 0;
    if ($programId <= 0) {
        $insertProgram->execute([
            ':programName' => $programName,
            ':batchName' => $batchName,
        ]);
        $programId = (int) $pdo->lastInsertId();
    }

    $selectSemester = $pdo->prepare('SELECT semester_id FROM semesters WHERE semester_name = :semesterName LIMIT 1');
    $insertSemester = $pdo->prepare('INSERT INTO semesters (semester_name) VALUES (:semesterName)');

    $selectCourse = $pdo->prepare('SELECT course_id FROM courses WHERE course_name = :courseName LIMIT 1');
    $insertCourse = $pdo->prepare(
        'INSERT INTO courses (course_name, credits, total_hours) VALUES (:courseName, :credits, :totalHours)'
    );
    $updateCourse = $pdo->prepare(
        'UPDATE courses SET credits = :credits WHERE course_id = :courseId AND (credits IS NULL OR credits <> :credits)'
    );

    $selectMapping = $pdo->prepare(
        'SELECT id FROM program_semester_courses WHERE program_id = :programId AND semester_id = :semesterId AND course_id = :courseId LIMIT 1'
    );
    $insertMapping = $pdo->prepare(
        'INSERT INTO program_semester_courses (program_id, semester_id, course_id) VALUES (:programId, :semesterId, :courseId)'
    );

    $createdCourses = 0;
    $createdMappings = 0;
    $createdSemesters = 0;

    foreach ($semesterMap as $semesterName => $subjects) {
        $selectSemester->execute([':semesterName' => $semesterName]);
        $semesterRow = $selectSemester->fetch();
        $semesterId = $semesterRow ? (int) $semesterRow['semester_id'] : 0;

        if ($semesterId <= 0) {
            $insertSemester->execute([':semesterName' => $semesterName]);
            $semesterId = (int) $pdo->lastInsertId();
            $createdSemesters++;
        }

        foreach ($subjects as [$courseName, $credits]) {
            $selectCourse->execute([':courseName' => $courseName]);
            $courseRow = $selectCourse->fetch();
            $courseId = $courseRow ? (int) $courseRow['course_id'] : 0;

            if ($courseId <= 0) {
                $insertCourse->execute([
                    ':courseName' => $courseName,
                    ':credits' => $credits,
                    ':totalHours' => 0,
                ]);
                $courseId = (int) $pdo->lastInsertId();
                $createdCourses++;
            } else {
                $updateCourse->execute([
                    ':credits' => $credits,
                    ':courseId' => $courseId,
                ]);
            }

            $selectMapping->execute([
                ':programId' => $programId,
                ':semesterId' => $semesterId,
                ':courseId' => $courseId,
            ]);

            if (!$selectMapping->fetch()) {
                $insertMapping->execute([
                    ':programId' => $programId,
                    ':semesterId' => $semesterId,
                    ':courseId' => $courseId,
                ]);
                $createdMappings++;
            }
        }
    }

    $verifyStmt = $pdo->prepare(
        'SELECT s.semester_name, COUNT(*) AS subject_count
         FROM program_semester_courses psc
         INNER JOIN semesters s ON s.semester_id = psc.semester_id
         WHERE psc.program_id = :programId
         GROUP BY s.semester_id, s.semester_name
         ORDER BY s.semester_id'
    );
    $verifyStmt->execute([':programId' => $programId]);

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'batch' => $batchName,
        'program' => $programName,
        'programId' => $programId,
        'createdSemesters' => $createdSemesters,
        'createdCourses' => $createdCourses,
        'createdMappings' => $createdMappings,
        'semesterCounts' => $verifyStmt->fetchAll(),
    ], JSON_PRETTY_PRINT), PHP_EOL;
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    fwrite(STDERR, $e->getMessage() . PHP_EOL);
    exit(1);
}
