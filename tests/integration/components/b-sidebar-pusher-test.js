import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('b-sidebar-pusher', 'Integration | Component | b sidebar pusher', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });"

  this.render(hbs`{{b-sidebar-pusher}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:"
  this.render(hbs`
    {{#b-sidebar-pusher}}
      template block text
    {{/b-sidebar-pusher}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
