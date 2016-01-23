import DS from 'ember-data';

export default DS.Model.extend({
    odataId: DS.attr('string'),
    //Attendees: Array[0]
    body: DS.attr('string'),
    bodyPreview: DS.attr('string'),
    //Categories: Array[0]
    //ChangeKey: "f46rRLd++ECpaAOXpXOchQACqzBkoQ=="
    //CreatedDateTime: "2016-01-19T23:55:40.5749569Z"
    end: DS.attr('string'),
    //Importance: "Normal"
    //IsAllDay: false
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
    subject: DS.attr('string')
    //Type: "SingleInstance"
});
