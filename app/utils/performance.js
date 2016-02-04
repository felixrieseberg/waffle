import Ember from 'ember';

export function processArrayAsync(array, fn, chunk, context) {
    return new Ember.RSVP.Promise((resolve, reject) => {
        if (!array || !array.length) return reject();
        if (array.length === 0) return resolve();

        context = context || window;
        chunk = chunk || 25;
        let index = 0;

        function doChunk() {
            let cnt = chunk;

            while (cnt-- && index < array.length) {
                // callback called with args (value, index, array)
                fn.call(context, array[index], index, array);
                ++index;
            }

            if (index < array.length) {
                // set Timeout for async iteration
                setTimeout(doChunk, 1);
            } else {
                resolve();
            }
        }

        doChunk();
    });
}
