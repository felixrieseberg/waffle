import Ember from 'ember';
import { Mixin, Debug } from '../mixins/debugger';

export default Ember.Component.extend(Mixin, {
    store: Ember.inject.service('store'),
    synchro: Ember.inject.service(),

    currentView: 'accounts',

    init() {
        this._super(...arguments);
        this.set('debugger', new Debug('Settings'));
        this.send('switchToPreferences');
    },

    accounts: Ember.computed({
        get() {
            return this.get('store').findAll('account');
        }
    }),

    strategies: Ember.computed({
        get() {
            // TODO: Query for strategies
            return [{
                name: 'Office 365',
                shortname: 'office'
            }];
        }
    }),

    actions: {
        addAccount(strategy) {
            if (!strategy || strategy.length < 1) {
                return;
            }

            this.get(`strategy:${strategy}`).addAccount().then((newAccount) => {
                this.log(`Added account ${newAccount.get('name')}`);
                this.get('synchro').synchronizeAccount(newAccount, true);
            });
        },

        removeAccount(account) {
            account.deleteRecord();

            // TODO: Implement undo
            account.save();
        },

        toggleVisibility() {
            this.toggleProperty('isEnabled');
        },

        switchToAccounts() {
            this.set('isAccounts', true);
            this.set('isPreferences', false);
        },

        switchToPreferences() {
            this.set('isAccounts', false);
            this.set('isPreferences', true);
        }
    }
});
