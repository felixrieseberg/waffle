
import Ember from 'ember';
import moment from 'moment';
import { Mixin, Debug } from '../mixins/debugger';

export default Ember.Service.extend(Mixin, {
    store: Ember.inject.service(),

    oa2: {
        clientID: '1007908240432-bmj6cc5290j6u61jn4md0ippjn61fg8u.apps.googleusercontent.com',
        base: 'https://accounts.google.com/o',
        authUrl: '/oauth2/v2/auth',
        tokenInfoUrl: 'https://www.googleapis.com/oauth2/v3/tokeninfo',
        scopes:[
          'profile',
          'email',
          'https://www.googleapis.com/auth/calendar',
        ],
        redirectURI: 'https://google.com'
    },

    api: {
        preferTrack: {
            Prefer: 'odata.track-changes, odata.maxpagesize=200'
        },
        prefer: {
            Prefer: 'odata.maxpagesize=200'
        },
        base: 'https://www.googleapis.com/calendar/v3/calendars/primary',
        events: '/events'
    },

    init() {
        this._super(...arguments);
        this.set('debugger', new Debug('Sync Google'));
    },

    addAccount() {
        return new Promise((resolve, reject) => {
            this.authenticate().then(
              (response) => {
                if (!response || !response.email) return;

                const newAccount = this.get('store').createRecord('account', {
                    name: 'Google',
                    username: response.email,
                    strategy: 'google',
                    oauth: response
                }).save();

                resolve(newAccount);
              },
              (reason) => {
                console.log(reason);
              }
          ).catch(err => reject(err));
        });
    },

    getCalendarView(startDate, endDate, account, syncOptions) {
        return new Promise((resolve) => {
            var URI = require('urijs');
            const start = moment(startDate).toISOString();
            const end = moment(endDate).toISOString();

            const oauth = account.get('oauth');

            const url = URI(this.api.base + this.api.events);

            url.setQuery({
              timeMax: end,
              timeMin: start
            });

            return this._fetchEvents(url.toString(), oauth.access_token, syncOptions, account)
                .then((events, deltaToken) => {
                    resolve(events, deltaToken);
                });
        });
    },

    authenticate(existingUser) {
        return new Promise((resolve, reject) => {
            const BrowserWindow = require('electron').remote.BrowserWindow;
            const authUrl = this._makeAuthURI(existingUser);

            let authWindow = new BrowserWindow({
                width: 800,
                height: 600,
                show: false,
                'node-integration': false
            });

            authWindow.loadURL(authUrl.toString());

            if (!existingUser) {
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

    _makeAuthURI(existingUser) {
      const uri = require('urijs');
      const authUrl = uri(this.oa2.base + this.oa2.authUrl);
      const scopes = this.oa2.scopes.join(' ');

      authUrl.setQuery({
        redirect_uri: this.oa2.redirectURI,
        response_type: 'token',
        client_id: this.oa2.clientID,
        state: '12345',
        scope: scopes,
      });

      // If we've got an existing user and need
      // to reauthenticate, there's probably no need
      // for a prompt.
      if (existingUser) {
        authUrl.setQuery({
          prompt: 'none',
          login_hint: existingUser,
        });
      }

      return authUrl;
    },

    _fetchEvents(url, token, syncOptions, account) {
        const URI = require('urijs');

        return new Promise((resolve, reject) => {
            const events = [];
            const occurences = [];
            const masters = [];

            let firstUrl = url;
            let deltaToken;

            // If we're synchronizing, use the delta token saved down.
            if (syncOptions.useDelta && account.get('sync.deltaToken')) {
                const urlWithDelta = URI(firstUrl).setQuery({
                  syncToken: account.get('sync.deltaToken'),
                })

                firstUrl = urlWithDelta.toString()
            }

            const fetch = (_url, _token, _trackChanges) => {
                const header = _trackChanges ? this.api.preferTrack : this.api.prefer;
                this.log('Fetching events');

                return this._makeApiCall(_url, _token, header).then((response) => {
                    if (!response || !response.ok || !response.body) reject(response);

                    response.body.items.forEach(item => {
                      // Currently ignoring recurring events.
                      events.push(this._makeEvent(item));
                    });

                    if (syncOptions.trackChanges && response.body.nextSyncToken) {
                      deltaToken = response.body.nextSyncToken;
                    }

                    this.log('Done fetching events');

                    return resolve({
                      events,
                      deltaToken
                    });
                }).catch((err, response) => {
                    const er = err.response || {};

                    if (er.statusCode && er.statusCode === 401) {
                        this.log('Google: Token probably expired, fetching new token');
                        return this._reauthenticate(account)
                            .then(newToken => fetch(_url, newToken))
                            .catch(error => {
                                this.log('Google: Attempted to getCalendarView', error);
                            });
                    } else if (er.statusCode && er.statusCode === 410) {
                        this.log('Google: Sync Status not found, refetching');
                        return fetch(url, _token, true);
                    }

                    this.log('Google: Unknown error during api call:');
                    this.log(err, response);
                });
            };

            fetch(firstUrl, token, syncOptions.trackChanges);
        });
    },

    _makeEvent(ev) {
        const start = moment(new Date(ev.start.date + 'Z'));
        const end = moment(new Date(ev.end.date + 'Z'));
        const isAllDay = !start.isSame(end, 'day');
        const location = ev.location ? ev.location : '';
        const organizer = (ev.organizer && ev.organizer.email) ? ev.organizer.email : '';
        const isOrganizer = (
          ev.organizer &&
          ev.organizer.email &&
          ev.creator &&
          ev.creator.email &&
          ev.creator.email === ev.organizer.email
        );

        return {
            start: start.format(),
            end: end.format(),
            title: ev.summary,
            providerId: ev.id,
            body: ev.description ? ev.description : '',
            bodyPreview: ev.description ? ev.description : '',
            bodyType: '',
            showAs: '',
            isEditable: false,
            isOrganizer: isOrganizer,
            isReminderOn: Boolean(ev.reminders),
            isCancelled: false,
            organizer,
            location,
            isAllDay
        };
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

    _handleCallback(url, win, resolve, reject) {
        const URI = require('urijs');

        const urlFragment = URI(url).fragment();
        const rawToken = /access_token=([^&]*)/.exec(urlFragment) || null;
        const token = (rawToken && rawToken.length > 1) ? rawToken[1] : null;

        if (!token) {
          reject('Missing token');
          return;
        }

        win.destroy();

        this._validateToken(token).then(
          (response) => {
            const _response = response;

            resolve({
              email: response.email,
              access_token: token
            })
          }
        )
    },

    _validateToken(token) {
      return new Promise((resolve, reject) => {
        const superagent = require('superagent');
        const URI = require('urijs');
        const header = {
            Accept: 'application/json',
            'User-Agent': 'butter/dev'
        };

        const url = URI(this.oa2.tokenInfoUrl).setQuery('access_token', token);

        superagent
          .get(url.toString())
          .set(header)
          .end((error, response) => {
            if (response && response.ok) {
              const jsonData = JSON.parse(response.text);

              // Confused deputy check.
              if (jsonData.aud != this.oa2.clientID) {
                  reject('Audience does not match configured client ID');
                  return;
              }

              resolve(jsonData);
            } else {
              reject({
                error,
                response
              });
            }
          });
      });
    },

    /**
     * Reauthenticates a given account, essentially quietly opening a new
     * window and hoping that O365/Microsoft lets us in without the user
     * having to confirm anything
     * @param  {object} account O365 account to fetch new token for
     * @return {Promise}
     */
    _reauthenticate(account) {
        return new Promise((resolve, reject) => {
            this.authenticate(account.get('username')).then((response) => {
                if (!response || !response.access_token) reject('No response received');

                account.setProperties({
                    name: 'google',
                    username: response.email,
                    strategy: 'google',
                    oauth: response
                });
                account.save();

                resolve(response.access_token);
            }).catch((err) => {
                console.log(err);
                reject(err);
            });
        });
    }
});
