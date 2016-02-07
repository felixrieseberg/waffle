import DS from 'ember-data';

export default DS.RESTSerializer.extend({
    _shouldSerializeHasMany() {
        return true;
    }
});
