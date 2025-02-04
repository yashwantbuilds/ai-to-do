-- Insert only if tables are empty
INSERT INTO tasks (title, description, priority, in_backlog, created_at)
SELECT 'Welcome Task', 'This is your first task', 'MEDIUM', false, CURRENT_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM tasks);

INSERT INTO chat_messages (task_id, content, role, timestamp)
SELECT 1, 'Welcome to the AI Task Manager!', 'assistant', CURRENT_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM chat_messages); 