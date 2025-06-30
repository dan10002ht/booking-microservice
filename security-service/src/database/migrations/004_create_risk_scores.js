export function up(knex) {
  return knex.schema.createTable('risk_scores', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('entity_type', 50).notNullable(); // 'user', 'device', 'ip', 'location'
    table.string('entity_id', 100); // Device ID, IP address, location hash
    table.integer('risk_score').notNullable().defaultTo(0); // 0-100
    table.string('risk_level', 20).notNullable().defaultTo('low'); // 'low', 'medium', 'high', 'critical'
    table.jsonb('risk_factors'); // Array of risk factors with weights
    table.text('reason');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['user_id']);
    table.index(['entity_type']);
    table.index(['entity_id']);
    table.index(['risk_score']);
    table.index(['risk_level']);
    table.index(['created_at']);
    
    // Unique constraint
    table.unique(['user_id', 'entity_type', 'entity_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('risk_scores');
} 