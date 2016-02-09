import Ember from 'ember';

export default Ember.Component.extend({
    style: Ember.computed('top', 'left', function style () {
        const totalWidth = $(window).width();
        const totalHeight = $(window).height();
        let top = this.get('top') - 30;
        let left = this.get('left') + 15;

        if (totalWidth - left < 330) {
            left = totalWidth - 330;
        }

        if (totalHeight - top < 330) {
            top = totalHeight - 400;
        }

        return new Ember.Handlebars.SafeString(`transform: translate(${left}px, ${top}px)`);
    }),

    day: Ember.computed('event', function day () {
        var start = moment(this.get('event.start'));
        return start.calendar(null, {
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            nextWeek: '[This] dddd',
            lastDay: '[Yesterday]',
            lastWeek: '[Last] dddd',
            sameElse: 'dddd, MMMM Do YYYY'
        });
    }),

    actions: {
        toggleVisibility() {
            this.toggleProperty('isEnabled');
        }
    }
});
