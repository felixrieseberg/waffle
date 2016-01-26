import Ember from 'ember';

export default Ember.Controller.extend({
    synchro: Ember.inject.service(),

    init() {
        this._super(...arguments);
        //this.get('synchro').synchronize();
    }
});
