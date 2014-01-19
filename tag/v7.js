// ==ClosureCompiler==
// @output_file_name v7.min.js
// @compilation_level ADVANCED_OPTIMIZATIONS
// ==/ClosureCompiler==

/* To Compile:
    java -jar <path to compiler.jar> \
    --accept_const_keyword \
    --compilation_level ADVANCED_OPTIMIZATIONS \
    --define EXPOSE=false \
    --js tag/v7.js \
    --use_types_for_optimization > tag/v7.min.js
*/

/** @define {boolean} */
var SINGLE_MODE = true;

/** @define {boolean} */
var EXPOSE = true;

(function(window, document) {

/** 
    Mobify Global Object

    @namespace
    @expose
*/

var Mobify = window['Mobify'] = {};

/** 
    Mobify.Tag Global Object
    
    @namespace
    @expose
*/
var Tag = Mobify['Tag'] = {};

var Private = {};
EXPOSE && (Tag['Private'] = Private);


/** Single Options Type
    
    @typedef {{
        capture: ?boolean, 
        url: string,
        postload: ?function(),
        preload: ?function()
    }}
*/
Tag.singleOptionsType;

/** 
    Mobify.points records timing information. We record
    time-to-first byte in the tag.
    This property is required by Mobify.js

    @expose
    @type {Array.<number>}
*/
Mobify['points'] = [+(new Date())];

/** 
    Tag.tagVersion is the current tag version.
    This property is required by Mobify.js

    @expose
    @type {Array.<number>}
*/
Mobify['tagVersion'] = [7, 0];

/** 
    Tag.userAgent is the current user agent.
    We store it here so it can easily be override for testing purporses.

    @expose
    @type {string}
*/
Tag['userAgent'] = window.navigator.userAgent;

/** 
    previewUrl is preview API endpoint.
    
    @const
    @private
    @type {string}
*/
var previewUrl = "https://preview.mobify.com/v7/";
Private['previewUrl'] = previewUrl;

/** loadScript loads a script with attributes in `options`
    asynchronously. The script is inserted in the DOM before the Mobify
    tag.

    TODO: Write type for options?

    @private
    @param {!Object} options properties to assign to script
    @param {string=} klass class attribute to assign to element
    @type {null}
*/
var loadScript = function(options, klass) {
    var mobifyTagScript = document.getElementsByTagName('script')[0];

    var script = document.createElement('script');
    for (var prop in options) {
        script[prop] = options[prop];
    }
        
    if (klass) {
        script.setAttribute("class", klass);
    }
    mobifyTagScript.parentNode.insertBefore(script, mobifyTagScript);
};
Private['loadScript'] = loadScript;

/**
    startCapture begins the capturing process, and at the end
    calls the callback.

    @private
    @param {function()} callback callback to call after capturing has begun
    @type {null}
*/
var startCapture = function(callback) {
    document.write('<plaintext style="display:none">');

    setTimeout(function() {
        /** @expose */
        Mobify['capturing'] = true;

        callback();
    }, 0);
};

Private['startCapture'] = startCapture;

/**
    getCookie fetches the values of a cookie by the given `name`
    Returns `undefined` if no cookie matches.

    @private
    @param {string} name name of cookie to fetch.
    @type {string|null}
*/
var getCookie = function(name) {
    // Internet Explorer treats empty cookies differently, it does
    // not include the '=', so our regex has to be extra complicated.
    var re = new RegExp("(^|; )" + name + "((=([^;]*))|(; |$))");
    var match = document.cookie.match(re);
    if (match) {
        return match[4] || '';
    }
};

Private['getCookie'] = getCookie;

/** 
    isDisabled checks if we are *completely* disabled.
    If so, we don't capture nor load any scripts.

    @private
    @type {boolean}
*/
var isDisabled = function() {
    // We have to check for strict equals, because if it returns
    // undefined it means there was no cookie.
    return getCookie('mobify-path') === '';
};

Private['isDisabled'] = isDisabled;

/**
    isPreview checks to see if we need to load the preview API.
    @private
    @type {boolean}
*/
var isPreview = function() {
    return (getCookie("mobify-path") == 'true' || 
            /mobify-path=true/.test(window.location.hash));
};

Private['isPreview'] = isPreview;

/**
    loadPreview loads the preview API.

    @private
    @type {null}
*/
var loadPreview = function() {
    loadScript({
        src: previewUrl
    });
};

Private['loadPreview'] = loadPreview;

/**
    disableTag temporarily disables the tag for 5 minutes.

    @private
    @type {null}
*/
var disableTag = function() {
    var now = new Date();
    // Set now to 5 minutes ahead
    now.setTime(now.getTime() + 5*60*1000);
    
    document.cookie = 'mobify-path=' +
            '; expires=' + now.toGMTString() +
            '; path=/';

    // Reload the page (location.reload has problems in FF)
    window.location = window.location.href;
};

Private['disableTag'] = disableTag;

/** 
    collectTiming collects DOMContentLoaded time,
    and Load time.

    @private
    @type {null}
*/
var collectTiming = function() {
    /** @param {string} */
    var bindEvent = function(name) {
        window.addEventListener(name, function() {
            Tag[name] = +(new Date());
        }, false);
    };

    if (window.addEventListener) {
        bindEvent('DOMContentLoaded');
        bindEvent('load');
    }
};

Private['collectTiming'] = collectTiming;

/** 
    supportedBrowser will return whether or not we are on a device
    
    @private
    @param {string} ua User agent to test
    @type {bool}
*/
var supportedBrowser = function(ua) {
    // We're enabled for:
    // - WebKit based browsers
    // - IE 10+
    // - FireFox 4+
    // - Opera 11+
    var match = /webkit|(firefox)[\/\s](\d+)|(opera)[\s\S]*version[\/\s](\d+)|(trident)[\/\s](\d+)/i.exec(ua);
    if (!match) {
        return false;
    }
    // match[1] == Firefox
    if (match[1] && +match[2] < 4) {
        return false;
    }
    // match[3] == Opera
    if (match[3] && +match[4] < 11) {
        return false;
    }
    // match[5] == IE
    if (match[5] && +match[6] < 6) {
        return false;
    }

    return true;
};

Private['supportedBrowser'] = supportedBrowser;

/**
    Tag.getOptions returns the current options, accounting for the current
    mode if necessary.

    @type {Tag.singleOptionsType|null}
*/
var getOptions = function(options){
    if (options['getMode']) {
        // If the "options" objects has a mode, grab the mode and
        // return the options set for that mode
        var mode = getCookie("mobify-mode");

        if (!mode || !options[mode]) {
            mode = options['getMode'](Mobify);
        }
        
        return options[mode];
    } else if (SINGLE_MODE && supportedBrowser(Tag.userAgent)) {
        // If there is no mode set, return the options object if the browser is
        // supported.
        return options
    }

    return;
}

Tag['getOptions'] = getOptions;

/*
    Mobify.Tag.init initializes the tag with the `options`.

    Format of `options` object:
    Mobify.Tag.init({
        // Whether we should allow load through preview.
        skipPreview: true 

        getMode: function(Mobify) {
            // Return mode based on device or other settings.
            // `mode` is a key in to the options object
            // that selects our device-specific options.
            return 'desktop'
        },

        desktop: {
            // Url to load
            url: "http://cdn.mobify.com/foo/mobify.js",

            // Whether to capture
            capture: true,

            // Prelab Callback (optional)
            // Called immediately before we insert the script.
            preload: function() {};

            // Postload Callback (optional)
            // Called after the script's onload handler fires.
            postload: function() {};
        }
    });
*/



/** Mobify.init

    @expose
    @param {!Object} options Options to load with
    @type {null}
*/
Tag['init'] = function(options) {
    Tag['options'] = options;

    if (isDisabled()) {
        return;
    }

    collectTiming();

    if (!options['skipPreview'] && isPreview()) {
        startCapture(loadPreview);
        return;
    }

    var opts = getOptions(options);

    if (!opts) {
        return;
    }

    var preloadCallback = function() {
        if (opts['preload']) {
            opts['preload']();
        }
    };

    var postloadCallback = function() {
        if (opts['postload']) {
            opts['postload']();
        }
    };

    var load = function() {
        preloadCallback();

        var options = {
            id: "mobifyify-js",
            src: opts['url'],
            onerror: disableTag,
            onload: postloadCallback
        }

        loadScript(options, "mobify");
    };

    // Default capture to true
    // Testing must be strict, since `undefined` is assumed to be true.
    if (opts['capture'] === false) {
        load();
    } else {
        startCapture(load);
    }
};

})(window, document);
