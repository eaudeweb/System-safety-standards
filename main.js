
const spreadsheetId = '1H4LeCBrDhiO8SRmMaZVDFPft7TnZik89N11Qdwnr1Ic';
const marketSectorsLength = 9;
const lifeCycleStagesLength = 5;
const allValues = 'Settings!A4:T';
const allHeaders = 'A1:F1';
const allLabelHeaders = 'G1:P1';
const allMarketSectorsLabels = 'G2:O2';
const allLifeCycleStagesLabels = 'P2:T2';
const ranges = [allValues, allHeaders, allMarketSectorsLabels, allLifeCycleStagesLabels, allLabelHeaders];

const CLIENT_ID = '793477745752-ehum9vcq1tcgp39enncrik52rif591u3.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA5aGY1azbaS52UNQjsAKgwapgDpl0YfN0';
// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

const authorizeButton = document.getElementById('authorize_button');
const signoutButton = document.getElementById('signout_button');


var app2 = new Vue({
  el: '#app',
  data() {
    return {
      sheets: [],
      items: [],
      fields: [],
      labels: {},
      labelNames: [],
      currentPage: 1,
      perPage: 5,
      totalRows: null,
      selectedLabel1: null,
      selectedLabel2: null,
      pageOptions: [5, 10, 15],
      filter: null,
    }
  },
  computed: {
    filteredItems: function makefilterItems() {
      let result = 
      !!this.selectedLabel1 ? this.items.filter((item) => {
        return item[this.labelNames[0]].indexOf(this.selectedLabel1) > -1;
      }) : this.items.slice();

      result = 
      !!this.selectedLabel2 ? result.filter((item) => {
        return item[this.labelNames[1]].indexOf(this.selectedLabel2) > -1;
      }) : result;

      return result;
    }
  },
  created() {
    this.handleClientLoad();
  },
  methods: {
    onFiltered(filteredItems) {
      this.totalRows = filteredItems.length
      this.currentPage = 1
    },
    handleClientLoad() {
      gapi.load('client:auth2', this.initClient);
    },

    /**
     *  Initializes the API client library and sets up sign-in state
     *  listeners.
     */
    initClient() {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      }).then(() => {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus);

        // Handle the initial sign-in state.
        this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = this.handleAuthClick;
        signoutButton.onclick = this.handleSignoutClick;
      }, (error) => {
        console.log(error);
      });
    },

    /**
     *  Called when the signed in status changes, to update the UI
     *  appropriately. After a sign-in, the API is called.
     */
    updateSigninStatus(isSignedIn) {
      if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        this.getSheetData();
      } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
      }
    },

    /**
     *  Sign in the user upon button click.
     */
    handleAuthClick(event) {
      gapi.auth2.getAuthInstance().signIn();
    },

    /**
     *  Sign out the user upon button click.
     */
    handleSignoutClick(event) {
      gapi.auth2.getAuthInstance().signOut();
    },

    /**
     * Print  spreadsheet:
     */
    getSheetData() {
      gapi.client.sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        // The A1 notation of the values to retrieve.
        ranges,
      }).then((response) => {
        const result = response.result.valueRanges;
        const values = result[0].values;
        const headers = result[1].values[0];
        const marketSectors = result[2].values[0];
        const lifeCycleStages = result[3].values[0];
        this.labelNames = [result[4].values[0][0], result[4].values[0][result[4].values[0].length - 1]];

        this.formatSheetDataForTable(headers, values, this.labelNames, marketSectors, lifeCycleStages);
      }, (response) => {
        appendPre('Error: ' + response.result.error.message);
      });
    },

    formatSheetDataForTable(headers, values, labelHeaders, marketSectors, lifeCycleStages) {
      this.formatHeaders(headers, labelHeaders);
      this.formatLabels(labelHeaders, marketSectors, lifeCycleStages);
      this.formatValues(values);
    },

    formatHeaders(headers, labelHeaders) {
      let fields = [];

      headers.map((header) => {
        const item = { key: header, label: header, sortable: true, sortDirection: 'desc' };
        fields.push(item);
      });

      labelHeaders.map((header) => {
        const item = { key: header, label: header };
        fields.push(item);
      });

      this.fields = fields.slice();
    },

    formatLabels(labelHeaders, marketSectors, lifeCycleStages) {
      let labels = {};
      labels[labelHeaders[0]] = marketSectors;
      labels[labelHeaders[1]] = lifeCycleStages;
      this.labels = Object.assign({}, labels);
    },

    formatValues(values) {
      let items = [];

      values.map((row) => {
        let item = {};

        this.fields.map((header, index) => {
          const headerName = this.fields[index].key;
          const value = index < this.fields.length - 2 ? row[index] : this.addLabels(headerName, row, index);

          item[headerName] = value;
        });

        items.push(item);
      });

      this.items = items.slice();
      this.totalRows = this.items.length;
    },
    addLabels(headerName, row, indexLabel) {
      let result = [];

      indexLabel === 6
        ?
          this.labels[headerName].map((label, index) => {
            !!row[6 + index] ? result.push(label) : null;
          })
        :
          this.labels[headerName].map((label, index) => {
            !!row[15 + index] ? result.push(label) : null;
          })

      return result;
    }
  }
});