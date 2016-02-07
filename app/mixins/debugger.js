import Ember from 'ember';
import Debug from '../utils/debug';

const Mixin = Ember.Mixin.create({
    log(content) {
        if (!process.env.debug) return;

        this._ensureDebugger();
        this.get('debugger').log(content);
    },

    time(name) {
        if (!process.env.debug) return;

        this._ensureDebugger();
        this.get('debugger').time(name);
    },

    timeEnd(name) {
        if (!process.env.debug) return;

        this._ensureDebugger();
        this.get('debugger').timeEnd(name);
    },

    _ensureDebugger() {
        if (!this.get('debugger')) {
            this.set('debugger', new Debug(this.toString()));
        }
    }
});

export { Mixin as Mixin };
export { Debug as Debug };
