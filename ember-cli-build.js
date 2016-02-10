/*jshint node:true*/
/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var ENV = require('./config/environment');

module.exports = function (defaults) {
    const isTest = (process.env.EMBER_ENV || 'development') === 'test';
    const blacklist = isTest ? [] : [
        "es6.arrowFunctions",
        "es6.blockScoping",
        "es6.classes",
        "es6.forOf",
        "es6.templateLiterals",
        "es6.constants",
        "es6.properties.computed",
        "es6.properties.shorthand"
    ];

    var app = new EmberApp(defaults, {
        emberCliFontAwesome: {
            useScss: true
        },
        babel: {
            includePolyfill: true,
            blacklist: blacklist
        },
        hinting: false
    });


    app.import('bower_components/lato/font/lato-regular/lato-regular.ttf', { destDir: 'font/lato-regular' });
    app.import('bower_components/lato/font/lato-regular/lato-regular.eot', { destDir: 'font/lato-regular' });
    app.import('bower_components/lato/font/lato-regular/lato-regular.svg', { destDir: 'font/lato-regular' });
    app.import('bower_components/lato/font/lato-regular/lato-regular.woff2', { destDir: 'font/lato-regular' });

    app.import('bower_components/lato/font/lato-bold/lato-bold.ttf', { destDir: 'font/lato-bold' });
    app.import('bower_components/lato/font/lato-bold/lato-bold.eot', { destDir: 'font/lato-bold' });
    app.import('bower_components/lato/font/lato-bold/lato-bold.svg', { destDir: 'font/lato-bold' });
    app.import('bower_components/lato/font/lato-bold/lato-bold.woff2', { destDir: 'font/lato-bold' });

    app.import('bower_components/lato/font/lato-hairline/lato-hairline.ttf', { destDir: 'font/lato-hairline' });
    app.import('bower_components/lato/font/lato-hairline/lato-hairline.eot', { destDir: 'font/lato-hairline' });
    app.import('bower_components/lato/font/lato-hairline/lato-hairline.svg', { destDir: 'font/lato-hairline' });
    app.import('bower_components/lato/font/lato-hairline/lato-hairline.woff2', { destDir: 'font/lato-hairline' });

    app.import('bower_components/lato/font/lato-light/lato-light.ttf', { destDir: 'font/lato-light' });
    app.import('bower_components/lato/font/lato-light/lato-light.eot', { destDir: 'font/lato-light' });
    app.import('bower_components/lato/font/lato-light/lato-light.svg', { destDir: 'font/lato-light' });
    app.import('bower_components/lato/font/lato-light/lato-light.woff2', { destDir: 'font/lato-light' });

    app.import('bower_components/lato/font/lato-italic/lato-italic.ttf', { destDir: 'font/lato-italic' });
    app.import('bower_components/lato/font/lato-italic/lato-italic.eot', { destDir: 'font/lato-italic' });
    app.import('bower_components/lato/font/lato-italic/lato-italic.svg', { destDir: 'font/lato-italic' });
    app.import('bower_components/lato/font/lato-italic/lato-italic.woff2', { destDir: 'font/lato-italic' });

    app.import('bower_components/lato/font/lato-medium/lato-medium.ttf', { destDir: 'font/lato-medium' });
    app.import('bower_components/lato/font/lato-medium/lato-medium.eot', { destDir: 'font/lato-medium' });
    app.import('bower_components/lato/font/lato-medium/lato-medium.svg', { destDir: 'font/lato-medium' });
    app.import('bower_components/lato/font/lato-medium/lato-medium.woff2', { destDir: 'font/lato-medium' });

    app.import('bower_components/lato/font/lato-mediumitalic/lato-mediumitalic.ttf', { destDir: 'font/lato-mediumitalic' });
    app.import('bower_components/lato/font/lato-mediumitalic/lato-mediumitalic.eot', { destDir: 'font/lato-mediumitalic' });
    app.import('bower_components/lato/font/lato-mediumitalic/lato-mediumitalic.svg', { destDir: 'font/lato-mediumitalic' });
    app.import('bower_components/lato/font/lato-mediumitalic/lato-mediumitalic.woff2', { destDir: 'font/lato-mediumitalic' });

    app.import('bower_components/lato/font/lato-semibold/lato-semibold.ttf', { destDir: 'font/lato-semibold' });
    app.import('bower_components/lato/font/lato-semibold/lato-semibold.eot', { destDir: 'font/lato-semibold' });
    app.import('bower_components/lato/font/lato-semibold/lato-semibold.svg', { destDir: 'font/lato-semibold' });
    app.import('bower_components/lato/font/lato-semibold/lato-semibold.woff2', { destDir: 'font/lato-semibold' });

    app.import('bower_components/lato/font/lato-semibolditalic/lato-semibolditalic.ttf', { destDir: 'font/lato-semibolditalic' });
    app.import('bower_components/lato/font/lato-semibolditalic/lato-semibolditalic.eot', { destDir: 'font/lato-semibolditalic' });
    app.import('bower_components/lato/font/lato-semibolditalic/lato-semibolditalic.svg', { destDir: 'font/lato-semibolditalic' });
    app.import('bower_components/lato/font/lato-semibolditalic/lato-semibolditalic.woff2', { destDir: 'font/lato-semibolditalic' });

    // Use `app.import` to add additional libraries to the generated
    // output files.
    //
    // If you need to use different assets in different
    // environments, specify an object as the first parameter. That
    // object's keys should be the environment name and the values
    // should be the asset to use in that environment.
    //
    // If the library that you are including contains AMD or ES6
    // modules that you would like to import into your application
    // please specify an object with the list of modules as keys
    // along with the exports of each module as its value.

    return app.toTree();
};
