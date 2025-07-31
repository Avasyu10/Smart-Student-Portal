-- Temporarily update your role to teacher to create assignments
UPDATE profiles SET role = 'teacher' WHERE user_id = '6e7ef332-26db-42a9-a293-6e1188aaa394';

-- Create sample assignments
INSERT INTO assignments (title, description, course_name, due_date, max_points, instructions, created_by, file_types_allowed, max_file_size_mb, status) VALUES
('Essay on Climate Change', 'Write a 1000-word essay discussing the impact of climate change on global ecosystems', 'Environmental Science', '2025-08-15 23:59:00+00', 100, 'Your essay should include at least 3 scientific sources and proper citations. Focus on specific examples of how climate change affects different ecosystems.', '6e7ef332-26db-42a9-a293-6e1188aaa394', ARRAY['pdf', 'doc', 'docx'], 10, 'active'),
('Math Problem Set 3', 'Complete problems 1-20 from Chapter 5', 'Mathematics', '2025-08-10 18:00:00+00', 50, 'Show all your work for each problem. Submit as a single PDF file.', '6e7ef332-26db-42a9-a293-6e1188aaa394', ARRAY['pdf'], 5, 'active'),
('Historical Analysis Paper', 'Analyze the causes and effects of World War I', 'History', '2025-08-20 23:59:00+00', 150, 'Your paper should be 2000-2500 words and include primary source analysis.', '6e7ef332-26db-42a9-a293-6e1188aaa394', ARRAY['pdf', 'docx'], 15, 'active');

-- Change your role back to student
UPDATE profiles SET role = 'student' WHERE user_id = '6e7ef332-26db-42a9-a293-6e1188aaa394';