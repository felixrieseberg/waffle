import Ember from 'ember';
import { storageFor } from 'ember-local-storage';
import moment from 'moment';
import secrets from '../secrets';

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
            const token = account.get('oauth').access_token;
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
                    console.log(response);
                })
                .catch((error) => {
                    // Token expired?
                    console.log(account.get('oauth'));
                    return this._requestToken().then((response) => {
                        const oauth = response;
                        oauth.code = account.get('oauth').code;
                        
                        account.set('oauth', oauth);
                        
                        return this._makeApiCall(_url, _token);
                    });
                });
            }
            
            fetchEvents(url, token);
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
            .end((err, response) => {
                if (response && response.ok) {
                    resolve(response);
                } else {
                    // Error
                    console.log(err, response);
                    reject(err);
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
            .end((err, response) => {
                if (response && response.ok && response.body) {
                    resolve(response.body);
                } else {
                    // Error
                    console.log(err, response);
                    reject(err);
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
    }
});
