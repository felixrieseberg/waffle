import Ember from 'ember';
import setupMenu from '../utils/window-menu';

export default Ember.Route.extend({
    beforeModel() {
        this.transitionTo('calendar');
        setupMenu();
    }
});
