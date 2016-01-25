import Ember from 'ember';
import moment from 'moment';

export default Ember.Service.extend({
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
    },

    addAccount() {
        return new Ember.RSVP.Promise((resolve, reject) => {
            this.authenticate()
                .then((response) => {
                    if (!response || !response.id_token) {
                        return;
                    }

                    const newAccount = this.get('store').createRecord('account', {
                        name: 'Office 365',
                        username: this.getEmailFromToken(response.id_token),
                        strategy: 'office',
                        oauth: response
                    }).save();

                    resolve(newAccount);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },

    getCalendarView(startDate, endDate, account) {
        return new Ember.RSVP.Promise((resolve, reject) => {
            startDate = moment(startDate).toISOString();
            endDate = moment(endDate).toISOString();

            const baseUrl = 'https://outlook.office.com/api/v2.0/me/calendarview';
            const url = `${baseUrl}?startDateTime=${startDate}&endDateTime=${endDate}`
            const oauth = account.get('oauth');
            const tz = moment.tz.guess();

            const events = [];
            const fetchEvents = (_url, _token) => {
                this._makeApiCall(_url, _token)
                    .then((response) => {
                        if (!response || !response.ok || !response.body) {
                            return;
                        }

                        response.body.value.forEach((item) => {
                            events.push({
                                start: moment(item.Start.DateTime + 'Z').format(),
                                end: moment(item.End.DateTime + 'Z').format(),
                                title: item.Subject,
                                editable: false
                            });
                        });

                        if (response.body['@odata.nextLink']) {
                            fetchEvents(response.body['@odata.nextLink'], _token);
                        } else {
                            resolve(events);
                        }
                    })
                    .catch((err) => {
                        if (err && err.response && err.response.statusCode === 401) {
                            console.log('Office 365: Token probably expired, fetching new token');
                            return this._updateToken(account)
                                .then((newToken) => {
                                    return fetchEvents(_url, newToken);
                                })
                                .catch((error) => {
                                   console.log('Office 365: Attempted to getCalendarView', error); 
                                });
                        } else {
                            console.log('Office 365: Unknown error during api call:', err);
                        }
                    });
            }

            fetchEvents(url, oauth.access_token);
        });
    },

    getEmailFromToken(token) {
        if (!token) {
            return null;
        }

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

    _makeApiCall(url, token) {
        return new Ember.RSVP.Promise((resolve, reject) => {
            const superagent = require('superagent');

            superagent
            .get(url)
            .set({
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/json',
                'User-Agent': 'butter/dev'
            })
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
                            console.log('Office 365: Tried fetching new token, but code seems to be expired, too.');
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
                onClick: (notification) => {
                    notification.close();
                    
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
