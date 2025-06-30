export function up(knex) {
  return knex.schema.createTable('security_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('service_name', 100).notNullable();
    table.string('event_type', 100).notNullable();
    table.string('event_category', 50).notNullable(); // 'authentication', 'authorization', 'data_access', 'system'
    table.string('severity', 20).notNullable(); // 'low', 'medium', 'high', 'critical'
    table.jsonb('event_data').notNullable();
    table.inet('ip_address');
    table.text('user_agent');
    table.jsonb('location_data');
    table.integer('risk_score').defaultTo(0); // 0-100
    table.boolean('is_processed').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('processed_at');
    
    // Indexes
    table.index(['user_id']);
    table.index(['service_name']);
    table.index(['event_type']);
    table.index(['severity']);
    table.index(['created_at']);
    table.index(['is_processed']);
    table.index(['risk_score']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('security_events');
} 