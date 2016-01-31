import Ember from 'ember';
import Debug from '../utils/debug';

const Mixin = Ember.Mixin.create({
    log(content) {
        if (!this.get('debugger')) {
            this.set('debugger', new Debug(this.toString()));
        }

        return this.get('debugger').log(content);
    }
});

export { Mixin as Mixin };
export { Debug as Debug };
