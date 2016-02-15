import DS from 'ember-data';
import { parse, stringify } from '../utils/json';
import Ember from 'ember';

export default DS.Model.extend({
    providerId: DS.attr('string'),
    body: DS.attr('string'),
    bodyType: DS.attr('string'),
    bodyPreview: DS.attr('string'),
    end: DS.attr('string'),
    isEditable: DS.attr('boolean'),
    isAllDay: DS.attr('boolean', { defaultValue: false }),
    isCancelled: DS.attr('boolean', { defaultValue: false }),
    isOrganizer: DS.attr('boolean'),
    isReminderOn: DS.attr('boolean'),
    location: DS.attr('string'),
    showAs: DS.attr('string'),
    start: DS.attr('string'),
    title: DS.attr('string'),
    type: DS.attr('string'),
    account: DS.belongsTo('account', { async: true }),
    // JSON String, mostly for performance (we don't need to parse all events),
    _participants: DS.attr('string'),

    participants: Ember.computed('_participants', {
        get() {
            return parse(this.get('_participants'));
        },
        set(key, value) {
            if (value) {
                const stringified = stringify(value);
                if (stringified) {
                    this.set('_participants', stringified);
                }
            }
        }
    })
});
