import Ember from 'ember';
import moment from 'moment';
import { Mixin, Debug } from '../mixins/debugger';

export default Ember.Service.extend(Mixin, {
    store: Ember.inject.service(),

    oa2: {
        clientID: '',
        clientSecret: '',
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

            return this._fetchEvents(url, oauth.access_token, syncOptions, account).then((events, deltaToken) => {
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

    authenticate() {
        return new Ember.RSVP.Promise((resolve, reject) => {
            const BrowserWindow = require('electron').remote.BrowserWindow;
            const authUrl = this.oa2.base + this.oa2.authUrl + '?client_id=' + this.oa2.clientID + '&response_type=code&scope=' + this.oa2.scopes.join(' ') + '&redirect_uri=https%3A%2F%2Fredirect.butter';

            let authWindow = new BrowserWindow({ width: 800, height: 600, show: false, 'node-integration': false });

            authWindow.loadURL(authUrl);
            authWindow.show();

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
            let events = [], deltaLink, deltaToken;

            if (syncOptions.useDelta) {
                let deltaToken = account.get('sync.deltaToken');
                deltaLink = url + `&deltatoken=${deltaToken}`;
            }

            const fetch = (_url, _token, _trackChanges) => {
                this.log('Fetching events');
                const header = _trackChanges ? { Prefer: 'odata.track-changes, odata.maxpagesize=200' } : { Prefer: 'odata.maxpagesize=200'};

                return this._makeApiCall(_url, _token, header).then((response) => {
                    if (!response || !response.ok || !response.body) reject(response);
                    response.body.value.forEach((item) => {
                        let event = {
                            start: moment(item.Start.DateTime + 'Z').format(),
                            end: moment(item.End.DateTime + 'Z').format(),
                            title: item.Subject,
                            editable: false,
                            providerId: item.Id
                        };

                        if (trackChanges && item.Reason) {
                            event.deleted = true
                        }

                        events.push(event);
                    });

                    console.log(response);

                    if (response.body['@odata.nextLink']) {
                        return fetch(response.body['@odata.nextLink'], _token, false);
                    } else if (trackChanges && response.body['@odata.deltaLink']) {
                        deltaToken = this._findDeltaToken(response) || deltaToken;
                        return fetch(response.body['@odata.deltaLink'], _token, false);
                    } else {
                        this.log('Done fetching events');
                        return resolve(events, deltaToken);
                    }
                }).catch((err, response) => {
                    if (err && err.response && err.response.statusCode === 401) {
                        this.log('Office 365: Token probably expired, fetching new token');
                        return this._updateToken(account)
                            .then(newToken => { return fetch(_url, newToken) })
                            .catch(error => { this.log('Office 365: Attempted to getCalendarView', error) });
                    } else {
                        this.log('Office 365: Unknown error during api call:');
                        console.log(err, response);
                    }
                });
            }

            fetch(deltaLink, token, syncOptions.trackChanges);
        });
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

        console.log(response.body['@odata.deltaLink']);

        let tokenPosition = response.body['@odata.deltaLink'].indexOf('deltatoken=');

        console.log(response.body['@odata.deltaLink'].slice(tokenPosition + 11));
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
                            this._reauthenticateAfterWarning(account);
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
        const code = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
        const err = /\?error=(.+)$/.exec(url);

        if (code || err) {
            win.destroy();

            if (code) {
                this._requestToken(code).then((response) => {
                    response.code = code;
                    resolve(response);
                });
            }

            if (err) {
                reject(err);
            }
        }
    },

    _reauthenticateAfterWarning(account) {
        return new Ember.RSVP.Promise((resolve, reject) => {
            this.notifications.error(`Your credentials for ${account.get('username')} expired. Click to reauthenticate.`, {
                autoClear: true,
                clearDuration: 3000,
                onClick: (notification) => {
                    this.authenticate()
                        .then((response) => {
                            if (!response || !response.id_token) {
                                return;
                            }

                            account.setProperties({
                                name: 'Office 365',
                                username: this.getEmailFromToken(response.id_token),
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
