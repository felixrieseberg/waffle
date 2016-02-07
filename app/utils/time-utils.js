import moment from 'moment';

export function inDays(days) {
    if (days > 0) {
        return moment().add(days, 'days');
    }

    return moment().subtract(days * -1, 'days');
}
