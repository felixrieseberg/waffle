import DS from 'ember-data';

export default DS.Model.extend({
    providerId: DS.attr('string'),
    body: DS.attr('string'),
    bodyType: DS.attr('string'),
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
    account: DS.belongsTo('account', { async: true })
});
