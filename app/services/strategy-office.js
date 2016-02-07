import Ember from 'ember';
import moment from 'moment';
import { Mixin, Debug } from '../mixins/debugger';

export default Ember.Service.extend(Mixin, {
    store: Ember.inject.service(),

    oa2: {
        clientID: 'b5f61636-8c63-4a7c-b4a3-6af6df33ad15',
        base: 'https://login.microsoftonline.com/common',
        authUrl: '/oauth2/v2.0/authorize',
        tokenUrl: '/oauth2/v2.0/token',
        scopes: ['openid', 'https://outlook.office.com/Calendars.read']
    },

    api: {
        preferTrack: {
            Prefer: 'odata.track-changes, odata.maxpagesize=200'
        },
        prefer: {
            Prefer: 'odata.maxpagesize=200'
        },
        base: 'https://outlook.office.com/api/v2.0/'
    },

    init() {
        this._super(...arguments);
        this.set('debugger', new Debug('Sync Office'));
    },

    addAccount() {
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve) => {
            const start = moment(startDate).toISOString();
            const end = moment(endDate).toISOString();

            const base = `${this.api.base}users/${account.get('username')}/calendarview`;
            const oauth = account.get('oauth');
            const url = `${base}?startDateTime=${start}&endDateTime=${end}`;

            return this._fetchEvents(url, oauth.access_token, syncOptions, account)
                .then((events, deltaToken) => {
                    resolve(events, deltaToken);
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
        return new Promise((resolve, reject) => {
            const BrowserWindow = require('electron').remote.BrowserWindow;
            const resp = (this.oa2.clientSecret) ? '&response_type=code' : '&response_type=id_token+token';
            const red = '&redirect_uri=https%3A%2F%2Fredirect.butter';
            const scope = '&scope=' + this.oa2.scopes.join(' ');
            const client = '?client_id=' + this.oa2.clientID;
            const nonce = (this.oa2.clientSecret) ? '' : '&response_mode=fragment&state=12345&nonce=678910';
            const prompt = (silent) ? '&prompt=none' : '';
            const authUrl = this.oa2.base + this.oa2.authUrl + client + resp + scope + red + prompt + nonce;

            let authWindow = new BrowserWindow({
                width: 800,
                height: 600,
                show: false,
                'node-integration': false
            });

            authWindow.loadURL(authUrl);

            if (!silent) {
                authWindow.show();
            }

            authWindow.webContents.on('will-navigate', (event, url) => {
                this._handleCallback(url, authWindow, resolve, reject);
            });
            authWindow.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
                this._handleCallback(newUrl, authWindow, resolve, reject);
            });

            authWindow.on('close', () => {
                authWindow = null;
                reject();
            }, false);
        });
    },

    _fetchEvents(url, token, syncOptions, account) {
        return new Promise((resolve, reject) => {
            const events = [];
            const occurences = [];
            const masters = [];
            let firstUrl = url;
            let deltaToken;

            if (syncOptions.useDelta && account.get('sync.deltaToken')) {
                firstUrl += `&$deltatoken=${account.get('sync.deltaToken')}`;
            }

            const fetch = (_url, _token, _trackChanges) => {
                const header = _trackChanges ? this.api.preferTrack : this.api.prefer;
                this.log('Fetching events');

                return this._makeApiCall(_url, _token, header).then((response) => {
                    if (!response || !response.ok || !response.body) reject(response);
                    response.body.value.forEach(item => {
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
                    }

                    // Process all instances before returning
                    occurences.forEach(inst => events.push(this._makeEventFromOccurence(inst, masters)));

                    this.log('Done fetching events');
                    return resolve({
                        events,
                        deltaToken
                    });
                }).catch((err, response) => {
                    const er = err.response || {};

                    if (er.statusCode && er.statusCode === 401) {
                        this.log('Office 365: Token probably expired, fetching new token');
                        return this._updateToken(account)
                            .then(newToken => fetch(_url, newToken))
                            .catch(error => {
                                this.log('Office 365: Attempted to getCalendarView', error);
                            });
                    } else if (er.statusCode && er.statusCode === 410) {
                        this.log('Office 365: Sync Status not found, refetching');
                        return fetch(url, _token, true);
                    }

                    this.log('Office 365: Unknown error during api call:');
                    this.log(err, response);
                });
            };

            fetch(firstUrl, token, syncOptions.trackChanges);
        });
    },

    _makeEvent(inputEvent) {
        const start = moment(new Date(inputEvent.Start.DateTime + 'Z'));
        const end = moment(new Date(inputEvent.End.DateTime + 'Z'));
        const isAllDay = (inputEvent.IsAllDay || !start.isSame(end, 'day'));

        return {
            start: start.format(),
            end: end.format(),
            title: inputEvent.Subject,
            providerId: inputEvent.Id,
            showAs: inputEvent.showAs,
            isEditable: false,
            isAllDay
        };
    },

    _makeEventFromOccurence(occurence, masters) {
        const master = masters.find((item) => (item.Id === occurence.SeriesMasterId));
        const _occurence = occurence;

        if (master) {
            _occurence.Subject = master.Subject;
            _occurence.Body = master.Body;
            _occurence.IsAllDay = master.IsAllDay;
        }

        return this._makeEvent(_occurence);
    },

    /**
     * Takes a O365 API response and extracts the deltaToken, if present
     * @param  {Object} response O365 API Response
     * @return {string} deltaToken
     */
    _findDeltaToken(response) {
        if (!response || !response.body['@odata.deltaLink']) return null;

        const tokenPosition = response.body['@odata.deltaLink'].lastIndexOf('deltatoken=');
        return response.body['@odata.deltaLink'].slice(tokenPosition + 11);
    },

    _makeApiCall(url, token, headerExtras) {
        return new Promise((resolve, reject) => {
            const superagent = require('superagent');
            const header = {
                Authorization: 'Bearer ' + token,
                Accept: 'application/json',
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
                        reject({
                            error,
                            response
                        });
                    }
                });
        });
    },

    _requestToken(code) {
        const tokenUrl = this.oa2.base + this.oa2.tokenUrl;
        const superagent = require('superagent');

        return new Promise((resolve, reject) => {
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
                        reject({
                            error,
                            response
                        });
                    }
                });
        });
    },

    _updateToken(account) {
        return new Promise((resolve, reject) => {
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
                        const errBody = error.response.body;
                        if (errBody.error_description && errBody.error_description.includes('AADSTS70008')) {
                            // Let's authenticate the current account - again
                            this.log('Office 365: Tried fetching new token, but code seems to be expired.');
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
        const rawCode = /code=([^&]*)/.exec(url) || null;
        const rawToken = /access_token=([^&]*)/.exec(url) || null;
        const rawId = /id_token=([^&]*)/.exec(url) || null;
        const code = (rawCode && rawCode.length > 1) ? rawCode[1] : null;
        const token = (rawToken && rawToken.length > 1) ? rawToken[1] : null;
        const id = (rawId && rawId.length > 1) ? rawId[1] : null;
        const err = /\?error=(.+)$/.exec(url);

        if (code || err || token) {
            win.destroy();

            if (code) {
                this._requestToken(code)
                    .then((response) => {
                        const _response = response;
                        _response.code = code;
                        resolve(_response);
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
        return new Promise((resolve, reject) => {
            this.authenticate(true).then((response) => {
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
        const user = account.get('username');
        const error = `Your credentials for ${user} expired. Click to reauthenticate.`;

        this.notifications.error(error, {
            autoClear: true,
            clearDuration: 3000,
            onClick: this._reauthenticate(account)
        });
    }
});
