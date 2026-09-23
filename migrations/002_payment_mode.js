export async function up(k){await k.schema.alterTable('payments',t=>t.boolean('is_test').notNullable().defaultTo(true));} export async function down(){throw Error('Use backup restore');}
