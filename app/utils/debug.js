export default class Debug {
    constructor(moduleName) {
        this.moduleName = moduleName;
        this.color = this._createColor(),
        this.padLength = 18
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
