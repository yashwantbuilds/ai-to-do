-- First drop tables with foreign key dependencies
DROP TABLE IF EXISTS subtasks;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS tasks;

-- Create the main tasks table first
CREATE TABLE tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    priority VARCHAR(20),
    in_backlog BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'NOT_STARTED',
    created_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    paused_at TIMESTAMP,
    completed_at TIMESTAMP,
    total_paused_time BIGINT DEFAULT 0,
    notes VARCHAR(4000)
);

-- Create dependent tables
CREATE TABLE chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT NOT NULL,
    content VARCHAR(4000),
    role VARCHAR(50),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE subtasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    task_id BIGINT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_task_id ON chat_messages(task_id);
CREATE INDEX idx_subtask_task_id ON subtasks(task_id); 