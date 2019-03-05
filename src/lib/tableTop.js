
var inNodeJS = typeof process !== 'undefined' && !process.browser;
var numberOfLinesOfHeaders = 2;

var request = function requestNotProvided() {
  throw new Error("The 'request' module is only available while running in Node.");
};
if (inNodeJS) { // This will get stripped out by Uglify, and Webpack will not include it
  request = require('request');
}

var supportsCORS = false;
var inLegacyIE = false;
try {
  var testXHR = new XMLHttpRequest();
  if (typeof testXHR.withCredentials !== 'undefined') {
    supportsCORS = true;
  } else {
    if ('XDomainRequest' in window) {
      supportsCORS = true;
      inLegacyIE = true;
    }
  }
} catch (e) { }

// Create a simple indexOf function for support
// of older browsers.  Uses native indexOf if
// available.  Code similar to underscores.
// By making a separate function, instead of adding
// to the prototype, we will not break bad for loops
// in older browsers
var indexOfProto = Array.prototype.indexOf;
var ttIndexOf = function (array, item) {
  var i = 0, l = array.length;

  if (indexOfProto && array.indexOf === indexOfProto) {
    return array.indexOf(item);
  }

  for (; i < l; i++) {
    if (array[i] === item) {
      return i;
    }
  }
  return -1;
};


function Tabletop(options) {
  // Make sure Tabletop is being used as a constructor no matter what.
  if (!this || !(this instanceof Tabletop)) {
    return new Tabletop(options);
  }

  if (typeof (options) === 'string') {
    options = { key: options };
  }

  this.callback = options.callback;
  this.key = options.key;
  this.endpoint = options.endpoint || 'https://spreadsheets.google.com';
  this.authkey = options.authkey;
  this.sheetPrivacy = this.authkey ? 'private' : 'public'


  if (typeof (options.proxy) !== 'undefined') {
    // Remove trailing slash, it will break the app
    this.endpoint = options.proxy.replace(/\/$/, '');
    this.simpleUrl = true;
    // Let's only use CORS (straight JSON request) when
    // fetching straight from Google
    supportsCORS = false;
  }

  this.parameterize = options.parameterize || false;

  /* Be friendly about what you accept */
  if (/key=/.test(this.key)) {
    this.log('You passed an old Google Docs url as the key! Attempting to parse.');
    this.key = this.key.match('key=(.*?)(&|#|$)')[1];
  }

  if (/pubhtml/.test(this.key)) {
    this.log('You passed a new Google Spreadsheets url as the key! Attempting to parse.');
    this.key = this.key.match('d\\/(.*?)\\/pubhtml')[1];
  }

  if (/spreadsheets\/d/.test(this.key)) {
    this.log('You passed the most recent version of Google Spreadsheets url as the key! Attempting to parse.');
    this.key = this.key.match('d\\/(.*?)\/')[1];
  }

  if (!this.key) {
    this.log('You need to pass Tabletop a key!');
    return;
  }

  this.log('Initializing with key ' + this.key);

  this.models = {};
  this.modelNames = [];

  this.baseJsonPath = '/feeds/worksheets/' + this.key + '/' + this.sheetPrivacy + '/basic?alt=';

  if (inNodeJS || supportsCORS) {
    this.baseJsonPath += 'json';
  } else {
    this.baseJsonPath += 'json-in-script';
  }

  this.requestData(this.baseJsonPath, this.loadSheets);
};

// Backwards compatibility.
Tabletop.init = function (options) {
  return new Tabletop(options);
};

