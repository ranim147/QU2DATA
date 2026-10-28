-- ─── Options ────────────────────────────────────────────────────────────────
-- (also created by Sequelize sync; kept so the seed can run standalone)
CREATE TABLE IF NOT EXISTS v1_options (
  id uuid PRIMARY KEY,
  option_name varchar(255) NOT NULL UNIQUE,
  option_value varchar(255) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

-- ─── Seed data ───────────────────────────────────────────────────────────────

-- Roles
INSERT INTO v1_roles (id, role_name, created_at, updated_at) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin', NOW(), NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'user',  NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Permissions
INSERT INTO v1_permissions (id, name, flag, created_at, updated_at) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'management of roles', 'roles', NOW(), NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'management of users', 'users', NOW(), NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'management of projects', 'projects', NOW(), NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'management of transformations', 'transformations', NOW(), NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'management of sampling', 'sampling', NOW(), NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'management of data sources', 'data-sources', NOW(), NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 'management of data quality', 'data-quality', NOW(), NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'management of dictionary', 'dictionary', NOW(), NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 'management of studio', 'studio', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Access (admin role → full access)
INSERT INTO v1_access (id, permission_id, role_id, can_create, can_delete, can_update, can_show, can_show_own, is_full_access, created_at, updated_at) VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, false, false, false, false, true, NOW(), NOW()),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, false, false, false, false, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Default admin user  (password: qu2data2024)
INSERT INTO v1_users (id, email, password, is_active, is_banned, requested_token, requested_token_at, user_agent, user_name, last_login, role_id, created_at, updated_at) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a51', 'mehdi.maalawi@qu2data.com', '$2b$10$FdV7KEtZH/GhcTJgjynekOnxCqr85TNe6Auf9jdWx4NDGpsNC8Oi.', true, false, NULL, NULL, NULL, 'mehdi.maalawi', NOW(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Options
INSERT INTO v1_options (id, option_name, option_value, created_at, updated_at) VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a61', 'default_admin_role', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW(), NOW()),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a62', 'application_on',     'true',                                  NOW(), NOW()),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a63', 'default_user_role',  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), NOW())
ON CONFLICT DO NOTHING;
