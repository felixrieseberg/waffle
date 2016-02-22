import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { events } from '../../fixtures/events';

moduleForComponent('b-calendar-monthly-cell-entry', 'Integration | Component | b calendar monthly cell entry', {
    integration: true
});

test('it renders the title', function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });"
    const event = events[0];
    event.start = moment();

    this.set('_event', event);
    this.render(hbs`{{b-calendar-monthly-cell-entry event=_event}}`);

    const containsEventTitle = this.$().text().trim().includes('Test Event');

    assert.ok(containsEventTitle);
});

test('it contains start time without minutes for event that starts at :00', function(assert) {
    const event = events[0];
    event.start = moment().hour(6).minutes(0);
    event.end = moment().hour(7).minutes(0);

    this.set('_event', event);
    this.render(hbs`{{b-calendar-monthly-cell-entry event=_event}}`);

    const containsEventStartTime = this.$().text().trim().includes('6am');

    assert.ok(containsEventStartTime);
});

test('it contains start time with minutes for event that starts at :00', function(assert) {
    const event = events[0];
    event.start = moment().hour(6).minutes(30);
    event.end = moment().hour(7).minutes(30);

    this.set('_event', event);
    this.render(hbs`{{b-calendar-monthly-cell-entry event=_event}}`);

    const containsEventStartTime = this.$().text().trim().includes('6:30am');

    assert.ok(containsEventStartTime);
});
