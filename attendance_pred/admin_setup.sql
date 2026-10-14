CREATE TABLE IF NOT EXISTS batches (
    batch_id INT(11) NOT NULL AUTO_INCREMENT,
    batch_name VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (batch_id),
    UNIQUE KEY uq_batches_name (batch_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO batches (batch_name)
SELECT DISTINCT batch_name
FROM programs
WHERE batch_name IS NOT NULL AND batch_name <> '';

CREATE TABLE IF NOT EXISTS admin_users (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO admin_users (full_name, email, password_hash, is_active, is_default_admin)
VALUES (
    'Default Admin',
    'admin@attendance.local',
    '$2y$10$w6pNfyXRNkrqG9jNqDQFeeCMs1GZmhrCpIV4dik3TtGbH2Zhv6e.e',
    1,
    1
)
ON DUPLICATE KEY UPDATE is_default_admin = 1, is_active = 1;
