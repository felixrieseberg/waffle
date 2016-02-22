import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { events } from '../../fixtures/events';

moduleForComponent('b-calendar-monthly-cell-entry', 'Integration | Component | b calendar monthly cell entry', {
    integration: true
});

test('it renders the title', function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });"
    const _events = events.slice(0);
    const event = _events[0];

    this.set('_event', event);
    this.render(hbs`{{b-calendar-monthly-cell-entry event=_event}}`);

    const containsEventTitle = this.$().text().trim().includes('Test Event');

    assert.ok(containsEventTitle);
});

test('it contains start time without minutes for event that starts at :00', function(assert) {
    const _events = events.slice(0);
    const event = _events[2];

    this.set('_event', event);
    this.render(hbs`{{b-calendar-monthly-cell-entry event=_event}}`);

    const containsEventStartTime = this.$().text().trim().includes('9am');

    assert.ok(containsEventStartTime);
});

test('it contains start time with minutes for event that starts at :30', function(assert) {
    const _events = events.slice(0);
    const event = _events[0];

    this.set('_event', event);
    this.render(hbs`{{b-calendar-monthly-cell-entry event=_event}}`);

    const containsEventStartTime = this.$().text().trim().includes('30am');

    assert.ok(containsEventStartTime);
});
