import Ember from 'ember';
import moment from 'moment';

export default Ember.Component.extend({
    style: Ember.computed('top', 'left', function style() {
        // Total modal width: 320px;
        const totalWidth = Ember.$('div.main').width();
        const totalHeight = Ember.$('div.main').height();
        let top = this.get('top') - 40;
        let left = this.get('left') + 60;
        let expectedMinHeight = 200;

        if (this.get('event.location')) {
            expectedMinHeight = expectedMinHeight + 100;
        }
        if (this.get('participants') && this.get('participants').length > 0) {
            expectedMinHeight = expectedMinHeight + 180;
        }
        if (this.get('bodyPreview')) {
            expectedMinHeight = expectedMinHeight + 180;
        }

        if (totalWidth - left < 330) {
            left = left - 440;
        }

        if (totalHeight - top < expectedMinHeight) {
            top = totalHeight - expectedMinHeight;
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

    didReceiveAttrs() {
        this.set('isFullBodyVisible', false);
    },

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
