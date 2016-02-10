import Ember from 'ember';

export default Ember.Controller.extend({
    synchro: Ember.inject.service(),

    init() {
        this._super(...arguments);

        // Start synchronization 2.5s after app launch to ensure that
        // the database has a few seconds to wake up
        setTimeout(() => {
            const synchro = this.get('synchro');
            if (synchro) synchro.synchronize();
        }, 2500);
    }
});
