-- GitHub Profile Analyzer - Database Schema
-- MySQL 8.0+ recommended

CREATE DATABASE IF NOT EXISTS `github_analyzer`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `github_analyzer`;

CREATE TABLE IF NOT EXISTS `profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `github_id` BIGINT UNIQUE NOT NULL COMMENT 'GitHub numeric user id',
  `username` VARCHAR(255) UNIQUE NOT NULL COMMENT 'GitHub login (case-insensitive unique)',
  `name` VARCHAR(255) NULL,
  `bio` TEXT NULL,
  `company` VARCHAR(255) NULL,
  `location` VARCHAR(255) NULL,
  `blog` VARCHAR(500) NULL,
  `email` VARCHAR(255) NULL,
  `twitter_username` VARCHAR(255) NULL,
  `avatar_url` VARCHAR(500) NULL,
  `html_url` VARCHAR(500) NULL,
  `public_repos` INT DEFAULT 0,
  `public_gists` INT DEFAULT 0,
  `followers` INT DEFAULT 0,
  `following` INT DEFAULT 0,
  `total_stars` INT DEFAULT 0 COMMENT 'Sum of stargazers across owned (non-fork) repos',
  `total_forks` INT DEFAULT 0,
  `total_watchers` INT DEFAULT 0,
  `top_language` VARCHAR(100) NULL COMMENT 'Most-used primary language across owned repos',
  `languages_json` JSON NULL COMMENT 'Map of language -> repo count',
  `top_repo_name` VARCHAR(255) NULL,
  `top_repo_stars` INT DEFAULT 0,
  `top_repo_url` VARCHAR(500) NULL,
  `account_age_days` INT DEFAULT 0,
  `hireable` TINYINT(1) NULL,
  `github_created_at` DATETIME NULL,
  `github_updated_at` DATETIME NULL,
  `last_analyzed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_followers` (`followers`),
  INDEX `idx_total_stars` (`total_stars`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
