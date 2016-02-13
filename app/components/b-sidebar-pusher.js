import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['pusher'],
    classNameBindings: ['isSidebarVisible:sidebar-visible'],

    click(e) {
        if (this.get('isSidebarVisible')) {
            e.preventDefault();
            this.set('isSidebarVisible', false);
            return false;
        }
    }
});
