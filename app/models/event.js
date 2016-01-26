import DS from 'ember-data';
import { Model } from 'ember-pouch';

export default Model.extend({
    providerId: DS.attr('string'),
    //Attendees: Array[0]
    body: DS.attr('string'),
    bodyPreview: DS.attr('string'),
    editable: DS.attr('boolean'),
    //Categories: Array[0]
    //ChangeKey: "f46rRLd++ECpaAOXpXOchQACqzBkoQ=="
    //CreatedDateTime: "2016-01-19T23:55:40.5749569Z"
    end: DS.attr('string'),
    //Importance: "Normal"
    IsAllDay: DS.attr('boolean', { defaultValue: false }),
    //IsCancelled: false
    //IsOrganizer: true
    //IsReminderOn: false
    //LastModifiedDateTime: "2016-01-19T23:55:42.1843986Z"
    //Location: Object
    //Organizer: Object
    //OriginalEndTimeZone: "Pacific Standard Time"
    //OriginalStartTimeZone: "Pacific Standard Time"
    //Recurrence: null
    //ReminderMinutesBeforeStart: 0
    //ResponseRequested: true
    //ResponseStatus: Object
    //Sensitivity: "Normal"
    //SeriesMasterId: null
    //ShowAs: "Busy"
    start: DS.attr('string'),
    title: DS.attr('string')
    //Type: "SingleInstance"
});
