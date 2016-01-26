import Ember from 'ember';
import SynchronizeInitializer from '../../../initializers/synchronize';
import { module, test } from 'qunit';

let application;

module('Unit | Initializer | synchronize', {
  beforeEach() {
    Ember.run(function() {
      application = Ember.Application.create();
      application.deferReadiness();
    });
  }
});

// Replace this with your real tests.
test('it works', function(assert) {
  SynchronizeInitializer.initialize(application);

  // you would normally confirm the results of the initializer here
  assert.ok(true);
});
