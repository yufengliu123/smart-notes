-- ============================================
-- 智能学习笔记系统 - 数据库设计
-- ============================================

CREATE DATABASE IF NOT EXISTS smart_notes;
USE smart_notes;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    summary TEXT,
    keywords VARCHAR(500),
    category VARCHAR(100),
    tags VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
);

CREATE TABLE note_relations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_note_id INT NOT NULL,
    target_note_id INT NOT NULL,
    relation_type VARCHAR(50) DEFAULT 'related',
    weight FLOAT DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_note_id) REFERENCES notes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_source_target (source_note_id, target_note_id),
    INDEX idx_source (source_note_id),
    INDEX idx_target (target_note_id)
);

CREATE TABLE review_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    note_id INT NOT NULL,
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 1,
    repetitions INT DEFAULT 0,
    next_review_date DATE NOT NULL,
    last_reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_note (user_id, note_id),
    INDEX idx_next_review (next_review_date),
    INDEX idx_user_id (user_id)
);

CREATE TABLE review_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    user_id INT NOT NULL,
    note_id INT NOT NULL,
    quality INT NOT NULL,
    review_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES review_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    INDEX idx_schedule_id (schedule_id),
    INDEX idx_review_time (review_time)
);

CREATE TABLE knowledge_nodes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    note_id INT NOT NULL,
    node_type VARCHAR(50) DEFAULT 'concept',
    node_name VARCHAR(200) NOT NULL,
    node_properties JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    INDEX idx_note_id (note_id),
    INDEX idx_node_type (node_type)
);