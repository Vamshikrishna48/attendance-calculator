<?php
declare(strict_types=1);

require __DIR__ . '/api/db.php';

$pdo = db();
$pdo->beginTransaction();

try {
    $batchName = '2024-2028';
    $programName = 'CSE';

    $semesterMap = [
        'Semester 1' => [
            ['Calculus', 4],
            ['Physics', 4],
            ['Elements of Biology', 3],
            ['Programming for Problem Solving', 4],
            ['Engineering Graphics and Design', 3],
            ['Professional Ethics', 1],
            ['Constitution of India', 0],
            ['Critical Thinking', 0],
        ],
        'Semester 2' => [
            ['Linear Algebra and Differential Equations', 4],
            ['Quantum and Statistical Physics', 3],
            ['English Communication', 1],
            ['Basic Electrical and Electronics Engineering', 3],
            ['Data Structures and Algorithms', 4],
            ['Environmental Science', 2],
            ['Digital Manufacturing Laboratory', 1],
            ['Electrical and Electronics Workshop', 1],
            ['Design Thinking', 0],
        ],
        'Semester 3' => [
            ['Probability and Statistics', 3],
            ['Discrete Mathematics', 3],
            ['Technical Communication', 1],
            ['Management Accounting for Engineers', 2],
            ['Digital Logic Design', 3],
            ['Database Management Systems', 3],
            ['Computer Networks', 3],
            ['Data Extraction and Processing', 2],
            ['Python Programming', 1],
            ['Community Service', 0],
        ],
        'Semester 4' => [
            ['Complex Variables and Transforms', 4],
            ['Computer Organization and Architecture', 3],
            ['Design and Analysis of Algorithms', 3],
            ['Principles of Economics and Management', 3],
            ['Microprocessor and Microcontroller', 4],
            ['Theoretical Computer Science', 3],
            ['Web Programming', 3],
        ],
        'Semester 5' => [
            ['Software Engineering', 3],
            ['Artificial Intelligence', 3],
            ['Image and Video Processing', 4],
            ['Operating Systems', 3],
            ['Department Elective I', 3],
            ['Open Elective I', 3],
            ['Open Elective II', 3],
        ],
        'Semester 6' => [
            ['Cyber Security', 3],
            ['Embedded Systems', 3],
            ['Machine Learning', 3],
            ['Department Elective II', 3],
            ['Department Elective III', 3],
            ['Open Elective III', 3],
            ['Open Elective IV', 3],
            ['Interpersonal Skills', 1],
        ],
        'Semester 7' => [
            ['Cloud Computing', 3],
            ['Department Elective IV', 3],
            ['Department Elective V', 3],
            ['Department Elective VI', 3],
            ['Open Elective V', 3],
            ['Capstone Project', 4],
            ['Technical Internship', 0],
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
