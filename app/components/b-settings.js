import Ember from 'ember';

export default Ember.Component.extend({
    store: Ember.inject.service('store'),
    
    currentView: 'accounts',
    
    init() {
        this._super(...arguments);
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
                console.log(`Added account ${newAccount.get('name')}`);
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
