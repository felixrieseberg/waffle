import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { day, events } from '../../fixtures/events';

moduleForComponent('b-calendar-monthly-cell', 'Integration | Component | b calendar monthly cell', {
    integration: true
});

test('it renders', function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });"
    this.set('_date', day);
    this.render(hbs`{{b-calendar-monthly-cell date=_date events=_events}}`);

    const includesDay = this.$().text().trim().includes('19');
    assert.ok(includesDay);
});

test('renders events', function (assert) {
    assert.expect(2);
    this.set('_events', [events]);
    this.set('_date', day);
    this.render(hbs`{{b-calendar-monthly-cell index=0 date=_date events=_events}}`);

    const includesEventOne = this.$().text().trim().includes('Event One');
    const includesEventTwo = this.$().text().trim().includes('Event Two');
    assert.ok(includesEventOne);
    assert.ok(includesEventTwo);
});

test('all day events are sorted to be on top', function(assert) {
    this.set('_events', [events]);
    this.set('_date', day);

    this.render(hbs`{{b-calendar-monthly-cell index=0 date=_date events=_events}}`);
    const text = this.$().text().trim();
    const allDayEventIsOnTop = (text.indexOf('All Day') < text.indexOf('Test Event One'));
    assert.ok(allDayEventIsOnTop);
});
