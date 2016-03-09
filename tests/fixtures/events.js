import Ember from 'ember';
import moment from 'moment';

export const TestEvent = Ember.Object.extend({});

export const events = [
    TestEvent.create({
        providerId: 'testprovider',
        body: '<html><body><p>Test <strong>Body</strong></p></body></html>',
        bodyType: 'HTML',
        bodyPreview: 'Test Body One',
        end: '2015-02-19T10:45:00.000',
        isEditable: false,
        isAllDay: false,
        isCancelled: false,
        isOrganizer: true,
        isReminderOn: true,
        location: '1355 Market St, San Francisco',
        showAs: 'busy',
        start: '2015-02-19T09:30:00.000',
        title: 'Test Event One'
    }),
    TestEvent.create({
        providerId: 'testprovider',
        body: '<html><body><p>Test <strong>Body</strong></p></body></html>',
        bodyType: 'HTML',
        bodyPreview: 'Test Body All Day One',
        end: '2015-02-19T00:01:00.000',
        isEditable: false,
        isAllDay: true,
        isCancelled: false,
        isOrganizer: true,
        isReminderOn: true,
        location: '1355 Market St, San Francisco',
        showAs: 'busy',
        start: '2015-02-19T23:59:00.000',
        title: 'Test Event All Day One'
    }),
    TestEvent.create({
        providerId: 'testprovider',
        body: '<html><body><p>Test <strong>Body</strong></p></body></html>',
        bodyType: 'HTML',
        bodyPreview: 'Test Body Two',
        end: '2015-02-18T09:45:00.000',
        isEditable: false,
        isAllDay: false,
        isCancelled: false,
        isOrganizer: true,
        isReminderOn: true,
        location: '1355 Market St, San Francisco',
        showAs: 'busy',
        start: '2015-02-18T09:00:00.000',
        title: 'Test Event Two'
    })
];

export const day = moment('2015-02-19');
