import { parse, stringify } from '../../../utils/json';
import { module, test } from 'qunit';

module('Unit | Utility | json');

test('it parses JSON', function (assert) {
    assert.expect(2);

    const jsonString = '{ "testParent": { "testChild": 42 } }';
    const result = parse(jsonString);

    assert.ok(result, 'result object is ok');
    assert.equal(result.testParent.testChild, 42, 'result object has expected childred');
});

test('it parses non-JSON without throwing', function (assert) {
    const jsonString = '%??%';
    const result = parse(jsonString);

    assert.strictEqual(result, null, 'result object is just null');
});

test('it stringifies to JSON', function (assert) {
    assert.expect(2);

    const obj = { testParent: { testChild: 42 } };
    const result = stringify(obj);

    assert.ok(result, 'result object is ok');
    assert.deepEqual(JSON.parse(result), obj, 'result string can be parsed just fine');
});
