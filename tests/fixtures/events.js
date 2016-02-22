import moment from 'moment';

export const events = [
    {
        providerId: 'testprovider',
        body: '<html><body><p>Test <strong>Body</strong></p></body></html>',
        bodyType: 'HTML',
        bodyPreview: 'Test Body One',
        end: moment('2015-02-19 10:45:00+00'),
        isEditable: false,
        isAllDay: false,
        isCancelled: false,
        isOrganizer: true,
        isReminderOn: true,
        location: '1355 Market St, San Francisco',
        showAs: 'busy',
        start: moment('2015-02-19 09:30:00+00'),
        title: 'Test Event One'
    },
    {
        providerId: 'testprovider',
        body: '<html><body><p>Test <strong>Body</strong></p></body></html>',
        bodyType: 'HTML',
        bodyPreview: 'Test Body Two',
        end: moment('2015-02-18 09:45:00+00'),
        isEditable: false,
        isAllDay: false,
        isCancelled: false,
        isOrganizer: true,
        isReminderOn: true,
        location: '1355 Market St, San Francisco',
        showAs: 'busy',
        start: moment('2015-02-18 09:00:00+00'),
        title: 'Test Event Two'
    }
];

export const day = moment('2015-02-19');
