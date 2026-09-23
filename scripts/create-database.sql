-- Run on your selected private MySQL server as its administrator.
-- Replace the password locally. Never place production secrets in source control.
CREATE DATABASE IF NOT EXISTS leadnest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'leadnest_app'@'localhost' IDENTIFIED BY 'REPLACE_WITH_A_UNIQUE_LOCAL_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON leadnest.* TO 'leadnest_app'@'localhost';
-- For local integration testing only:
CREATE DATABASE IF NOT EXISTS leadnest_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON leadnest_test.* TO 'leadnest_app'@'localhost';

