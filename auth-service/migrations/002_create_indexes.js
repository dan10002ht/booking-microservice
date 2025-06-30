/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Users table indexes
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_public_id ON users(public_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_users_auth_type ON users(auth_type)');

  // Organizations table indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organizations_public_id ON organizations(public_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id)'
  );
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name)');
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organizations_is_verified ON organizations(is_verified)'
  );

  // OAuth accounts table indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_oauth_accounts_public_id ON oauth_accounts(public_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider_user_id ON oauth_accounts(provider, provider_user_id)'
  );

  // Refresh tokens table indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked)'
  );

  // User sessions table indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active)'
  );

  // Audit logs table indexes
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)'
  );
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)');

  // Permissions table indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action)'
  );

  // User roles table indexes
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id)');

  // Role permissions table indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id)'
  );

  // Organization indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organization_roles_public_id ON organization_roles(public_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organization_roles_org_id ON organization_roles(organization_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organization_roles_hierarchy ON organization_roles(hierarchy_level)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organization_members_public_id ON organization_members(public_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organization_members_status ON organization_members(status)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organization_invitations_public_id ON organization_invitations(public_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organization_invitations_org_id ON organization_invitations(organization_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON organization_invitations(email)'
  );
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_organization_invitations_expires ON organization_invitations(expires_at)'
  );
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Drop indexes in reverse order
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organization_invitations_expires');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organization_invitations_email');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organization_invitations_org_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organization_invitations_public_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organization_members_status');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organization_members_user_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organization_members_org_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organization_members_public_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organization_roles_hierarchy');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organization_roles_org_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organization_roles_public_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_role_permissions_role_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_user_roles_user_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_permissions_resource_action');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_audit_logs_action');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_audit_logs_created_at');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_audit_logs_user_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_user_sessions_is_active');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_user_sessions_expires_at');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_user_sessions_user_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_refresh_tokens_is_revoked');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_refresh_tokens_expires_at');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_refresh_tokens_user_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_oauth_accounts_provider_user_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_oauth_accounts_provider');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_oauth_accounts_user_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organizations_is_verified');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organizations_name');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organizations_user_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_organizations_public_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_users_auth_type');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_users_is_verified');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_users_is_active');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_users_phone');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_users_email');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_users_public_id');
}
