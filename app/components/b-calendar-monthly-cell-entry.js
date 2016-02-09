import Ember from 'ember';

export default Ember.Component.extend({
    click(e) {
        this.get('onEventClicked')(e, this.get('event'));
    }
});
