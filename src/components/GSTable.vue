<template>
  <div id="table-gsheet">
    <!-- Filters -->
    <b-container fluid v-if="items && items.length > 0">
      <!-- User Interface controls -->
      <b-row>
        <b-col md="8" class="my-1">
          <b-input-group prepend="Search">
            <b-form-input v-model="filter"></b-form-input>
          </b-input-group>
        </b-col>

        <b-col md="4" class="my-1">
          <a
            class="btn mb-0 btn-outline-primary btn-md"
            style="float: right;"
            target="_blank"
            :href="spreadsheetUrlExport"
          >Export</a>
          <b-button
            size="md"
            style="float: right;"
            @click="onResetFilters"
            variant="outline-primary"
            class="mb-0"
          >Reset filters</b-button>
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
            <b-form-select v-model="selectedLabel2">
              <option :value="null" selected>All {{labelNames[1].toLowerCase()}}</option>
              <option v-for="item in filteredLabels[labelNames[1]]" :value="item">{{item}}</option>
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col md="4" class="my-1">
          <b-form-group horizontal label="Type" class="mb-0">
            <b-form-select v-model="selectedType">
              <option :value="null" selected>All types...</option>
              <option v-for="item in filteredLabels.standardTypes" :value="item">{{item}}</option>
            </b-form-select>
          </b-form-group>
        </b-col>
      </b-row>

      <!-- Main table element -->
      <b-table
        show-empty
        stacked="md"
        :items="filteredItems"
        :fields="headers"
        :current-page="currentPage"
        :per-page="perPage"
        :filter="filter"
        @filtered="onFiltered"
      >
        <template
          v-for="header in headers.slice(0, headers.length - 2)"
          :slot="header.label"
          slot-scope="data"
        >
          <span v-html="data.value"></span>
        </template>

        <template :slot="labelNames[0]" slot-scope="row">
          <b-badge
            href="#"
            v-for="(value, key) in row.item[labelNames[0]]"
            @click="onFilterByLabel1(value)"
            variant="success"
          >
            {{
            value }}
          </b-badge>
        </template>

        <template :slot="labelNames[1]" slot-scope="row">
          <b-badge
            href="#"
            v-for="(value, key) in row.item[labelNames[1]]"
            @click="onFilterByLabel2(value)"
            variant="primary"
          >
            {{
            value }}
          </b-badge>
        </template>
      </b-table>

      <b-row>
        <b-col md="3" class="my-1">
          <label class="mr-sm-2">Total results {{totalRows}}</label>
        </b-col>

        <b-col md="6" class="my-1 d-flex justify-content-center">
          <b-pagination
            :total-rows="totalRows"
            :per-page="perPage"
            v-model="currentPage"
            class="my-0"
          />
        </b-col>

        <b-col md="3" class="my-1">
          <b-input-group prepend="Page size">
            <b-form-select class="mb-2 mr-sm-2 mb-sm-0" :options="pageOptions" v-model="perPage"></b-form-select>
          </b-input-group>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import TabelTop from "../lib/tableTop";

export default {
  name: "GSTable",
  props: [
    "title",
    "spreadsheetUrl",
    "spreadsheetUrlExport",
    "typeColumnName",
    "numberOfSortableColumns"
  ],
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
      filter: null
    };
  },
  computed: {
    filteredItems: function filterItems() {
      var result = !!this.selectedLabel1
        ? this.items.filter(item => {
            return item[this.labelNames[0]].indexOf(this.selectedLabel1) > -1;
          })
        : this.items.slice();

      result = !!this.selectedLabel2
        ? result.filter(item => {
            return item[this.labelNames[1]].indexOf(this.selectedLabel2) > -1;
          })
        : result;

      result = !!this.selectedType
        ? result.filter(item => {
            return item["Type"] === this.selectedType;
          })
        : result;

      return result;
    },
    filteredLabels: function filterLabels() {
      var result = {};

      if (!this.selectedLabel1 && !this.selectedLabel2 && !this.selectedType) {
        result = this.labels;
        result["standardTypes"] = this.standardTypes;
      } else {
        result[this.labelNames[0]] = [];
        result[this.labelNames[1]] = [];
        result["standardTypes"] = [];

        this.filteredItems.map(item => {
          item[this.labelNames[0]].map(label => {
            result[this.labelNames[0]].indexOf(label) === -1
              ? result[this.labelNames[0]].push(label)
              : null;
          });
          item[this.labelNames[1]].map(label => {
            result[this.labelNames[1]].indexOf(label) === -1
              ? result[this.labelNames[1]].push(label)
              : null;
          });
          result["standardTypes"].indexOf(item.Type) === -1
            ? result["standardTypes"].push(item.Type)
            : null;
        });
      }

      return result;
    }
  },
  created() {
    TabelTop.init({
      key: this.spreadsheetUrl,
      callback: this.formatSheetDataForTable,
      simpleSheet: false
    });
  },
  methods: {
    formatSheetDataForTable(data) {
      console.log(data);
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
      columns.map(header => {
        var item = {
          key: header.name,
          label: header.name,
          sortable: index < this.numberOfSortableColumns ? true : false,
          sortDirection: "desc"
        };
        result.push(item);
        index++;
      });
      this.headers = result.slice();
    },
    formatLabels(columns) {
      var result = {};
      columns.map(header => {
        header.subHeaders ? (result[header.name] = []) : null;
        if (header.subHeaders) {
          Object.keys(header.subHeaders).map(key => {
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
      elements.map(element => {
        var tempItem = {};

        columns.map(column => {
          if (column.subHeaders) {
            tempItem[column.name] = [];
            Object.keys(column.subHeaders).map(subHeaderKey => {
              var subHeader = column.subHeaders[subHeaderKey];
              element[subHeaderKey]
                ? tempItem[column.name].push(subHeader)
                : null;
            });
          } else {
            tempItem[column.name] = element[column.code];
          }
        });
        result.push(tempItem);
      });
      this.items = result.slice();
      this.totalRows = this.items.length;
    },
    formatStandardTypes(columns, elements) {
      var typeColumnCode = "";
      var result = [];

      columns.map(column => {
        if (column.name === this.typeColumnName) {
          typeColumnCode = column.code;
        }
      });

      elements.map(element => {
        var typeName = element[typeColumnCode];
        result.indexOf(typeName) === -1 ? result.push(typeName) : null;
      });

      this.standardTypes = result.slice();
    }
  }
};
</script>
