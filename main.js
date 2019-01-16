/**
 * This is a simplified version of Tabletop.js from https://github.com/jsoma/tabletop
 * It presumes that there is only one sheet
 * It needs the first row of the googlesheet to be empty so that it will have the correct headers
 * It uses vuejs to make the necessary data for the boostrap-vue table
 * It expects that on the second row of values (third from the top) will find subheaders which will be used as labels
 * The first few columns will be sortable
 * It looks for links (only containing http(s)) and adds the html tags (<a>) to be opened in a new tab
 */
(function (d) {
  'use strict';

  var el = d.getElementById("app");
  var numberOfLinesOfHeaders = el.getAttribute("data-numberOfLinesOfHeaders");
  var publicSpreadsheetUrl = el.getAttribute("data-publicSpreadsheetUrl");
  var publicSpreadsheetUrlExportXlsx = el.getAttribute("data-publicSpreadsheetUrlExportXlsx");
  var typeColumnName = el.getAttribute("data-typeColumnName");
  var numberOfSortableHeaders = el.getAttribute("data-numberOfSortableHeaders");
  var title = el.getAttribute("data-title");
  var scripts = ["https://unpkg.com/vue", "//unpkg.com/babel-polyfill@latest/dist/polyfill.min.js", "//unpkg.com/bootstrap-vue@latest/dist/bootstrap-vue.js"];
  var styles = ["//unpkg.com/bootstrap/dist/css/bootstrap.min.css", "//unpkg.com/bootstrap-vue@latest/dist/bootstrap-vue.css", "style.css"];

  for (var index = 0; index < styles.length; index++) {
    var style = styles[index];
    var c0 = document.createElement("link");

    c0.rel = "stylesheet";
    c0.type = "text/css";
    c0.href = style;
    document.head.appendChild(c0);
  }

  var theTable = `
  <div class="container-fluid">
      <div class="row flex-xl-nowrap2">
        <div class="bd-content">
          <h1 class="text-center">${title}</h1>
          <!-- Table -->

          <b-container fluid v-if="items && items.length > 0">
            <!-- User Interface controls -->
            <b-row>
              <b-col md="8" class="my-1">
                <b-input-group prepend="Search">
                  <b-form-input v-model="filter"></b-form-input>
                </b-input-group>
              </b-col>

              <b-col md="4" class="my-1">
                <a class="btn mb-0 btn-outline-primary btn-md" style="float: right;" target="_blank" :href="publicSpreadsheetUrlExportXlsx">Export</a>
                <b-button size="md" style="float: right;" @click="onResetFilters" variant="outline-primary" class="mb-0">
                  Reset filters
                </b-button>
              </b-col>
            </b-row>

            <b-row>
              <b-col md="4" class="my-1">
                <b-form-group horizontal :label="labelNames[0]" class="mb-0">
                  <b-form-select v-model="selectedLabel1">
                    <option :value="null" selected>All {{labelNames[0].toLowerCase()}}</option>
                    <option v-for="item in filteredLabels[labelNames[0]]" :value="item">{{item}}</option>
                  </b-form-select>
                </b-form-group>
              </b-col>
              <b-col md="4" class="my-1">
                <b-form-group horizontal :label="labelNames[1]" class="mb-0">
                  <b-form-select v-model="selectedLabel2" />
                  <option :value="null" selected>All {{labelNames[1].toLowerCase()}}</option>
                  <option v-for="item in filteredLabels[labelNames[1]]" :value="item">{{item}}</option>
                  </b-form-select>
                </b-form-group>
              </b-col>
              <b-col md="4" class="my-1">
                <b-form-group horizontal label="Type" class="mb-0">
                  <b-form-select v-model="selectedType" />
                  <option :value="null" selected>All types...</option>
                  <option v-for="item in filteredLabels.standardTypes" :value="item">{{item}}</option>
                  </b-form-select>
                </b-form-group>
              </b-col>
            </b-row>

            <!-- Main table element -->
            <b-table show-empty stacked="md" :items="filteredItems" :fields="headers" :current-page="currentPage"
              :per-page="perPage" :filter="filter" @filtered="onFiltered">
              <template slot="Specific committee" slot-scope="data">
                <span v-html="data.value"></span>
              </template>

              <template :slot="labelNames[0]" slot-scope="row">
                <b-badge href="#" v-for="(value, key) in row.item[labelNames[0]]" @click="onFilterByLabel1(value)"
                  variant="success">{{
                  value }}</b-badge>
              </template>

              <template :slot="labelNames[1]" slot-scope="row">
                <b-badge href="#" v-for="(value, key) in row.item[labelNames[1]]" @click="onFilterByLabel2(value)"
                  variant="primary">{{
                  value }}</b-badge>
              </template>
            </b-table>

            <b-row>
              <b-col md="3" class="my-1">
                <label class="mr-sm-2">Total results {{totalRows}}</label>
              </b-col>

              <b-col md="6" class="my-1 d-flex justify-content-center">
                <b-pagination :total-rows="totalRows" :per-page="perPage" v-model="currentPage" class="my-0" />
              </b-col>

              <b-col md="3" class="my-1">
                <b-input-group prepend="Page size">
                  <b-form-select class="mb-2 mr-sm-2 mb-sm-0" :options="pageOptions" v-model="perPage">
                  </b-form-select>
                </b-input-group>
              </b-col>

            </b-row>

          </b-container>

        </div>

      </div>
    </div>
  `;

  var tableElement = document.createElement("div");
  tableElement.innerHTML = theTable;
  el.appendChild(tableElement);

  var inNodeJS = typeof process !== 'undefined' && !process.browser;

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


  var Tabletop = function (options) {
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

            if (itemValue.indexOf('http') !== -1) {
              var link = itemValue.substring(itemValue.indexOf('http'), itemValue.length).split(' ')[0];
              var htmlLink = itemValue.replace(link, '<a target="_blank" href=" ' + link + '">' + link + '</a>');

              tempElem[saneKeyName] = htmlLink;
            } else {
              tempElem[saneKeyName] = itemValue;
            }
          }
        }

        elements.push(tempElem);
      }
      return elements;
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

  if (typeof module !== 'undefined' && module.exports) { //don't just use inNodeJS, we may be in Browserify
    module.exports = Tabletop;
  } else if (typeof define === 'function' && define.amd) {
    define(function () {
      return Tabletop;
    });
  } else {
    window.Tabletop = Tabletop;
  }

  function init() {
    Tabletop.init({
      key: publicSpreadsheetUrl,
      callback: showInfo,
      simpleSheet: false
    });
  }

  function showInfo(data, tabletop) {
    var app = new Vue({
      el: '#app',
      data() {
        return {
          items: [],
          headers: [],
          labels: {},
          labelNames: [],
          currentPage: 1,
          perPage: 50,
          totalRows: null,
          selectedLabel1: null,
          selectedLabel2: null,
          selectedType: null,
          standardTypes: [],
          pageOptions: [50, 100, 150],
          filter: null,
          publicSpreadsheetUrl: publicSpreadsheetUrl,
          publicSpreadsheetUrlExportXlsx: publicSpreadsheetUrlExportXlsx,
        }
      },
      computed: {
        filteredItems: function filterItems() {
          var result =
            !!this.selectedLabel1 ? this.items.filter((item) => {
              return item[this.labelNames[0]].indexOf(this.selectedLabel1) > -1;
            }) : this.items.slice();

          result =
            !!this.selectedLabel2 ? result.filter((item) => {
              return item[this.labelNames[1]].indexOf(this.selectedLabel2) > -1;
            }) : result;

          result =
            !!this.selectedType ? result.filter((item) => {
              return item['Type'] === this.selectedType;
            }) : result;

          return result;
        },
        filteredLabels: function filterLabels() {
          var result = {};

          if (!this.selectedLabel1 && !this.selectedLabel2 && !this.selectedType) {
            result = this.labels;
            result['standardTypes'] = this.standardTypes;
          } else {
            result[this.labelNames[0]] = [];
            result[this.labelNames[1]] = [];
            result['standardTypes'] = [];

            this.filteredItems.map((item) => {
              item[this.labelNames[0]].map((label) => {
                result[this.labelNames[0]].indexOf(label) === -1 ? result[this.labelNames[0]].push(label) : null;
              });
              item[this.labelNames[1]].map((label) => {
                result[this.labelNames[1]].indexOf(label) === -1 ? result[this.labelNames[1]].push(label) : null;
              });
              result['standardTypes'].indexOf(item.Type) === -1 ? result['standardTypes'].push(item.Type) : null;
            });
          }

          return result;
        }
      },
      created() {
        this.formatSheetDataForTable(data);
      },
      methods: {
        formatSheetDataForTable(data) {
          this.formatHeaders(data.columnNamesList);
          this.formatLabels(data.columnNamesList);
          this.formatValues(data.columnNamesList, data.elements);
          this.formatStandardTypes(data.columnNamesList, data.elements);
        },
        onFiltered(filteredItems) {
          this.totalRows = filteredItems.length;
          this.currentPage = 1;
        },
        onFilterByLabel1(label) {
          this.selectedLabel1 = label;
        },
        onFilterByLabel2(label) {
          this.selectedLabel2 = label;
        },
        onResetFilters() {
          this.selectedLabel1 = null;
          this.selectedLabel2 = null;
          this.selectedType = null;
        },
        formatHeaders(columns) {
          var result = [];
          var index = 0;
          columns.map((header) => {
            var item = { key: header.name, label: header.name, sortable: index <= numberOfSortableHeaders ? true : false, sortDirection: 'desc' };
            result.push(item);
            index++;
          });
          this.headers = result.slice();
        },
        formatLabels(columns) {
          var result = {};
          columns.map((header) => {
            header.subHeaders ? result[header.name] = [] : null;
            if (header.subHeaders) {
              Object.keys(header.subHeaders).map((key) => {
                var subHeaderName = header.subHeaders[key];
                result[header.name].push(subHeaderName);
              });
              this.labelNames.push(header.name);
            }
          });
          this.labels = Object.assign({}, result);
        },
        formatValues(columns, elements) {
          var result = [];
          elements.map((element) => {
            var tempItem = {};

            columns.map((column) => {
              if (column.subHeaders) {
                tempItem[column.name] = [];
                Object.keys(column.subHeaders).map((subHeaderKey) => {
                  var subHeader = column.subHeaders[subHeaderKey];
                  element[subHeaderKey] ? tempItem[column.name].push(subHeader) : null;
                });
              } else {
                tempItem[column.name] = element[column.code];
              }
            })
            result.push(tempItem);
          });
          this.items = result.slice();
          this.totalRows = this.items.length;
        },
        formatStandardTypes(columns, elements) {
          var typeColumnCode = '';
          var result = [];

          columns.map((column) => {
            if (column.name === typeColumnName) {
              typeColumnCode = column.code;
            }
          });

          elements.map((element) => {
            var typeName = element[typeColumnCode];
            result.indexOf(typeName) === -1 ? result.push(typeName) : null;
          });

          this.standardTypes = result.slice();
        },
      }
    });
  }

  var loadScriptAsync = function () {
    var promisses = [];
    for (var index = 0; index < scripts.length; index++) {
      promisses.push(
        new Promise((resolve, reject) => {
          var script = scripts[index];
          var s0 = document.createElement("script");

          s0.type = "text/javascript";
          s0.src = script;
          s0.async = false;
          s0.onload = () => {
            resolve();
          };
          document.head.appendChild(s0);
        })
      );
    }
    return promisses;
  }

  Promise.all(loadScriptAsync()).then(function(values) {
    init();
  });

}(document));
