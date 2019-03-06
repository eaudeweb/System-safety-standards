<template>
  <div id="table-gsheet">
    <!-- Filters -->
    <b-container fluid v-if="items && items.length > 0">
      <!-- User Interface controls -->
      <b-row>
        <b-col md="8" class="my-1">
          <b-input-group prepend="Search">
            <b-form-input v-model="filter" placeholder="Search by key word, year, etc"></b-form-input>
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
        <b-col md="3" class="my-1">
          <b-form-group horizontal label="Coverage" class="mb-0">
            <b-form-select v-model="selectedCoverage">
              <option :value="null" selected>Any ...</option>
              <option v-for="item in filteredLabels.standardCoverages" :value="item">{{item}}</option>
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col md="3" class="my-1">
          <b-form-group horizontal label="Type" class="mb-0">
            <b-form-select v-model="selectedType">
              <option :value="null" selected>Any ...</option>
              <option v-for="item in filteredLabels.standardTypes" :value="item">{{item}}</option>
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col md="3" class="my-1">
          <b-form-group horizontal :label="labelNames[0]" class="mb-0">
            <b-form-select v-model="selectedLabel1">
              <option :value="null" selected>Any ...</option>
              <option v-for="item in filteredLabels[labelNames[0]]" :value="item">{{item}}</option>
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col md="3" class="my-1">
          <b-form-group horizontal :label="labelNames[1]" class="mb-0">
            <b-form-select v-model="selectedLabel2">
              <option :value="null" selected>Any ...</option>
              <option v-for="item in filteredLabels[labelNames[1]]" :value="item">{{item}}</option>
            </b-form-select>
          </b-form-group>
        </b-col>
      </b-row>

      <!-- Main table element -->
      <b-table
        responsive
        show-empty
        stacked="sm"
        :items="filteredItems"
        :fields="headers"
        :current-page="currentPage"
        :per-page="perPage"
        :filter="filter"
        @filtered="onFiltered"
      >
        <template
          v-for="header in headers.slice(0, headers.length - 2)"
          :slot="header.displayName"
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
            {{ value }}
          </b-badge>
        </template>

        <template :slot="labelNames[1]" slot-scope="row">
          <b-badge
            href="#"
            v-for="(value, key) in row.item[labelNames[1]]"
            @click="onFilterByLabel2(value)"
            variant="primary"
          >
            {{ value }}
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

        <div class="footer-links" v-html="footnoteAbreviations">
        </div>
        <div id="bottom" class="footer-links" v-html="footerLinksStandardsOrganizations">
        </div>
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
    "coverageColumnName",
    "numberOfSortableColumns",
    "invisibleColumns",
    "footerLinksStandardsOrganizations",
    "footnoteAbreviations",
    "columnsWithFooters",
    "columnsFooters"
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
      selectedCoverage: null,
      userFilters: [],
      userFiltersSelections: [],
      standardTypes: [],
      standardCoverages: [],
      pageOptions: [50, 100, 150],
      filter: null,
    };
  },
  computed: {
    /**
     * will return the filtered list after all filters have been applied
     */
    filteredItems: function filterItems() {
      let result = !!this.selectedLabel1
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

      result = !!this.selectedCoverage
        ? result.filter(item => {
            return item["Coverage"] === this.selectedCoverage;
          })
        : result;

      return result;
    },
    filteredLabels: function filterLabels() {
      let result = {};

      if (!this.selectedLabel1 && !this.selectedLabel2 && !this.selectedType && !this.selectedCoverage) {
        result = this.labels;
        result["standardTypes"] = this.standardTypes;
        result["standardCoverages"] = this.standardCoverages;
      } else {
        result[this.labelNames[0]] = [];
        result[this.labelNames[1]] = [];
        result["standardTypes"] = [];
        result["standardCoverages"] = [];

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
          result["standardCoverages"].indexOf(item.Coverage) === -1
            ? result["standardCoverages"].push(item.Coverage)
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
      this.formatHeaders(data.columnNamesList);
      this.formatLabels(data.columnNamesList);
      this.formatValues(data.columnNamesList, data.elements);
      this.standardTypes = this.formatStandardTypes(data.columnNamesList, data.elements, this.typeColumnName);
      this.standardCoverages = this.formatStandardTypes(data.columnNamesList, data.elements, this.coverageColumnName);
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
      this.selectedCoverage = null;
    },
    formatHeaders(columns) {
      let result = [];
      const footerIndicators = "abcdefghijklmnopqrstuvwxyz";
      let index = 0;
      let footerIndicatorsIndex = 0;
      let invisibleColumnsList = this.invisibleColumns.split(', ');

      columns.map(header => {
        if(invisibleColumnsList.indexOf(header.name) === -1) {
          let item = {
            key: header.name,
            label: addFooterIndication.call(this, header.name),
            displayName: header.name,
            // label: header.name,
            sortable: index < this.numberOfSortableColumns ? true : false,
            sortDirection: "desc"
          };
          result.push(item);
          index++;
        }
      });
      this.headers = result.slice();

      function addFooterIndication(item) {
        let result = item;
        let columnsWithFootersList = this.columnsWithFooters.split(', ');
        let columnsFootersList = this.columnsFooters.split('</span>');

        if(columnsWithFootersList.indexOf(item) > -1) {
          const footerNote = columnsFootersList.find(function(element) {
            return element.indexOf(`id="${item}"`) > -1;
          });
          result = ` ${item}
          <p class="tooltip-a"><sup> ${footerIndicators[footerIndicatorsIndex]}</sup>
            ${footerNote}</span>
          </p>
          `;
          footerIndicatorsIndex++;
        }
        return result;
      }
    },
    formatLabels(columns) {
      let result = {};
      columns.map(header => {
        header.subHeaders ? (result[header.name] = []) : null;
        if (header.subHeaders) {
          Object.keys(header.subHeaders).map(key => {
            let subHeaderName = header.subHeaders[key];
            result[header.name].push(subHeaderName);
          });
          this.labelNames.push(header.name);
        }
      });
      this.labels = Object.assign({}, result);
    },
    formatValues(columns, elements) {
      let result = [];
      elements.map(element => {
        let tempItem = {};

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
      const withHyperLinks = this.checkForHyperLinks(result);
      this.items = withHyperLinks.slice();
      this.totalRows = this.items.length;
    },
    checkForHyperLinks(items) {
      let result = items.slice();

      result.map((row) => {
        Object.keys(row).map((key) => {
          const element = row[`${key}-links`] ?
            replaceLink(row[key], row[`${key}-links`]) :
            row[key];
          row[key] = element;
        })
      })

      return result;

      function replaceLink(textToBeHyperLinked, textWithLink) {
        let text = textWithLink;
        let link = textWithLink.split('>')[1].split('<')[0];
        let resultTemp = textWithLink.replace(link, textToBeHyperLinked);
        resultTemp = resultTemp.replace(link, textToBeHyperLinked);
        const result = resultTemp.replace(textToBeHyperLinked, link);
        return result;
      }
    },
    formatStandardTypes(columns, elements, name) {
      let typeColumnCode = "";
      let result = [];

      columns.map(column => {
        if (column.name === name) {
          typeColumnCode = column.code;
        }
      });

      elements.map(element => {
        let typeName = element[typeColumnCode];
        result.indexOf(typeName) === -1 ? result.push(typeName) : null;
      });

      return result.slice();
    }
  }
};
</script>
