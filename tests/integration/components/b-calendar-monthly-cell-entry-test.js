import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('b-calendar-monthly-cell-entry', 'Integration | Component | b calendar monthly cell entry', {
    integration: true
});

test('it renders the title', function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });"
    const event = {
        isAllDay: false,
        title: 'Test Event',
        start: moment()
    }

    this.set('_event', event);
    this.render(hbs`{{b-calendar-monthly-cell-entry event=_event}}`);

    const containsEventTitle = this.$().text().trim().includes('Test Event');

    assert.ok(containsEventTitle);
});

test('it contains start time without minutes for event that starts at :00', function(assert) {
    const start = moment().hour(6).minutes(0);
    const event = {
        isAllDay: false,
        title: 'Test Event',
        start: start
    }

    this.set('_event', event);
    this.render(hbs`{{b-calendar-monthly-cell-entry event=_event}}`);

    const containsEventStartTime = this.$().text().trim().includes('6am');

    assert.ok(containsEventStartTime);
});

test('it contains start time with minutes for event that starts at :00', function(assert) {
    const start = moment().hour(6).minutes(30);
    const event = {
        isAllDay: false,
        title: 'Test Event',
        start: start
    }

    this.set('_event', event);
    this.render(hbs`{{b-calendar-monthly-cell-entry event=_event}}`);

    const containsEventStartTime = this.$().text().trim().includes('6:30am');

    assert.ok(containsEventStartTime);
});
