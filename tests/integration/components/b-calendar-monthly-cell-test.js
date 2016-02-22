import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { day, events } from '../../fixtures/events';

moduleForComponent('b-calendar-monthly-cell', 'Integration | Component | b calendar monthly cell', {
    integration: true
});

test('it renders', function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });"
    this.set('_events', events);
    this.set('_date', day);

    this.render(hbs`{{b-calendar-monthly-cell date=_date events=_events}}`);
    assert.equal(this.$().text().trim(), '');
});

// date=day.date
// events=rowEvents
// isInTargetMonth=day.isInTargetMonth
// index=index
// onEventClicked=(action "onEventClicked")
