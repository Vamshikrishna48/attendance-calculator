<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

session_start();

function ensureAdminSchema(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS batches (
            batch_id INT(11) NOT NULL AUTO_INCREMENT,
            batch_name VARCHAR(20) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (batch_id),
            UNIQUE KEY uq_batches_name (batch_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS admin_users (
            admin_id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
            full_name VARCHAR(120) NOT NULL,
            email VARCHAR(190) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            is_default_admin TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (admin_id),
            UNIQUE KEY uq_admin_users_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    ensureColumn($pdo, 'admin_users', 'is_default_admin', 'TINYINT(1) NOT NULL DEFAULT 0');
    ensureDefaultAdmin($pdo);

    syncBatchesTable($pdo);
}

function ensureColumn(PDO $pdo, string $tableName, string $columnName, string $definition): void
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS column_count
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :tableName
           AND COLUMN_NAME = :columnName'
    );
    $stmt->execute([
        ':tableName' => $tableName,
        ':columnName' => $columnName,
    ]);

    if ((int) ($stmt->fetch()['column_count'] ?? 0) === 0) {
        $pdo->exec('ALTER TABLE ' . $tableName . ' ADD COLUMN ' . $columnName . ' ' . $definition);
    }
}

function ensureDefaultAdmin(PDO $pdo): void
{
    $defaultCount = (int) $pdo->query(
        'SELECT COUNT(*) AS default_count
         FROM admin_users
         WHERE is_default_admin = 1 AND is_active = 1'
    )->fetch()['default_count'];

    if ($defaultCount > 0) {
        return;
    }

    $stmt = $pdo->prepare(
        'UPDATE admin_users
         SET is_default_admin = 1
         WHERE email = :email AND is_active = 1'
    );
    $stmt->execute([':email' => 'admin@attendance.local']);

    if ($stmt->rowCount() > 0) {
        return;
    }

    $pdo->exec(
        'UPDATE admin_users
         SET is_default_admin = 1
         WHERE admin_id = (
             SELECT admin_id
             FROM (
                 SELECT MIN(admin_id) AS admin_id
                 FROM admin_users
                 WHERE is_active = 1
             ) first_admin
         )'
    );
}

function syncBatchesTable(PDO $pdo): void
{
    $pdo->exec(
        'INSERT IGNORE INTO batches (batch_name)
         SELECT DISTINCT batch_name
         FROM programs
         WHERE batch_name IS NOT NULL AND batch_name <> ""'
    );
}

function adminUserFromSession(): ?array
{
    $adminId = (int) ($_SESSION['admin_user_id'] ?? 0);
    if ($adminId <= 0) {
        return null;
    }

    $pdo = db();
    ensureAdminSchema($pdo);

    $stmt = $pdo->prepare(
        'SELECT admin_id, full_name, email, is_default_admin
         FROM admin_users
         WHERE admin_id = :adminId AND is_active = 1'
    );
    $stmt->execute([':adminId' => $adminId]);
    $admin = $stmt->fetch();

    if (!$admin) {
        unset($_SESSION['admin_user_id']);
        return null;
    }

    return [
        'id' => (int) $admin['admin_id'],
        'fullName' => (string) $admin['full_name'],
        'email' => (string) $admin['email'],
        'isDefault' => ((int) ($admin['is_default_admin'] ?? 0)) === 1,
    ];
}

function requireAdmin(): array
{
    $admin = adminUserFromSession();
    if (!$admin) {
        jsonError('Admin login required.', 401);
    }

    return $admin;
}

function requireDefaultAdmin(): array
{
    $admin = requireAdmin();
    if (empty($admin['isDefault'])) {
        jsonError('Only the default admin can perform this action.', 403);
    }

    return $admin;
}

function validEmail(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}
