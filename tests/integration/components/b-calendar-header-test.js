import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';

moduleForComponent('b-calendar-header', 'Integration | Component | Calendar Header', {
    integration: true
});

test('it renders', function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });"

    this.render(hbs`{{b-calendar-header}}`);

    const text = this.$().text().trim();
    const containsName = text.includes('Waffle');

    assert.ok(containsName);
});

test('targetDate updates title', function(assert) {
    const targetDate = moment('2000/01/01', 'YYYY/MM/DD');

    this.set('_targetDate', targetDate);
    this.render(hbs`{{b-calendar-header targetDate=_targetDate}}`);

    const text = this.$().text().trim();
    const containsDate = text.includes('Waffle - January 2000');

    assert.ok(containsDate);
});

test('Clicking on `Go Back` button moves targetDate', function(assert) {
    let targetDate = moment('2000/01/01', 'YYYY/MM/DD');

    this.set('_targetDate', targetDate);
    this.render(hbs`{{b-calendar-header currentView="monthly" targetDate=_targetDate}}`);

    // Click ze buttonz
    this.$('#headerGoBack').click();

    const text = this.$().text().trim();
    const containsDate = text.includes('Waffle - December 1999');

    assert.ok(containsDate, 'title is correct');
});

test('Clicking on `Go Forward` button moves targetDate', function(assert) {
    let targetDate = moment('2000/01/01', 'YYYY/MM/DD');

    this.set('_targetDate', targetDate);
    this.render(hbs`{{b-calendar-header currentView="monthly" targetDate=_targetDate}}`);

    // Click ze buttonz
    this.$('#headerGoForward').click();

    const text = this.$().text().trim();
    const containsDate = text.includes('Waffle - February 2000');

    assert.ok(containsDate, 'title is correct');
});

test('Clicking on `Go to Today` button moves targetDate', function(assert) {
    let targetDate = moment('2000/01/01', 'YYYY/MM/DD');

    this.set('_targetDate', targetDate);
    this.render(hbs`{{b-calendar-header currentView="monthly" targetDate=_targetDate}}`);

    // Click ze buttonz
    this.$('#headerGoToday').click();

    const text = this.$().text().trim();
    const now = moment().format('MMMM YYYY');
    const containsDate = text.includes(now);

    assert.ok(containsDate, 'title is correct');
});
