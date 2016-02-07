export function processArrayAsync(array, fn, chunk, context) {
    return new Promise((resolve, reject) => {
        if (!array || !array.length) return reject();
        if (array.length === 0) return resolve();

        const _context = context || window;
        const _chunk = chunk || 25;
        let index = 0;

        function doChunk() {
            let cnt = _chunk;

            while (cnt-- && index < array.length) {
                // callback called with args (value, index, array)
                fn.call(_context, array[index], index, array);
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
