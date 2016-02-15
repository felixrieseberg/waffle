import Ember from 'ember';
import DraganddropInitializer from '../../../initializers/draganddrop';
import { module, test } from 'qunit';

let application;

module('Unit | Initializer | draganddrop', {
    beforeEach() {
        Ember.run(function() {
            application = Ember.Application.create();
            application.deferReadiness();
        });
    }
});

test('adds event handler for drop', function(assert) {
    DraganddropInitializer.initialize(application);
    assert.ok(document.ondrop);
});

test('adds event handler for drop', function(assert) {
    DraganddropInitializer.initialize(application);
    assert.ok(document.ondragover);
});
