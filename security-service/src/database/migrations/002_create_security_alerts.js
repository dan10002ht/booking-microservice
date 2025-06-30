export function up(knex) {
  return knex.schema.createTable('security_alerts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('event_id').references('id').inTable('security_events').onDelete('CASCADE');
    table.string('alert_type', 100).notNullable();
    table.string('alert_category', 50).notNullable();
    table.string('severity', 20).notNullable(); // 'low', 'medium', 'high', 'critical'
    table.string('status', 20).defaultTo('open'); // 'open', 'acknowledged', 'resolved', 'closed'
    table.string('title', 200).notNullable();
    table.text('description');
    table.jsonb('alert_data');
    table.uuid('acknowledged_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('acknowledged_at');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['event_id']);
    table.index(['alert_type']);
    table.index(['severity']);
    table.index(['status']);
    table.index(['created_at']);
    table.index(['acknowledged_by']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('security_alerts');
} 