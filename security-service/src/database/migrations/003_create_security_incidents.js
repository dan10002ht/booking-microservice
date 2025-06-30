export function up(knex) {
  return knex.schema.createTable('security_incidents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('incident_type', 100).notNullable();
    table.string('severity', 20).notNullable(); // 'low', 'medium', 'high', 'critical'
    table.string('status', 20).defaultTo('open'); // 'open', 'investigating', 'resolved', 'closed'
    table.string('title', 200).notNullable();
    table.text('description');
    table.jsonb('incident_data');
    table.jsonb('affected_users'); // Array of user IDs
    table.jsonb('affected_services'); // Array of service names
    table.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('resolved_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('resolved_at');
    table.text('resolution_notes');
    table.string('resolution_type', 50); // 'automated', 'manual', 'escalated'
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['incident_type']);
    table.index(['severity']);
    table.index(['status']);
    table.index(['created_at']);
    table.index(['assigned_to']);
    table.index(['resolved_by']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('security_incidents');
} 