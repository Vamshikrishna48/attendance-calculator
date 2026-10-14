<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_common.php';

requireMethod('POST');

$pdo = db();
ensureAdminSchema($pdo);
$admin = requireAdmin();

$payload = readJsonBody();
$action = strtolower(trim((string) ($payload['action'] ?? '')));

if ($action === '') {
    jsonError('Admin action is required.');
}

try {
    if ($action === 'create_structure') {
        $batchName = trim((string) ($payload['batchName'] ?? ''));
        $programName = trim((string) ($payload['programName'] ?? ''));
        $semesterCount = (int) ($payload['semesterCount'] ?? 0);

        if ($batchName === '' || $programName === '') {
            jsonError('Batch and program name are required.');
        }

        if ($semesterCount <= 0 || $semesterCount > 12) {
            jsonError('Semester count must be between 1 and 12.');
        }

        $pdo->beginTransaction();

        $batchStmt = $pdo->prepare(
            'INSERT INTO batches (batch_name)
             VALUES (:batchName)
             ON DUPLICATE KEY UPDATE batch_name = VALUES(batch_name)'
        );
        $batchStmt->execute([':batchName' => $batchName]);

        $checkProgramStmt = $pdo->prepare(
            'SELECT program_id FROM programs WHERE program_name = :programName AND batch_name = :batchName LIMIT 1'
        );
        $checkProgramStmt->execute([
            ':programName' => $programName,
            ':batchName' => $batchName,
        ]);
        if ($checkProgramStmt->fetch()) {
            $pdo->rollBack();
            jsonError('This batch and program structure already exists.');
        }

        $programStmt = $pdo->prepare(
            'INSERT INTO programs (program_name, batch_name)
             VALUES (:programName, :batchName)'
        );
        $programStmt->execute([
            ':programName' => $programName,
            ':batchName' => $batchName,
        ]);

        $semesterCheckStmt = $pdo->prepare(
            'SELECT semester_id FROM semesters WHERE semester_name = :semesterName LIMIT 1'
        );
        $semesterInsertStmt = $pdo->prepare(
            'INSERT INTO semesters (semester_name) VALUES (:semesterName)'
        );

        for ($i = 1; $i <= $semesterCount; $i++) {
            $semesterName = 'Semester ' . $i;
            $semesterCheckStmt->execute([':semesterName' => $semesterName]);
            if (!$semesterCheckStmt->fetch()) {
                $semesterInsertStmt->execute([':semesterName' => $semesterName]);
            }
        }

        $pdo->commit();
        jsonResponse(['ok' => true, 'message' => 'New batch structure created successfully.']);
    }

    if ($action === 'add_batch') {
        $batchName = trim((string) ($payload['batchName'] ?? ''));
        if ($batchName === '') {
            jsonError('Batch name is required.');
        }

        $stmt = $pdo->prepare('INSERT INTO batches (batch_name) VALUES (:batchName)');
        $stmt->execute([':batchName' => $batchName]);
        jsonResponse(['ok' => true, 'message' => 'Batch added successfully.']);
    }

    if ($action === 'add_program') {
        $programName = trim((string) ($payload['programName'] ?? ''));
        $batchName = trim((string) ($payload['batchName'] ?? ''));

        if ($programName === '' || $batchName === '') {
            jsonError('Batch and program name are required.');
        }

        $pdo->beginTransaction();

        $batchStmt = $pdo->prepare(
            'INSERT INTO batches (batch_name)
             VALUES (:batchName)
             ON DUPLICATE KEY UPDATE batch_name = VALUES(batch_name)'
        );
        $batchStmt->execute([':batchName' => $batchName]);

        $checkStmt = $pdo->prepare(
            'SELECT program_id FROM programs WHERE program_name = :programName AND batch_name = :batchName LIMIT 1'
        );
        $checkStmt->execute([
            ':programName' => $programName,
            ':batchName' => $batchName,
        ]);
        if ($checkStmt->fetch()) {
            $pdo->rollBack();
            jsonError('This program already exists for the selected batch.');
        }

        $programStmt = $pdo->prepare(
            'INSERT INTO programs (program_name, batch_name)
             VALUES (:programName, :batchName)'
        );
        $programStmt->execute([
            ':programName' => $programName,
            ':batchName' => $batchName,
        ]);

        $pdo->commit();
        jsonResponse(['ok' => true, 'message' => 'Program added successfully.']);
    }

    if ($action === 'add_semester') {
        $semesterName = trim((string) ($payload['semesterName'] ?? ''));
        if ($semesterName === '') {
            jsonError('Semester name is required.');
        }

        $checkStmt = $pdo->prepare('SELECT semester_id FROM semesters WHERE semester_name = :semesterName LIMIT 1');
        $checkStmt->execute([':semesterName' => $semesterName]);
        if ($checkStmt->fetch()) {
            jsonError('This semester already exists.');
        }

        $stmt = $pdo->prepare('INSERT INTO semesters (semester_name) VALUES (:semesterName)');
        $stmt->execute([':semesterName' => $semesterName]);
        jsonResponse(['ok' => true, 'message' => 'Semester added successfully.']);
    }

    if ($action === 'add_semester_to_program') {
        $batchName = trim((string) ($payload['batchName'] ?? ''));
        $programId = (int) ($payload['programId'] ?? 0);
        $semesterName = trim((string) ($payload['semesterName'] ?? ''));

        if ($batchName === '' || $programId <= 0 || $semesterName === '') {
            jsonError('Batch, program and semester name are required.');
        }

        $programStmt = $pdo->prepare(
            'SELECT program_id FROM programs
             WHERE program_id = :programId AND batch_name = :batchName
             LIMIT 1'
        );
        $programStmt->execute([
            ':programId' => $programId,
            ':batchName' => $batchName,
        ]);
        if (!$programStmt->fetch()) {
            jsonError('Selected program does not belong to that batch.');
        }

        $semesterCheckStmt = $pdo->prepare(
            'SELECT semester_id FROM semesters WHERE semester_name = :semesterName LIMIT 1'
        );
        $semesterCheckStmt->execute([':semesterName' => $semesterName]);
        if ($semesterCheckStmt->fetch()) {
            jsonResponse([
                'ok' => true,
                'message' => 'Semester already exists. You can now attach subjects to this batch and course.'
            ]);
        }

        $semesterInsertStmt = $pdo->prepare(
            'INSERT INTO semesters (semester_name) VALUES (:semesterName)'
        );
        $semesterInsertStmt->execute([':semesterName' => $semesterName]);
        jsonResponse([
            'ok' => true,
            'message' => 'Semester created for use with the selected batch and course. Now attach subjects to it.'
        ]);
    }

    if ($action === 'add_subject') {
        $subjectName = trim((string) ($payload['subjectName'] ?? ''));
        $credits = n($payload['credits'] ?? 0);
        $totalHours = n($payload['totalHours'] ?? 0);

        if ($subjectName === '') {
            jsonError('Subject name is required.');
        }

        $checkStmt = $pdo->prepare('SELECT course_id FROM courses WHERE course_name = :subjectName LIMIT 1');
        $checkStmt->execute([':subjectName' => $subjectName]);
        if ($checkStmt->fetch()) {
            jsonError('This subject already exists.');
        }

        $stmt = $pdo->prepare(
            'INSERT INTO courses (course_name, credits, total_hours)
             VALUES (:subjectName, :credits, :totalHours)'
        );
        $stmt->execute([
            ':subjectName' => $subjectName,
            ':credits' => $credits,
            ':totalHours' => $totalHours,
        ]);
        jsonResponse(['ok' => true, 'message' => 'Subject added successfully.']);
    }

    if ($action === 'assign_subject') {
        $programId = (int) ($payload['programId'] ?? 0);
        $semesterId = (int) ($payload['semesterId'] ?? 0);
        $subjectIds = $payload['subjectIds'] ?? [];

        if (!is_array($subjectIds) && !empty($payload['subjectId'])) {
            $subjectIds = [(int) $payload['subjectId']];
        }

        $subjectIds = array_values(array_filter(array_map('intval', is_array($subjectIds) ? $subjectIds : [])));

        if ($programId <= 0 || $semesterId <= 0 || count($subjectIds) === 0) {
            jsonError('Program, semester and at least one subject are required.');
        }

        $pdo->beginTransaction();

        $checkStmt = $pdo->prepare(
            'SELECT id
             FROM program_semester_courses
             WHERE program_id = :programId AND semester_id = :semesterId AND course_id = :subjectId
             LIMIT 1'
        );
        $stmt = $pdo->prepare(
            'INSERT INTO program_semester_courses (program_id, semester_id, course_id)
             VALUES (:programId, :semesterId, :subjectId)'
        );

        $addedCount = 0;
        foreach ($subjectIds as $subjectId) {
            $checkStmt->execute([
                ':programId' => $programId,
                ':semesterId' => $semesterId,
                ':subjectId' => $subjectId,
            ]);

            if ($checkStmt->fetch()) {
                continue;
            }

            $stmt->execute([
                ':programId' => $programId,
                ':semesterId' => $semesterId,
                ':subjectId' => $subjectId,
            ]);
            $addedCount++;
        }

        $pdo->commit();

        if ($addedCount === 0) {
            jsonError('Selected subjects are already assigned to that program and semester.');
        }

        jsonResponse([
            'ok' => true,
            'message' => $addedCount . ' subject(s) mapped successfully.',
        ]);
    }

    if ($action === 'create_subject_and_assign') {
        $programId = (int) ($payload['programId'] ?? 0);
        $semesterId = (int) ($payload['semesterId'] ?? 0);
        $subjectName = trim((string) ($payload['subjectName'] ?? ''));
        $credits = n($payload['credits'] ?? 0);
        $totalHours = n($payload['totalHours'] ?? 0);

        if ($programId <= 0 || $semesterId <= 0 || $subjectName === '') {
            jsonError('Program, semester and subject name are required.');
        }

        $pdo->beginTransaction();

        $subjectCheckStmt = $pdo->prepare(
            'SELECT course_id FROM courses WHERE course_name = :subjectName LIMIT 1'
        );
        $subjectCheckStmt->execute([':subjectName' => $subjectName]);
        $subjectRow = $subjectCheckStmt->fetch();

        if ($subjectRow) {
            $subjectId = (int) $subjectRow['course_id'];
            $updateSubjectStmt = $pdo->prepare(
                'UPDATE courses
                 SET credits = :credits, total_hours = :totalHours
                 WHERE course_id = :subjectId'
            );
            $updateSubjectStmt->execute([
                ':credits' => $credits,
                ':totalHours' => $totalHours,
                ':subjectId' => $subjectId,
            ]);
        } else {
            $insertSubjectStmt = $pdo->prepare(
                'INSERT INTO courses (course_name, credits, total_hours)
                 VALUES (:subjectName, :credits, :totalHours)'
            );
            $insertSubjectStmt->execute([
                ':subjectName' => $subjectName,
                ':credits' => $credits,
                ':totalHours' => $totalHours,
            ]);
            $subjectId = (int) $pdo->lastInsertId();
        }

        $mappingCheckStmt = $pdo->prepare(
            'SELECT id FROM program_semester_courses
             WHERE program_id = :programId AND semester_id = :semesterId AND course_id = :subjectId
             LIMIT 1'
        );
        $mappingCheckStmt->execute([
            ':programId' => $programId,
            ':semesterId' => $semesterId,
            ':subjectId' => $subjectId,
        ]);

        if ($mappingCheckStmt->fetch()) {
            $pdo->rollBack();
            jsonError('This subject is already mapped to the selected program and semester.');
        }

        $mappingInsertStmt = $pdo->prepare(
            'INSERT INTO program_semester_courses (program_id, semester_id, course_id)
             VALUES (:programId, :semesterId, :subjectId)'
        );
        $mappingInsertStmt->execute([
            ':programId' => $programId,
            ':semesterId' => $semesterId,
            ':subjectId' => $subjectId,
        ]);

        $pdo->commit();
        jsonResponse(['ok' => true, 'message' => 'Subject created and assigned successfully.']);
    }

    if ($action === 'update_subject') {
        $subjectId = (int) ($payload['subjectId'] ?? 0);
        $subjectName = trim((string) ($payload['subjectName'] ?? ''));
        $credits = n($payload['credits'] ?? 0);
        $totalHours = n($payload['totalHours'] ?? 0);

        if ($subjectId <= 0 || $subjectName === '') {
            jsonError('Subject and updated name are required.');
        }

        $checkStmt = $pdo->prepare(
            'SELECT course_id FROM courses WHERE course_name = :subjectName AND course_id <> :subjectId LIMIT 1'
        );
        $checkStmt->execute([
            ':subjectName' => $subjectName,
            ':subjectId' => $subjectId,
        ]);
        if ($checkStmt->fetch()) {
            jsonError('Another subject already uses this name.');
        }

        $stmt = $pdo->prepare(
            'UPDATE courses
             SET course_name = :subjectName, credits = :credits, total_hours = :totalHours
             WHERE course_id = :subjectId'
        );
        $stmt->execute([
            ':subjectName' => $subjectName,
            ':credits' => $credits,
            ':totalHours' => $totalHours,
            ':subjectId' => $subjectId,
        ]);
        jsonResponse(['ok' => true, 'message' => 'Subject updated successfully.']);
    }

    if ($action === 'delete_subject') {
        $subjectId = (int) ($payload['subjectId'] ?? 0);

        if ($subjectId <= 0) {
            jsonError('Subject is required.');
        }

        $pdo->beginTransaction();

        $deleteMappingsStmt = $pdo->prepare(
            'DELETE FROM program_semester_courses WHERE course_id = :subjectId'
        );
        $deleteMappingsStmt->execute([':subjectId' => $subjectId]);

        $deleteSubjectStmt = $pdo->prepare(
            'DELETE FROM courses WHERE course_id = :subjectId'
        );
        $deleteSubjectStmt->execute([':subjectId' => $subjectId]);

        $pdo->commit();
        jsonResponse(['ok' => true, 'message' => 'Subject deleted successfully.']);
    }

    if ($action === 'remove_mapping') {
        $mappingIds = $payload['mappingIds'] ?? [];

        if (!is_array($mappingIds) && !empty($payload['mappingId'])) {
            $mappingIds = [(int) $payload['mappingId']];
        }

        $mappingIds = array_values(array_filter(array_map('intval', is_array($mappingIds) ? $mappingIds : [])));

        if (count($mappingIds) === 0) {
            jsonError('At least one mapping is required.');
        }

        $stmt = $pdo->prepare('DELETE FROM program_semester_courses WHERE id = :mappingId');
        $deletedCount = 0;
        foreach ($mappingIds as $mappingId) {
            $stmt->execute([':mappingId' => $mappingId]);
            $deletedCount += $stmt->rowCount();
        }

        jsonResponse([
            'ok' => true,
            'message' => $deletedCount . ' linked subject(s) removed from the selected structure.',
        ]);
    }

    if ($action === 'delete_program_semester') {
        $batchName = trim((string) ($payload['batchName'] ?? ''));
        $programId = (int) ($payload['programId'] ?? 0);
        $semesterId = (int) ($payload['semesterId'] ?? 0);

        if ($batchName === '' || $programId <= 0 || $semesterId <= 0) {
            jsonError('Batch, program and semester are required.');
        }

        $programCheckStmt = $pdo->prepare(
            'SELECT program_id FROM programs
             WHERE program_id = :programId AND batch_name = :batchName
             LIMIT 1'
        );
        $programCheckStmt->execute([
            ':programId' => $programId,
            ':batchName' => $batchName,
        ]);
        if (!$programCheckStmt->fetch()) {
            jsonError('Selected program does not belong to that batch.');
        }

        $stmt = $pdo->prepare(
            'DELETE FROM program_semester_courses
             WHERE program_id = :programId AND semester_id = :semesterId'
        );
        $stmt->execute([
            ':programId' => $programId,
            ':semesterId' => $semesterId,
        ]);
        jsonResponse(['ok' => true, 'message' => 'Semester removed from the selected batch and program.']);
    }

    if ($action === 'delete_program_from_batch') {
        $batchName = trim((string) ($payload['batchName'] ?? ''));
        $programId = (int) ($payload['programId'] ?? 0);

        if ($batchName === '' || $programId <= 0) {
            jsonError('Batch and program are required.');
        }

        $pdo->beginTransaction();

        $programStmt = $pdo->prepare(
            'SELECT program_id FROM programs
             WHERE program_id = :programId AND batch_name = :batchName
             LIMIT 1'
        );
        $programStmt->execute([
            ':programId' => $programId,
            ':batchName' => $batchName,
        ]);
        if (!$programStmt->fetch()) {
            $pdo->rollBack();
            jsonError('Selected program does not belong to that batch.');
        }

        $deleteMappingsStmt = $pdo->prepare(
            'DELETE FROM program_semester_courses WHERE program_id = :programId'
        );
        $deleteMappingsStmt->execute([':programId' => $programId]);

        $deleteProgramStmt = $pdo->prepare(
            'DELETE FROM programs WHERE program_id = :programId'
        );
        $deleteProgramStmt->execute([':programId' => $programId]);

        $pdo->commit();
        jsonResponse(['ok' => true, 'message' => 'Program removed from the selected batch.']);
    }

    if ($action === 'delete_batch') {
        $batchName = trim((string) ($payload['batchName'] ?? ''));

        if ($batchName === '') {
            jsonError('Batch is required.');
        }

        $pdo->beginTransaction();

        $programRowsStmt = $pdo->prepare(
            'SELECT program_id FROM programs WHERE batch_name = :batchName'
        );
        $programRowsStmt->execute([':batchName' => $batchName]);
        $programRows = $programRowsStmt->fetchAll();

        foreach ($programRows as $programRow) {
            $programId = (int) $programRow['program_id'];
            $deleteMappingsStmt = $pdo->prepare(
                'DELETE FROM program_semester_courses WHERE program_id = :programId'
            );
            $deleteMappingsStmt->execute([':programId' => $programId]);
        }

        $deleteProgramsStmt = $pdo->prepare(
            'DELETE FROM programs WHERE batch_name = :batchName'
        );
        $deleteProgramsStmt->execute([':batchName' => $batchName]);

        $deleteProfilesStmt = $pdo->prepare(
            'DELETE FROM student_profiles WHERE batch_name = :batchName'
        );
        $deleteProfilesStmt->execute([':batchName' => $batchName]);

        $deleteAttendanceStmt = $pdo->prepare(
            'DELETE FROM attendance_records WHERE batch_name = :batchName'
        );
        $deleteAttendanceStmt->execute([':batchName' => $batchName]);

        $deleteBatchStmt = $pdo->prepare(
            'DELETE FROM batches WHERE batch_name = :batchName'
        );
        $deleteBatchStmt->execute([':batchName' => $batchName]);

        $pdo->commit();
        jsonResponse(['ok' => true, 'message' => 'Batch deleted successfully.']);
    }

    if ($action === 'add_admin_user') {
        requireDefaultAdmin();

        $fullName = trim((string) ($payload['fullName'] ?? ''));
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $password = (string) ($payload['password'] ?? '');

        if ($fullName === '') {
            jsonError('Admin full name is required.');
        }

        if (!validEmail($email)) {
            jsonError('Please enter a valid admin email.');
        }

        if (strlen($password) < 8) {
            jsonError('Admin password must be at least 8 characters.');
        }

        $checkStmt = $pdo->prepare('SELECT admin_id FROM admin_users WHERE email = :email LIMIT 1');
        $checkStmt->execute([':email' => $email]);
        if ($checkStmt->fetch()) {
            jsonError('An admin with this email already exists.');
        }

        $stmt = $pdo->prepare(
            'INSERT INTO admin_users (full_name, email, password_hash)
             VALUES (:fullName, :email, :passwordHash)'
        );
        $stmt->execute([
            ':fullName' => $fullName,
            ':email' => $email,
            ':passwordHash' => password_hash($password, PASSWORD_DEFAULT),
        ]);
        jsonResponse(['ok' => true, 'message' => 'Admin user added successfully.']);
    }

    if ($action === 'remove_admin_user') {
        requireDefaultAdmin();

        $adminId = (int) ($payload['adminId'] ?? 0);
        if ($adminId <= 0) {
            jsonError('Admin user is required.');
        }

        if ($adminId === (int) $admin['id']) {
            jsonError('The default admin cannot remove their own account.');
        }

        $checkStmt = $pdo->prepare(
            'SELECT is_default_admin
             FROM admin_users
             WHERE admin_id = :adminId AND is_active = 1
             LIMIT 1'
        );
        $checkStmt->execute([':adminId' => $adminId]);
        $targetAdmin = $checkStmt->fetch();

        if (!$targetAdmin) {
            jsonError('Admin user not found.');
        }

        if (((int) ($targetAdmin['is_default_admin'] ?? 0)) === 1) {
            jsonError('The default admin cannot be removed.');
        }

        $stmt = $pdo->prepare(
            'UPDATE admin_users
             SET is_active = 0
             WHERE admin_id = :adminId AND is_default_admin = 0'
        );
        $stmt->execute([':adminId' => $adminId]);
        jsonResponse(['ok' => true, 'message' => 'Admin user removed successfully.']);
    }

    if ($action === 'remove_student_profile') {
        requireDefaultAdmin();

        $userId = (int) ($payload['userId'] ?? 0);
        if ($userId <= 0) {
            jsonError('Student profile is required.');
        }

        $pdo->beginTransaction();

        $deleteAttendanceStmt = $pdo->prepare(
            'DELETE FROM attendance_records WHERE user_id = :userId'
        );
        $deleteAttendanceStmt->execute([':userId' => $userId]);

        $deleteProfileStmt = $pdo->prepare(
            'DELETE FROM student_profiles WHERE user_id = :userId'
        );
        $deleteProfileStmt->execute([':userId' => $userId]);

        $pdo->commit();
        jsonResponse(['ok' => true, 'message' => 'Student profile and saved attendance removed successfully.']);
    }

    jsonError('Unsupported admin action.');
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if ((int) ($e->errorInfo[1] ?? 0) === 1062) {
        jsonError('This record already exists.');
    }

    jsonError('Database error: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonError('Unable to save admin changes: ' . $e->getMessage(), 500);
}
