-- Enable Realtime for assigned_tasks table
-- This allows the frontend to receive live updates when tasks are created, updated, or deleted

-- Enable realtime publication for assigned_tasks
ALTER PUBLICATION supabase_realtime ADD TABLE assigned_tasks;

-- Also enable for children table (for XP/level updates)
ALTER PUBLICATION supabase_realtime ADD TABLE children;