Tabletop.prototype = {

  /*
    This will call the environment appropriate request method.
    In browser it will use JSON-P, in node it will use request()
  */
  requestData: function (path, callback) {
    this.log('Requesting', path);

    if (inNodeJS) {
      this.serverSideFetch(path, callback);
    } else {
      //CORS only works in IE8/9 across the same protocol
      //You must have your server on HTTPS to talk to Google, or it'll fall back on injection
      var protocol = this.endpoint.split('//').shift() || 'http';
      if (supportsCORS && (!inLegacyIE || protocol === location.protocol)) {
        this.xhrFetch(path, callback);
      } else {
        this.injectScript(path, callback);
      }
    }
  },

  /*
    Use Cross-Origin XMLHttpRequest to get the data in browsers that support it.
  */
  xhrFetch: function (path, callback) {
    //support IE8's separate cross-domain object
    var xhr = inLegacyIE ? new XDomainRequest() : new XMLHttpRequest();
    xhr.open('GET', this.endpoint + path);
    var self = this;
    xhr.onload = function () {
      var json;
      try {
        json = JSON.parse(xhr.responseText);
      } catch (e) {
        console.error(e);
      }
      callback.call(self, json);
    };
    xhr.send();
  },

  /*
    Insert the URL into the page as a script tag. Once it's loaded the spreadsheet data
    it triggers the callback. This helps you avoid cross-domain errors
    http://code.google.com/apis/gdata/samples/spreadsheet_sample.html
    Let's be plain-Jane and not use jQuery or anything.
  */
  injectScript: function (path, callback) {
    var script = document.createElement('script');
    var callbackName;
    var self = this;

    callbackName = 'tt' + (+new Date()) + (Math.floor(Math.random() * 100000));
    // Create a temp callback which will get removed once it has executed,
    // this allows multiple instances of Tabletop to coexist.
    Tabletop.callbacks[callbackName] = function () {
      var args = Array.prototype.slice.call(arguments, 0);
      callback.apply(self, args);
      script.parentNode.removeChild(script);
      delete Tabletop.callbacks[callbackName];
    };
    callbackName = 'Tabletop.callbacks.' + callbackName;

    var url = path + '&callback=' + callbackName;

    if (this.simpleUrl) {
      // We've gone down a rabbit hole of passing injectScript the path, so let's
      // just pull the sheet_id out of the path like the least efficient worker bees
      if (path.indexOf('/list/') !== -1) {
        script.src = this.endpoint + '/' + this.key + '-' + path.split('/')[4];
      } else {
        script.src = this.endpoint + '/' + this.key;
      }
    } else {
      script.src = this.endpoint + url;
    }

    if (this.parameterize) {
      script.src = this.parameterize + encodeURIComponent(script.src);
    }

    this.log('Injecting', script.src);

    document.getElementsByTagName('script')[0].parentNode.appendChild(script);
  },
  /*
    This will only run if tabletop is being run in node.js
  */
  serverSideFetch: function (path, callback) {
    var self = this;

    this.log('Fetching', this.endpoint + path);
    request({ url: this.endpoint + path, json: true }, function (err, resp, body) {
      if (err) {
        return console.error(err);
      }
      callback.call(self, body);
    });
  },


  /*
    What gets send to the callback
    if simpleSheet === true, then don't return an array of Tabletop.this.models,
    only return the first one's elements
  */
  data: function () {
    // If the instance is being queried before the data's been fetched
    // then return undefined.
    if (this.modelNames.length === 0) {
      return undefined;
    }
    if (this.simpleSheet) {
      if (this.modelNames.length > 1 && this.debug) {
        this.log('WARNING You have more than one sheet but are using simple sheet mode! Don\'t blame me when something goes wrong.');
      }
      return this.models[this.modelNames[0]].all();
    } else {
      return this.models;
    }
  },

  /*
    Load only first worksheet of the spreadsheet, turning it into a Tabletop Model.
    Need to use injectScript because the worksheet view that you're working from
    doesn't actually include the data. The list-based feed (/feeds/list/key..) does, though.
    Calls back to loadSheet in order to get the real work done.
    Used as a callback for the worksheet-based JSON
  */
  loadSheets: function (data) {
    this.googleSheetName = data.feed.title.$t;
    this.foundSheetNames = [];
    var linkIdx = data.feed.entry[0].link.length - 1;
    var sheetId = data.feed.entry[0].link[linkIdx].href.split('/').pop();
    var jsonPath = '/feeds/list/' + this.key + '/' + sheetId + '/' + this.sheetPrivacy + '/values?alt=';

    if (inNodeJS || supportsCORS) {
      jsonPath += 'json';
    } else {
      jsonPath += 'json-in-script';
    }
    if (this.query) {
      // Query Language Reference (0.7)
      jsonPath += '&tq=' + this.query;
    }
    if (this.orderby) {
      jsonPath += '&orderby=column:' + this.orderby.toLowerCase();
    }
    if (this.reverse) {
      jsonPath += '&reverse=true';
    }

    this.requestData(jsonPath, this.loadSheet);
  },

  sheetReady: function (model) {
    this.models = model;
    if (ttIndexOf(this.modelNames, model.name) === -1) {
      this.modelNames.push(model.name);
    }

    this.doCallback();
  },

  getTheCorrectHeaders: function (data) {
    var columnNames = {};
    var columnNamesList = [];
    var parentHeader = {};

    for (var key in data[0]) {
      if (/^gsx/.test(key)) {
        var saneKeyName = key.replace('gsx$', '');
        var temObj = { name: data[0][key].$t, code: saneKeyName };
        columnNames[saneKeyName] = temObj;
        // we need the columns as array so that we have them ordered as in the spreadsheet
        // since both have a refference to the object, any change in columnNames will be seen in here
        // we don't need any other parsing or transforming it into an array
        columnNamesList.push(temObj);
      }
    }

    for (var key in data[1]) {
      if (/^gsx/.test(key)) {
        var name = key.replace('gsx$', '');
        if (columnNames[name]) {
          columnNames[name].subHeaders ? null : columnNames[name].subHeaders = {};
          parentHeader = columnNames[name];
        }
        parentHeader.subHeaders[name] = data[1][key].$t;
      }
    }
    return columnNamesList;
  },

  getElements(data) {
    var elements = [];
    var i, ilen;

    for (i = 0, ilen = data.length; i < ilen; i++) {
      var source = data[i];
      var tempElem = {};

      for (var key in source) {
        if (/^gsx/.test(key)) {
          var saneKeyName = key.replace('gsx$', '');
          var itemValue = source[key].$t;
          var linkTagsText = '';

          linkTagsText = itemValue.indexOf('http') !==
            -1 ?
            this.handleLink(itemValue, 'http') :
            itemValue.indexOf('www') !== -1 ?
              this.handleLink(itemValue, 'www') :
              itemValue;

          tempElem[saneKeyName] = this.handleNewLine(linkTagsText);
        }
      }

      elements.push(tempElem);
    }
    return elements;
  },

  handleNewLine(testValue) {
    var resultWithNewLineTags = testValue.match(/\n/) ? replaceNewLine(testValue) : testValue.match(/\r/) ? replaceNewLine(testValue) : testValue;

    function replaceNewLine(itemValue) {
      var lines = itemValue.split('\n');
      var result = lines[0];
      for (let index = 1; index < lines.length; index++) {
        const element = lines[index];
        result += '<br>' + element;
      }
      return result;
    }
    return resultWithNewLineTags;
  },

  handleLink(itemValue, term) {
    const link = itemValue.substring(itemValue.indexOf(term), itemValue.length).split(' ')[0];
    const newlink = link.indexOf('http') > -1 ? link : `//${link}`;
    const linkedText = `<a target="_blank" href="${newlink}">${link}</a>`;
    return itemValue.replace(link, linkedText);
  },

  /*
    Parse a single list-based worksheet, turning it into a Tabletop Model
    Used as a callback for the list-based JSON
  */
  loadSheet: function (data) {
    var that = this;
    new Tabletop.Model({
      data: data,
      tabletop: this,
      onReady: function () {
        that.sheetReady(this);
      }
    });
  },

  /*
    Execute the callback upon loading! Rely on this.data() because you might
      only request certain pieces of data (i.e. simpleSheet mode)
    Tests this.sheetsToLoad just in case a race condition happens to show up
  */
  doCallback: function () {
    this.callback.apply(this.callbackContext || this, [this.data(), this]);
  },


  log: function () {
    if (this.debug) {
      if (typeof console !== 'undefined' && typeof console.log !== 'undefined') {
        Function.prototype.apply.apply(console.log, [console, arguments]);
      }
    }
  }

};

