-- Run this script once to create the database and tables
-- Compatible with MySQL 5.7+ / MariaDB 10+

CREATE DATABASE IF NOT EXISTS wnims_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE wnims_db;

-- ── Citizens table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS citizens (
  id                VARCHAR(36)  NOT NULL PRIMARY KEY,
  nationalIdNumber  VARCHAR(30)  NOT NULL UNIQUE,
  fullName          VARCHAR(120) NOT NULL,
  fatherName        VARCHAR(120) NOT NULL,
  motherName        VARCHAR(120) NOT NULL,
  dateOfBirth       DATE         NOT NULL,
  placeOfBirth      VARCHAR(100) NOT NULL DEFAULT '',
  gender            ENUM('Male','Female') NOT NULL DEFAULT 'Male',
  maritalStatus     ENUM('Single','Married','Divorced','Widowed') NOT NULL DEFAULT 'Single',
  phone             VARCHAR(30)  NOT NULL DEFAULT '',
  occupation        VARCHAR(80)  NOT NULL DEFAULT '',
  address           TEXT         NOT NULL,
  district          VARCHAR(60)  NOT NULL DEFAULT '',
  photo             LONGTEXT     NULL,          -- base64 data-URL
  fingerprint       LONGTEXT     NULL,          -- base64 (optional)
  qrCode            LONGTEXT     NOT NULL,
  status            ENUM('Active','Pending','Rejected') NOT NULL DEFAULT 'Pending',
  registrationDate  DATE         NOT NULL,
  issueDate         DATE         NOT NULL,
  expiryDate        DATE         NOT NULL,
  createdAt         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── App Settings table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  id            INT          NOT NULL PRIMARY KEY DEFAULT 1,
  stateName     VARCHAR(120) NOT NULL DEFAULT 'Waqooyi Bari',
  logoUrl       LONGTEXT     NULL,
  flagUrl       LONGTEXT     NULL,
  watermarkUrl  LONGTEXT     NULL,
  cardTemplate  ENUM('default','classic','modern') NOT NULL DEFAULT 'default',
  primaryColor  VARCHAR(20)  NOT NULL DEFAULT '#00875a',
  accentColor   VARCHAR(20)  NOT NULL DEFAULT '#1a4a8a',
  updatedAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default settings row (only one row ever lives here)
INSERT IGNORE INTO app_settings (id) VALUES (1);

-- ── Users table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  createdAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user (password: 'admin')
-- Hashed using bcrypt
INSERT IGNORE INTO users (email, name, password) VALUES ('admin@gmail.com', 'System Administrator', '$2b$10$3VgX3FeEa2nhtclVWyAEYed.u1wODrVjbJposZdWfnH1yGw6SUxNS');
