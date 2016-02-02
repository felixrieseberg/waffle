export default class Debug {
    constructor(moduleName) {
        this.moduleName = moduleName;
        this.color = this._createColor(),
        this.padLength = 18
        this.timerStore = [];
        process.env.debug = true;
    }

    log(content) {
        if (process.env.debug) {
            const colorString = `color: ${this.color}; font-weight: bold;`
            let titleContent = (this.moduleName.slice(0, this.padLength));
            titleContent += Array(this.padLength + 3 - this.moduleName.length).join(' ') + '|';
            const title = '%c' + titleContent;
            return console.log(title, colorString, content);
        }
    }

    timeEnd(name) {
        const start = Date.now();
        let foundIndex;

        const runningTimer = this.timerStore.find((item, index) => {
            if (item.name == name) {
                foundIndex = index;
                return true;
            }
        });

        if (runningTimer) {
            this.timerStore.splice(foundIndex, 1);
            this.log(`${name} took ${start - runningTimer.start}ms`);
        }
    }

    time(name) {
        this.timerStore.push({ start: Date.now(), name });
    }

    _createColor() {
        let h = this._random(1, 360);
        let s = this._random(60, 100);
        let l = this._random(60, 100);
        return 'hsl(' + h + ',' + s + '%,' + l + '%)';
    }

    _random(min, max) {
        return min + Math.random() * (max - min);
    }
}
