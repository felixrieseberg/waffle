
exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTableIfNotExists('accounts', (table) => {
            table.increments('id').primary();
            table.string('name');
            table.string('username');
            table.string('password');
            table.string('strategy');
            table.json('oauth');
            table.json('sync');
            table.json('error');
            table.integer('events')
                .references('id')
                .inTable('events');
        }),

        knex.schema.createTableIfNotExists('events', (table) => {
            table.increments('id').primary();
            table.dateTime('start');
            table.dateTime('end');
            table.string('providerId');
            table.text('body');
            table.text('bodyPreview');
            table.text('title');
            table.string('showAs');
            table.boolean('isEditable');
            table.boolean('isAllDay');
            table.boolean('isCancelled');
            table.boolean('isOrganizer');
            table.boolean('isReminderOn');
            table.json('location');
            table.string('type');
            table.integer('account_id')
                .references('id')
                .inTable('accounts');
        })
    ]);
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('accounts'),
        knex.schema.dropTable('events'),
    ]);
};
