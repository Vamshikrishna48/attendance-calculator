<?php
declare(strict_types=1);

const MIN_PERCENT = 80;

function jsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError(string $message, int $status = 400): void
{
    jsonResponse(['ok' => false, 'message' => $message], $status);
}

function requireMethod(string $method): void
{
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== strtoupper($method)) {
        jsonError('Invalid request method.', 405);
    }
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        jsonError('Invalid JSON body.', 422);
    }

    return $data;
}

function mapCourseToProgramName(string $course): string
{
    $map = [
        'BTech CSE' => 'CSE',
        'BTech CSE Data Science' => 'CSE-DS',
    ];

    return $map[$course] ?? $course;
}

function formatProgramLabel(string $programName): string
{
    $map = [
        'CSE' => 'BTech CSE',
        'CSE-DS' => 'BTech CSE Data Science',
    ];

    return $map[$programName] ?? $programName;
}

function n($value): int
{
    return is_numeric($value) ? (int) $value : 0;
}

function clampPercent(float $value): float
{
    return max(0.0, min(100.0, $value));
}

function statusFromPercent(float $percent, int $conducted = 1): array
{
    if ($conducted === 0) {
        return ['text' => 'Not Started', 'className' => 'safe'];
    }

    if ($percent >= MIN_PERCENT) {
        return ['text' => 'Safe', 'className' => 'safe'];
    }

    if ($percent >= 60) {
        return ['text' => 'Warning', 'className' => 'warning'];
    }

    return ['text' => 'Danger', 'className' => 'danger'];
}

function neededClasses(int $attended, int $conducted): int
{
    if ($conducted <= 0) {
        return 0;
    }

    if (($attended / $conducted) * 100 >= MIN_PERCENT) {
        return 0;
    }

    $needed = (int) ceil((MIN_PERCENT * $conducted - 100 * $attended) / (100 - MIN_PERCENT));
    return max(0, $needed);
}

function missableClasses(int $attended, int $conducted, int $totalSemesterClasses = 0): int
{
    if ($conducted <= 0) {
        return 0;
    }

    if (($attended / $conducted) * 100 < MIN_PERCENT) {
        return 0;
    }

    $rawMissable = (int) floor((100 * $attended - MIN_PERCENT * $conducted) / MIN_PERCENT);
    if ($rawMissable <= 0) {
        return 0;
    }

    if ($totalSemesterClasses > 0) {
        $remaining = max(0, $totalSemesterClasses - $conducted);
        return min($rawMissable, $remaining);
    }

    return $rawMissable;
}

function remainingSemesterClasses(int $conducted, int $totalSemesterClasses): int
{
    if ($totalSemesterClasses <= 0) {
        return 0;
    }

    return max(0, $totalSemesterClasses - $conducted);
}

function canReachTarget(int $attended, int $conducted, int $totalSemesterClasses): bool
{
    if ($conducted <= 0 || $totalSemesterClasses <= 0) {
        return true;
    }

    if (($attended / $conducted) * 100 >= MIN_PERCENT) {
        return true;
    }

    $remaining = remainingSemesterClasses($conducted, $totalSemesterClasses);
    if ($remaining <= 0) {
        return false;
    }

    $maxPossibleAttended = $attended + $remaining;
    $finalConducted = $conducted + $remaining;
    return (($maxPossibleAttended / $finalConducted) * 100) >= MIN_PERCENT;
}

function analyzeRows(array $rows): array
{
    $result = [];

    foreach ($rows as $row) {
        $attended = max(0, n($row['attended'] ?? 0));
        $conducted = max(0, n($row['conducted'] ?? 0));
        $safeAttended = min($attended, $conducted);
        $totalSemesterClasses = max($conducted, n($row['totalSemesterClasses'] ?? 0));

        $percent = $conducted > 0 ? clampPercent(($safeAttended / $conducted) * 100) : 100.0;
        $status = statusFromPercent($percent, $conducted);
        $remainingClasses = remainingSemesterClasses($conducted, $totalSemesterClasses);
        $targetReachable = $percent >= MIN_PERCENT ? true : canReachTarget($safeAttended, $conducted, $totalSemesterClasses);

        $result[] = [
            'subjectId' => (string) ($row['subjectId'] ?? ''),
            'subjectName' => (string) ($row['subjectName'] ?? 'Subject'),
            'totalSemesterClasses' => $totalSemesterClasses,
            'remainingSemesterClasses' => $remainingClasses,
            'attended' => $safeAttended,
            'conducted' => $conducted,
            'missed' => max(0, $conducted - $safeAttended),
            'percent' => round($percent, 2),
            'neededClasses' => $percent < MIN_PERCENT ? neededClasses($safeAttended, $conducted) : 0,
            'missableClasses' => $percent >= MIN_PERCENT ? missableClasses($safeAttended, $conducted, $totalSemesterClasses) : 0,
            'targetReachable' => $targetReachable,
            'status' => $status,
        ];
    }

    return $result;
}

function buildOverall(array $analyzedRows): array
{
    $attended = 0;
    $conducted = 0;
    $totalSemesterClasses = 0;

    foreach ($analyzedRows as $row) {
        $attended += n($row['attended'] ?? 0);
        $conducted += n($row['conducted'] ?? 0);
        $totalSemesterClasses += n($row['totalSemesterClasses'] ?? 0);
    }

    $percent = $conducted > 0 ? clampPercent(($attended / $conducted) * 100) : 100.0;
    $remainingClasses = remainingSemesterClasses($conducted, $totalSemesterClasses);
    $targetReachable = $percent >= MIN_PERCENT ? true : canReachTarget($attended, $conducted, $totalSemesterClasses);

    return [
        'id' => 'overall',
        'subjectId' => 'overall',
        'subjectName' => 'Overall Attendance Report',
        'totalSemesterClasses' => $totalSemesterClasses,
        'remainingSemesterClasses' => $remainingClasses,
        'attended' => $attended,
        'conducted' => $conducted,
        'missed' => max(0, $conducted - $attended),
        'percent' => round($percent, 2),
        'neededClasses' => $percent < MIN_PERCENT ? neededClasses($attended, $conducted) : 0,
        'missableClasses' => $percent >= MIN_PERCENT ? missableClasses($attended, $conducted, $totalSemesterClasses) : 0,
        'targetReachable' => $targetReachable,
        'status' => statusFromPercent($percent, $conducted),
    ];
}
