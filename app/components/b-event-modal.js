import Ember from 'ember';
import moment from 'moment';

export default Ember.Component.extend({
    style: Ember.computed('top', 'left', function style() {
        // Total modal width: 320px;
        const totalWidth = Ember.$(window).width();
        const totalHeight = Ember.$(window).height();
        let top = this.get('top') - 30;
        let left = this.get('left') + 60;

        if (totalWidth - left < 330) {
            left = left - 440;
        }

        if (totalHeight - top < 330) {
            top = totalHeight - 400;
        }

        return new Ember.Handlebars.SafeString(`transform: translate(${left}px, ${top}px)`);
    }),

    day: Ember.computed('event', function day() {
        const start = moment(this.get('event.start'));
        return start.calendar(null, {
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            nextWeek: '[This] dddd',
            lastDay: '[Yesterday]',
            lastWeek: '[Last] dddd',
            sameElse: 'dddd, MMMM Do YYYY'
        });
    }),

    bodyPreview: Ember.computed('event.bodyPreview', {
        get() {
            const bp = this.get('event.bodyPreview');
            return (bp) ? bp.trim() : null;
        }
    }),

    actions: {
        toggleVisibility() {
            this.toggleProperty('isEnabled');
        },

        toggleBody() {
            this.toggleProperty('isFullBodyVisible');
        },

        openLocation() {
            const shell = require('electron').remote.shell;
            const location = this.get('event.location');

            if (location) shell.openExternal(`https://www.google.com/maps/place/${location}`);
        }
    }
});
