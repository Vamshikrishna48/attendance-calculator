<?php
declare(strict_types=1);

require __DIR__ . '/api/db.php';

$pdo = db();
$rows = $pdo->query("SHOW INDEX FROM courses WHERE Key_name = 'uq_courses_name'")->fetchAll();

if (count($rows) === 0) {
    $pdo->exec('ALTER TABLE courses ADD UNIQUE KEY uq_courses_name (course_name)');
    echo "added\n";
} else {
    echo "exists\n";
}