/*
  Tabletop.Model stores the attribute names and parses the worksheet data
    to turn it into something worthwhile
  Options should be in the format { data: XXX }, with XXX being the list-based worksheet
*/
Tabletop.Model = function (options) {
  this.columnNamesList = [];
  this.name = options.data.feed.title.$t;
  this.tabletop = options.tabletop;
  this.elements = [];
  this.onReady = options.onReady;
  this.raw = options.data; // A copy of the sheet's raw data, for accessing minutiae


  if (typeof (options.data.feed.entry) === 'undefined') {
    options.tabletop.log('Missing data for ' + this.name + ', make sure you didn\'t forget column headers');
    this.originalColumns = [];
    this.elements = [];
    this.ready();
    return;
  }

  this.columnNamesList = this.tabletop.getTheCorrectHeaders(options.data.feed.entry.slice(0, numberOfLinesOfHeaders));
  this.elements = this.tabletop.getElements(options.data.feed.entry.slice(numberOfLinesOfHeaders, options.data.feed.entry.length));

  this.ready();
};


Tabletop.Model.prototype = {
  /*
    Returns all of the elements (rows) of the worksheet as objects
  */
  all: function () {
    return this.elements;
  },

  ready: function () {
    this.onReady.call(this);
  },

};

export default Tabletop;
