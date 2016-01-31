import Ember from 'ember';
import DebuggerMixin from '../../../mixins/debugger';
import { module, test } from 'qunit';

module('Unit | Mixin | debugger');

// Replace this with your real tests.
test('it works', function(assert) {
  let DebuggerObject = Ember.Object.extend(DebuggerMixin);
  let subject = DebuggerObject.create();
  assert.ok(subject);
});
