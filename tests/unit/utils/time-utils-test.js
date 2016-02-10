import { inDays } from '../../../utils/time-utils';
import { module, test } from 'qunit';
import moment from 'moment';

module('Unit | Utility | Time Utils');

test('it works', function(assert) {
    const result = inDays();
    assert.ok(result);
});

test('it returns now if no parameter given', function(assert) {
    const result = inDays();
    assert.equal(result.toDate().toDateString(), new Date().toDateString());
});

test('it returns correct moment for in five days', function(assert) {
    const result = inDays(5);
    const inFiveDays = new Date();
    inFiveDays.setDate(inFiveDays.getDate() + 5);
    assert.equal(result.toDate().toDateString(), inFiveDays.toDateString());
});

test('it returns correct moment for five days ago', function(assert) {
    const result = inDays(-5);
    const inFiveDays = new Date();
    inFiveDays.setDate(inFiveDays.getDate() - 5);
    assert.equal(result.toDate().toDateString(), inFiveDays.toDateString());
});
