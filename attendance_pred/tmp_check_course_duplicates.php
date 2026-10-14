<?php
declare(strict_types=1);

require __DIR__ . '/api/db.php';

$pdo = db();

$sql = 'SELECT course_name,
               COUNT(*) AS duplicate_count,
               GROUP_CONCAT(course_id ORDER BY course_id) AS course_ids,
               GROUP_CONCAT(COALESCE(credits, 0) ORDER BY course_id) AS credits_list,
               GROUP_CONCAT(COALESCE(total_hours, 0) ORDER BY course_id) AS hours_list
        FROM courses
        GROUP BY course_name
        HAVING COUNT(*) > 1
        ORDER BY course_name';

echo json_encode($pdo->query($sql)->fetchAll(), JSON_PRETTY_PRINT), PHP_EOL;
