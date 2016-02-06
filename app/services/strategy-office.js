import Ember from 'ember';
import moment from 'moment';
import { Mixin, Debug } from '../mixins/debugger';

export default Ember.Service.extend(Mixin, {
    store: Ember.inject.service(),

    oa2: {
        clientID: 'b5f61636-8c63-4a7c-b4a3-6af6df33ad15',
        //clientSecret: 'vroVRihjX7S6T7135Cv5odz',
        base: 'https://login.microsoftonline.com/common',
        authUrl: '/oauth2/v2.0/authorize',
        tokenUrl: '/oauth2/v2.0/token',
        scopes: ['openid', 'https://outlook.office.com/Calendars.read']
    },

    init() {
        this._super(...arguments);
        this.set('debugger', new Debug('Sync Office'));
    },

    addAccount() {
        return new Ember.RSVP.Promise((resolve, reject) => {
            this.authenticate().then((response) => {
                if (!response || !response.id_token) return;

                const newAccount = this.get('store').createRecord('account', {
                    name: 'Office 365',
                    username: this.getEmailFromToken(response.id_token),
                    strategy: 'office',
                    oauth: response
                }).save();

                resolve(newAccount);
            }).catch(err => reject(err));
        });
    },

    getCalendarView(startDate, endDate, account, syncOptions) {
        return new Ember.RSVP.Promise((resolve) => {
            startDate = moment(startDate).toISOString();
            endDate = moment(endDate).toISOString();

            const baseUrl = `https://outlook.office.com/api/v2.0/users/${account.get('username')}/calendarview`;
            const oauth = account.get('oauth');
            const url = `${baseUrl}?startDateTime=${startDate}&endDateTime=${endDate}`;

            return this._fetchEvents(url, oauth.access_token, syncOptions, account)
                .then((events, deltaToken) => {
                    resolve(events, deltaToken);
                })
                .catch((error) => {
                    this.notifications.error('O365 account corrupted, please delete and add again');
                });
        });
    },

    getEmailFromToken(token) {
        if (!token) return null;

        const tokenParts = token.split('.');
        const encodedToken = new Buffer(tokenParts[1].replace('-', '_').replace('+', '/'), 'base64');
        const decodedToken = encodedToken.toString();
        const jwt = JSON.parse(decodedToken);

        return jwt.preferred_username;
    },

    authenticate(silent) {
        return new Ember.RSVP.Promise((resolve, reject) => {
            const BrowserWindow = require('electron').remote.BrowserWindow;
            const response = (this.oa2.clientSecret) ? '&response_type=code' : '&response_type=id_token+token';
            const redirect = '&redirect_uri=https%3A%2F%2Fredirect.butter';
            const scopes = '&scope=' + this.oa2.scopes.join(' ');
            const client = '?client_id=' + this.oa2.clientID;
            const nonce = (this.oa2.clientSecret) ? '' : '&response_mode=fragment&state=12345&nonce=678910';
            const prompt = (silent) ? '&prompt=none' : '';
            const authUrl = this.oa2.base + this.oa2.authUrl + client + response + scopes + redirect + prompt + nonce;

            let authWindow = new BrowserWindow({ width: 800, height: 600, show: false, 'node-integration': false });

            authWindow.loadURL(authUrl);

            if (!silent) {
                authWindow.show();
            }

            authWindow.webContents.on('will-navigate', (event, url) => {
                return this._handleCallback(url, authWindow, resolve, reject);
            });
            authWindow.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
                return this._handleCallback(newUrl, authWindow, resolve, reject);
            });

            authWindow.on('close', () => {
                authWindow = null;
                reject();
            }, false);
        });
    },

    _fetchEvents(url, token, syncOptions, account) {
        return new Ember.RSVP.Promise((resolve) => {
            let events = [], occurences = [], masters = [],
                firstUrl = url,
                deltaToken;

            if (syncOptions.useDelta && account.get('sync.deltaToken')) {
                firstUrl += `&$deltatoken=${account.get('sync.deltaToken')}`;
            }

            const fetch = (_url, _token, _trackChanges) => {
                this.log('Fetching events');
                const header = _trackChanges ? { Prefer: 'odata.track-changes, odata.maxpagesize=200' } : { Prefer: 'odata.maxpagesize=200'};

                return this._makeApiCall(_url, _token, header).then((response) => {
                    if (!response || !response.ok || !response.body) reject(response);
                    response.body.value.forEach((item) => {
                        if (item.Type === 'SeriesMaster') {
                            masters.push(item);
                        }

                        if (item.Type === 'Occurrence') {
                            return occurences.push(item);
                        }

                        events.push(this._makeEvent(item));
                    });

                    if (response.body['@odata.nextLink']) {
                        return fetch(response.body['@odata.nextLink'], _token, false);
                    } else if (syncOptions.trackChanges && response.body['@odata.deltaLink']) {
                        deltaToken = this._findDeltaToken(response) || deltaToken;
                        return fetch(response.body['@odata.deltaLink'], _token, false);
                    } else {
                        // Process all instances before returning
                        occurences.forEach((instance) => events.push(this._makeEventFromOccurence(instance, masters)));

                        this.log('Done fetching events');
                        return resolve({events, deltaToken});
                    }
                }).catch((err, response) => {
                    const er = err.response || {};
                    if (er.statusCode && er.statusCode === 401) {
                        this.log('Office 365: Token probably expired, fetching new token');
                        return this._updateToken(account)
                            .then(newToken => { return fetch(_url, newToken) })
                            .catch(error => { this.log('Office 365: Attempted to getCalendarView', error) });
                    } else if (er.statusCode && er.statusCode === 410) {
                        this.log('Office 365: Sync Status not found, refetching');
                        return fetch(url, _token, true);
                    } else {
                        this.log('Office 365: Unknown error during api call:');
                        console.log(err, response);
                    }
                });
            }

            fetch(firstUrl, token, syncOptions.trackChanges);
        });
    },

    _makeEvent(inputEvent) {
        const start = moment(new Date(inputEvent.Start.DateTime + 'Z'));
        const end = moment(new Date(inputEvent.End.DateTime + 'Z'));
        const isAllDay = (inputEvent.IsAllDay || !start.isSame(end, 'day')) ? true : false;

        let event = {
            start: start.format(),
            end: end.format(),
            title: inputEvent.Subject,
            providerId: inputEvent.Id,
            showAs: inputEvent.showAs,
            isEditable: false,
            isAllDay: isAllDay
        }

        return event;
    },

    _makeEventFromOccurence(occurence, masters) {
        const master = masters.find((item) => { return (item.Id === occurence.SeriesMasterId) });

        if (master) {
            occurence.Subject = master.Subject;
            occurence.Body = master.Body;
            occurence.IsAllDay = master.IsAllDay;
        }

        return this._makeEvent(occurence);
    },

    /**
     * Takes a O365 API response and extracts the deltaToken, if present
     * @param  {Object} response O365 API Response
     * @return {string} deltaToken
     */
    _findDeltaToken(response) {
        if (!response || !response.body['@odata.deltaLink']) {
            return null;
        }

        let tokenPosition = response.body['@odata.deltaLink'].lastIndexOf('deltatoken=');
        return response.body['@odata.deltaLink'].slice(tokenPosition + 11);
    },

    _makeApiCall(url, token, headerExtras) {
        return new Ember.RSVP.Promise((resolve, reject) => {
            const superagent = require('superagent');

            let header = {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/json',
                'User-Agent': 'butter/dev'
            };

            if (headerExtras) {
                Ember.$.extend(header, headerExtras);
            }

            superagent
            .get(url)
            .set(header)
            .end((error, response) => {
                if (response && response.ok) {
                    resolve(response);
                } else {
                    reject({error, response});
                }
            });
        })
    },

    _requestToken(code) {
        const tokenUrl = this.oa2.base + this.oa2.tokenUrl;
        const superagent = require('superagent');

        return new Ember.RSVP.Promise((resolve, reject) => {
            superagent
            .post(tokenUrl)
            .type('form')
            .send(`client_id=${this.oa2.clientID}`)
            .send(`client_secret=${this.oa2.clientSecret}`)
            .send(`code=${code}`)
            .send('redirect_uri=https%3A%2F%2Fredirect.butter')
            .send('grant_type=authorization_code')
            .end((error, response) => {
                if (response && response.ok && response.body) {
                    resolve(response.body);
                } else {
                    reject({error, response});
                }
            });
        });
    },

    _updateToken(account) {
        return new Ember.RSVP.Promise((resolve, reject) => {
            const oauth = account.get('oauth');

            return this._requestToken(oauth.code)
                .then((response) => {
                    // TODO: Error handling
                    const newOauth = response;
                    newOauth.code = account.get('oauth').code;

                    account.set('oauth', oauth).save();
                    resolve(response.access_token);
                })
                .catch((error) => {
                    if (error.response && error.response.body) {
                        // Check if the code is expired, too
                        const errBody = error.response.body
                        if (errBody.error_description && errBody.error_description.includes('AADSTS70008')) {
                            // Let's authenticate the current account - again
                            this.log('Office 365: Tried fetching new token, but code seems to be expired, too.');
                            this._reauthenticate(account);
                            reject(new Error('code expired'));
                        }
                    } else {
                        reject(error);
                    }
                });
        });
    },

    _handleCallback(url, win, resolve, reject) {
        const raw_code = /code=([^&]*)/.exec(url) || null;
        const raw_token = /access_token=([^&]*)/.exec(url) || null;
        const raw_id= /id_token=([^&]*)/.exec(url) || null;
        const code = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
        const token = (raw_token && raw_token.length > 1) ? raw_token[1] : null;
        const id = (raw_id && raw_id.length > 1) ? raw_id[1] : null;
        const err = /\?error=(.+)$/.exec(url);

        if (code || err || token) {
            win.destroy();

            if (code) {
                this._requestToken(code).then((response) => {
                    response.code = code;
                    resolve(response);
                });
            } else if (token) {
                resolve({
                    id_token: id,
                    access_token: token
                });
            } else if (err) {
                reject(err);
            }
        }
    },

    _reauthenticate(account) {
        return new Ember.RSVP.Promise((resolve, reject) => {
            this.authenticate(silent).then((response) => {
                if (!response) return;

                account.setProperties({
                    name: 'Office 365',
                    username: response.id_token ? this.getEmailFromToken(response.id_token) : 'O365',
                    strategy: 'office',
                    oauth: response
                });
                account.save();

                resolve(account);
            }).catch((err) => reject(err));
        });
    },

    _reauthenticateAfterWarning(account) {
        return new Ember.RSVP.Promise((resolve, reject) => {
            this.notifications.error(`Your credentials for ${account.get('username')} expired. Click to reauthenticate.`, {
                autoClear: true,
                clearDuration: 3000,
                onClick: (notification) => {
                    this.authenticate()
                        .then((response) => {
                            if (!response) return;

                            account.setProperties({
                                name: 'Office 365',
                                username: response.id_token ? this.getEmailFromToken(response.id_token) : 'O365',
                                strategy: 'office',
                                oauth: response
                            });
                            account.save();

                            resolve(account);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                }
            });
        });
    }
});
