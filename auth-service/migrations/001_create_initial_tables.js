/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Create users table - Hybrid approach
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary(); // Internal ID for performance
    table.uuid('public_id').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()')); // Public ID for API
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255); // NULL for OAuth users
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('phone', 20);
    table.date('date_of_birth');
    table.string('gender', 10);
    table.text('address');
    table.string('city', 100);
    table.string('state', 100);
    table.string('country', 100);
    table.string('postal_code', 20);
    table.text('profile_picture_url');
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    table.timestamp('phone_verified_at');
    table.timestamp('last_login_at');
    table.string('auth_type', 20).defaultTo('email'); // 'email' or 'oauth'
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Create organizations table - Hybrid approach
  await knex.schema.createTable('organizations', (table) => {
    table.bigIncrements('id').primary(); // Internal ID for performance
    table.uuid('public_id').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()')); // Public ID for API
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.text('website_url');
    table.text('logo_url');
    table.string('tax_id', 50);
    table.string('business_license', 100);
    table.string('contact_person', 100);
    table.string('contact_phone', 20);
    table.string('contact_email', 255);
    table.text('address');
    table.string('city', 100);
    table.string('state', 100);
    table.string('country', 100);
    table.string('postal_code', 20);
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('verified_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Create oauth_accounts table - Hybrid approach
  await knex.schema.createTable('oauth_accounts', (table) => {
    table.bigIncrements('id').primary(); // Internal ID for performance
    table.uuid('public_id').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()')); // Public ID for API
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('provider', 50).notNullable(); // 'google', 'facebook', etc.
    table.string('provider_user_id', 255).notNullable();
    table.text('access_token');
    table.text('refresh_token');
    table.timestamp('expires_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['provider', 'provider_user_id']);
    table.unique(['user_id', 'provider']);
  });

  // Create roles table - Hybrid approach
  await knex.schema.createTable('roles', (table) => {
    table.bigIncrements('id').primary(); // Internal ID for performance
    table.uuid('public_id').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()')); // Public ID for API
    table.string('name', 50).unique().notNullable();
    table.text('description');
    table.jsonb('permissions');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Create permissions table - Hybrid approach
  await knex.schema.createTable('permissions', (table) => {
    table.bigIncrements('id').primary(); // Internal ID for performance
    table.uuid('public_id').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()')); // Public ID for API
    table.string('name', 100).unique().notNullable();
    table.text('description');
    table.string('resource', 100).notNullable();
    table.string('action', 50).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Create user_roles table - Hybrid approach
  await knex.schema.createTable('user_roles', (table) => {
    table.bigIncrements('id').primary(); // Internal ID for performance
    table.uuid('public_id').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()')); // Public ID for API
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.bigInteger('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'role_id']);
  });

  // Create role_permissions table - Hybrid approach
  await knex.schema.createTable('role_permissions', (table) => {
    table.bigIncrements('id').primary(); // Internal ID for performance
    table.uuid('public_id').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()')); // Public ID for API
    table.bigInteger('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table
      .bigInteger('permission_id')
      .notNullable()
      .references('id')
      .inTable('permissions')
      .onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['role_id', 'permission_id']);
  });

  // Create user_sessions table - Internal only (performance critical)
  await knex.schema.createTable('user_sessions', (table) => {
    table.bigIncrements('id').primary(); // Auto increment for performance
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('session_id', 255).unique().notNullable();
    table.string('ip_address', 45); // Changed from table.inet to table.string for IPv4/IPv6
    table.text('user_agent');
    table.timestamp('expires_at').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Create refresh_tokens table - Internal only (performance critical)
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.bigIncrements('id').primary(); // Auto increment for performance
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table
      .string('session_id', 255)
      .references('session_id')
      .inTable('user_sessions')
      .onDelete('CASCADE');
    table.string('token_hash', 1000).unique().notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_revoked').defaultTo(false);
    table.string('device_info', 500); // Device fingerprint for security
    table.string('ip_address', 45); // IP address when token was created
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Create password_reset_tokens table - Internal only (performance critical)
  await knex.schema.createTable('password_reset_tokens', (table) => {
    table.bigIncrements('id').primary(); // Auto increment for performance
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 1000).unique().notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_used').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Create email_verification_tokens table - Internal only (performance critical)
  await knex.schema.createTable('email_verification_tokens', (table) => {
    table.bigIncrements('id').primary(); // Auto increment for performance
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 1000).unique().notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_used').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Create audit_logs table - Internal only (performance critical)
  await knex.schema.createTable('audit_logs', (table) => {
    table.bigIncrements('id').primary(); // Auto increment for performance
    table.bigInteger('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('resource_type', 100);
    table.uuid('resource_id');
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.string('ip_address', 45); // Changed from table.inet to table.string for IPv4/IPv6
    table.text('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // --- Organization tables with hybrid approach ---
  await knex.schema.createTable('organization_roles', (table) => {
    table.bigIncrements('id').primary(); // Internal ID for performance
    table.uuid('public_id').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()')); // Public ID for API
    table
      .bigInteger('organization_id')
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE');
    table.string('name', 50).notNullable(); // 'admin', 'manager', 'member', 'viewer'
    table.text('description');
    table.jsonb('permissions'); // Organization-specific permissions
    table.integer('hierarchy_level').defaultTo(0); // 0=highest, 100=lowest
    table.boolean('is_default').defaultTo(false); // Default role for new members
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['organization_id', 'name']);
  });

  await knex.schema.createTable('organization_members', (table) => {
    table.bigIncrements('id').primary(); // Internal ID for performance
    table.uuid('public_id').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()')); // Public ID for API
    table
      .bigInteger('organization_id')
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE');
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table
      .bigInteger('role_id')
      .notNullable()
      .references('id')
      .inTable('organization_roles')
      .onDelete('CASCADE');
    table.string('status', 20).defaultTo('active'); // 'active', 'pending', 'suspended'
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.timestamp('last_active_at');
    table.bigInteger('invited_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['organization_id', 'user_id']);
  });

  await knex.schema.createTable('organization_invitations', (table) => {
    table.bigIncrements('id').primary(); // Internal ID for performance
    table.uuid('public_id').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()')); // Public ID for API
    table
      .bigInteger('organization_id')
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE');
    table.string('email', 255).notNullable();
    table
      .bigInteger('role_id')
      .notNullable()
      .references('id')
      .inTable('organization_roles')
      .onDelete('CASCADE');
    table.string('token_hash', 1000).unique().notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_accepted').defaultTo(false);
    table
      .bigInteger('invited_by')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Add indexes for performance
  await knex.schema.raw('CREATE INDEX idx_users_public_id ON users(public_id)');
  await knex.schema.raw('CREATE INDEX idx_users_email ON users(email)');
  await knex.schema.raw('CREATE INDEX idx_users_is_active ON users(is_active)');
  await knex.schema.raw('CREATE INDEX idx_users_is_verified ON users(is_verified)');
  await knex.schema.raw('CREATE INDEX idx_users_auth_type ON users(auth_type)');

  await knex.schema.raw('CREATE INDEX idx_organizations_public_id ON organizations(public_id)');
  await knex.schema.raw('CREATE INDEX idx_organizations_user_id ON organizations(user_id)');
  await knex.schema.raw('CREATE INDEX idx_organizations_name ON organizations(name)');
  await knex.schema.raw('CREATE INDEX idx_organizations_is_verified ON organizations(is_verified)');

  await knex.schema.raw('CREATE INDEX idx_oauth_accounts_public_id ON oauth_accounts(public_id)');
  await knex.schema.raw('CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id)');
  await knex.schema.raw('CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider)');
  await knex.schema.raw(
    'CREATE INDEX idx_oauth_accounts_provider_user_id ON oauth_accounts(provider, provider_user_id)'
  );

  await knex.schema.raw('CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id)');
  await knex.schema.raw('CREATE INDEX idx_refresh_tokens_session_id ON refresh_tokens(session_id)');
  await knex.schema.raw('CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)');
  await knex.schema.raw('CREATE INDEX idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked)');

  await knex.schema.raw('CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id)');
  await knex.schema.raw('CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at)');
  await knex.schema.raw('CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active)');

  await knex.schema.raw('CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id)');
  await knex.schema.raw('CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at)');
  await knex.schema.raw('CREATE INDEX idx_audit_logs_action ON audit_logs(action)');

  await knex.schema.raw(
    'CREATE INDEX idx_permissions_resource_action ON permissions(resource, action)'
  );

  // Organization indexes
  await knex.schema.raw(
    'CREATE INDEX idx_organization_roles_public_id ON organization_roles(public_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX idx_organization_roles_org_id ON organization_roles(organization_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX idx_organization_roles_hierarchy ON organization_roles(hierarchy_level)'
  );
  await knex.schema.raw(
    'CREATE INDEX idx_organization_members_public_id ON organization_members(public_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX idx_organization_members_user_id ON organization_members(user_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX idx_organization_members_status ON organization_members(status)'
  );
  await knex.schema.raw(
    'CREATE INDEX idx_organization_invitations_public_id ON organization_invitations(public_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX idx_organization_invitations_org_id ON organization_invitations(organization_id)'
  );
  await knex.schema.raw(
    'CREATE INDEX idx_organization_invitations_email ON organization_invitations(email)'
  );
  await knex.schema.raw(
    'CREATE INDEX idx_organization_invitations_expires ON organization_invitations(expires_at)'
  );
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('organization_invitations');
  await knex.schema.dropTableIfExists('organization_members');
  await knex.schema.dropTableIfExists('organization_roles');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('user_sessions');
  await knex.schema.dropTableIfExists('email_verification_tokens');
  await knex.schema.dropTableIfExists('password_reset_tokens');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('oauth_accounts');
  await knex.schema.dropTableIfExists('organizations');
  await knex.schema.dropTableIfExists('users');
}
