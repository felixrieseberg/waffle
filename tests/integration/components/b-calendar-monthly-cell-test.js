import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('b-calendar-monthly-cell', 'Integration | Component | b calendar monthly cell', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });"

  this.render(hbs`{{b-calendar-monthly-cell}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:"
  this.render(hbs`
    {{#b-calendar-monthly-cell}}
      template block text
    {{/b-calendar-monthly-cell}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});