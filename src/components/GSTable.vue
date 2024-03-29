<template>
  <div id="table-gsheet">
    <!-- Filters -->
    <b-container fluid v-if="items && items.length > 0">
      <!-- User Interface controls -->
      <b-row>
        <b-col class="my-1 search-group-wrapper">
          <b-input-group prepend="Search">
            <b-form-input v-model="filter" placeholder="Search by key word, year, etc"></b-form-input>
          </b-input-group>
        </b-col>

        <b-col class="my-1 d-flex col-auto flex-wrap flex-sm-nowrap flex-column flex-sm-row">
          <a
            class="btn mb-0 btn-outline-primary btn-md filter-button"
            target="_blank"
            :href="spreadsheetUrlExport"
          >Export and Print</a>
          <b-button
            size="md"
            @click="onResetFilters"
            variant="outline-primary"
            class="mb-0 ml-sm-2 mt-2 mt-sm-0 filter-button"
          >Reset filters</b-button>
          <b-button
            size="md"
            @click="onResetSort"
            variant="outline-primary"
            class="mb-0 ml-sm-2 mt-2 mt-sm-0 filter-button"
          >Reset order</b-button>
        </b-col>
      </b-row>

      <b-row>
        <b-col
          v-for="filter in orderedUserFilters"
          md="auto"
          class="my-1"
          :key="Object.keys(filter)[0]"
        >
          <b-form-group
            horizontal
            :label="Object.keys(filter)[0].toUpperCase()"
            :label-cols="4"
            class="mb-0"
          >
            <b-form-select v-model="userFilters[Object.keys(filter)[0]].selected">
              <option :value="null" selected>Any ...</option>
              <option
                v-for="item in filteredLabels[Object.keys(filter)[0]]"
                :value="item"
                :key="item"
              >{{item}}</option>
            </b-form-select>
          </b-form-group>
        </b-col>
      </b-row>
      <!-- Fullscreen -->
      <div class="panel panel-default" :class="{'panel-fullscreen': fullscreen}">
        <div class="panel-heading">
          <ul class="list-inline panel-actions">
            <li>
              <a
                href="#"
                id="panel-fullscreen"
                role="button"
                title="Toggle fullscreen"
                @click.stop="() => {fullscreen = !fullscreen}"
              >
                <i
                  class="fas"
                  :class="{'fa-compress-arrows-alt': fullscreen, 'fa-arrows-alt': !fullscreen}"
                ></i>
              </a>
            </li>
          </ul>
        </div>

        <div class="panel-body">
          <div class="responsive-table">
            <!-- Main table element -->
            <b-table
              ref="vuetable"
              responsive
              striped
              hover
              show-empty
              stacked="md"
              :items="filteredItems"
              :fields="headers"
              :current-page="currentPage"
              :per-page="perPage"
              :filter="filter"
              @filtered="onFiltered"
              :sort-by.sync="sortBy"
            >
              <!-- All columns except labels (last two) will show the content as v-html (ex: hyperlinks) even if the content is plain text (basic tds)-->
              <template
                v-for="header in headers.slice(0, headers.length - labelNames.length)"
                :slot="header.displayName"
                slot-scope="data"
              >
                <span
                  v-html="data.value"
                  :key="header.label"
                ></span>
              </template>
              <!-- Label columns -->
              <template
                v-for="label in labelNames"
                :slot="label.name"
                slot-scope="row"
              >
                <b-badge
                  href="#"
                  v-for="(value, key) in row.item[label.name]"
                  @click="onFilterByLabel(row.item, label.name, value)"
                  :variant="label.variant"
                  :key="key"
                >{{ value }}</b-badge>
              </template>
            </b-table>
          </div>
          <!-- Table pagination -->
          <b-row class="m-0">
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
                <b-form-select
                  class="mr-sm-2"
                  :options="pageOptions"
                  v-model="perPage"
                ></b-form-select>
              </b-input-group>
            </b-col>
            <!-- Footnotes -->
            <div class="footer-links" v-html="footnoteAbbreviations"></div>
            <div id="bottom" class="footer-links" v-html="footerLinksStandardsOrganizations"></div>
          </b-row>
        </div>
      </div>
    </b-container>
  </div>
</template>

<script>
import TabelTop from "../lib/tableTop";
import debounce from "lodash.debounce";

let browserSizeRange = window.innerWidth;

export default {
  name: "GSTable",
  props: [
    "title",
    "spreadsheetUrl",
    "spreadsheetUrlExport",
    "numberOfSortableColumns",
    "invisibleColumns",
    "footerLinksStandardsOrganizations",
    "footnoteAbbreviations",
    "columnsWithFooters",
    "columnsFooters",
    "filterColumns",
    "labelsVariant"
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
      userFilters: [],
      pageOptions: [50, 100, 150],
      filter: null,
      sortBy: null,
      fullscreen: false
    };
  },
  computed: {
    /**
     * Filtered list of items by applying each filter on the previous filtering
     * {Object[]} this.items - array containing all rows
     * {string} this.items['Standard'] - value
     * {Object} this.userFilters - all filters as properties, with the selected value, on each property.
     * {string} this.userFilters['Type'] - type value.
     * @returns {Array} with the same structure as items, but as a copy and filtered
     */
    filteredItems: function filterItems() {
      let result = this.items.slice();

      Object.keys(this.userFilters).map(filterName => {
        const selectedFilterValue = this.userFilters[filterName].selected;
        // for each filter, will filter only those containing the value selected
        result = selectedFilterValue
          ? result.filter(item => {
              return item[filterName].indexOf(selectedFilterValue) > -1;
            })
          : result.slice();
      });

      return result;
    },
    /**
     * will search for the available filter options whithin the remaining items
     */
    filteredLabels: function filterLabels() {
      let result = {};

      this.filteredItems.map(item => {
        // search in all filtered items
        Object.keys(this.userFilters).map(filterName => {
          // search in all filters
          const filter = this.userFilters[filterName];

          filter.values.map(option => {
            // search in all options of a filter
            // option is found but the result either has not yet added the filter or the option has not been pushed in
            if (
              item[filterName].indexOf(option) > -1 &&
              (!result[filterName] || result[filterName].indexOf(option) === -1)
            ) {
              !result[filterName] ? (result[filterName] = []) : null;
              result[filterName].push(option);
            }
          });
        });
      });

      return result;
    },
    /**
     * this will preserve the user's intended order of filters, without affecting the logic of the rest of the app
     */
    orderedUserFilters: function orderedUserFilters() {
      let result = [];

      const userFilters = this.filterColumns.split(", ");
      userFilters.map(filterName => {
        let temp = {};
        temp[filterName] = this.userFilters[filterName];
        this.userFilters[filterName] ? result.push(temp) : null;
      });

      return result;
    }
  },
  created() {
    TabelTop.init({
      key: this.spreadsheetUrl,
      callback: this.formatSheetDataForTable,
      simpleSheet: false
    });

    this.adjustFootnotesForResolution();
  },
  methods: {
    /**
     * will remake the labels to show tooltip only for desktop table
     * will remove the tooltip from label if is rendered for mobile (<768px)
     */
    adjustFootnotesForResolution() {
      window.addEventListener(
        "resize",
        debounce(() => {
          const temp = this.headers.slice();

          if (window.innerWidth <= 768 && browserSizeRange >= 768) {
            temp.map(header => {
              header.label = header.displayName;
            });
            browserSizeRange = window.innerWidth;
            this.headers = temp.slice();
          } else if (window.innerWidth > 768 && browserSizeRange < 768) {
            temp.map(header => {
              header.label = header.labelWithFootnote;
            });
            browserSizeRange = window.innerWidth;
            this.headers = temp.slice();
          }
        }, 1000)
      );
    },
    /**
     * maked the headers, the labels and the items (rows)
     * {Array} this.headers - the headers used by the table
     * {Object} this.labels - only the columns that have sub columns, these will be treated as labels (coloured badges)
     * {Array} this.items - all the items
     * {Object} this.items - certain values found for each header
     * {string | Array} this.items[headerName] - value in cell, or labels that apply to it
     * {Object} this.userFilters - contains the actual filters with options and selected value
     * {Object} this.userFilters['Coverage'] - an example of a filter
     * {Array} this.userFilters['Coverage'].values - options for 'Coverage' filter
     * {string} this.userFilters['Coverage'].selected - selected option
     */
    formatSheetDataForTable(data) {
      this.headers = this.formatHeaders(data.columnNamesList);
      this.labels = this.formatLabels(data.columnNamesList);
      this.items = this.formatValues(data.columnNamesList, data.elements);
      this.totalRows = this.items.length;
      const userFilterNames = this.filterColumns.split(", ");
      const labelFilters = makeLabelFiltersList(this.labels, userFilterNames);
      const nonLabelFilters = makeNonLabelFiltersList.call(
        this,
        this.labels,
        userFilterNames
      );

      this.userFilters = Object.assign(labelFilters, nonLabelFilters);

      function makeLabelFiltersList(labels, filterNames) {
        let result = {};

        filterNames.map(filterName => {
          if (labels[filterName]) {
            result[filterName] = { selected: null, values: [] };
            result[filterName].values = labels[filterName].slice();
          }
        });

        return result;
      }
      function makeNonLabelFiltersList(labels, filterNames) {
        let result = {};

        filterNames.map(filterName => {
          if (!labels[filterName]) {
            result[filterName] = { selected: null, values: [] };
            result[filterName].values = this.formatStandardTypes(
              data.columnNamesList,
              data.elements,
              filterName
            );
          }
        });

        return result;
      }
    },
    /**
     * it makes the list of headers, considering if some are invisible and if they have some tooltips inside
     * @returns {Array} this.headers - the headers used by the table
     * @returns {string} this.headers.displayName - almost same as label, but this is can be altered if a link to footer is passed
     * @returns {string} this.headers.key - the name found by api
     * @returns {string} this.headers.label - same as displayName but this has to be as found in api to be able to match to items
     * @returns {string} this.headers.sortDirection - desc or asc
     * @returns {boolean} this.headers.sortable
     */
    formatHeaders(columns) {
      const footerIndicators = "abcdefghijklmnopqrstuvwxyz";
      let result = [];
      let index = 0;
      let footerIndicatorsIndex = 0;
      let invisibleColumnsList = this.invisibleColumns.split(", ");

      columns.map(header => {
        if (invisibleColumnsList.indexOf(header.name) === -1) {
          const labelWithFootnote = addFooterIndication.call(this, header.name);
          let item = {
            key: header.name,
            label: window.innerWidth > 768 ? labelWithFootnote : header.name,
            labelWithFootnote,
            displayName: header.name,
            sortable: index < this.numberOfSortableColumns ? true : false,
            sortDirection: "desc"
          };
          result.push(item);
          index++;
        }
      });
      return result.slice();

      function addFooterIndication(item) {
        let result = item;
        let columnsWithFootersList = this.columnsWithFooters.split(", ");
        let columnsFootersList = this.columnsFooters.split("</span>");

        if (columnsWithFootersList.indexOf(item) > -1) {
          const footerNote = columnsFootersList.find(function(element) {
            return element.indexOf(`id="${item}"`) > -1;
          });
          result = ` ${item}
          <p class="tooltip-a"><sup> ${
            footerIndicators[footerIndicatorsIndex]
          }</sup>
            ${footerNote}</span>
          </p>
          `;
          footerIndicatorsIndex++;
        }
        return result;
      }
    },
    /**
     * makes labels and labelNames that will also have a variant for colour
     * {Array} this.labelNames - array of labelNames
     * {string} this.labelNames.name - name of label
     * {string} this.labelNames - variant if provided by the user or default to 'primary'
     * @returns {Object} this.labels - only the columns that have sub columns, these will be treated as labels (coloured badges)
     * @returns {Array} this.labels['Life cycle stages'] - all subheaders from google sheet found by the api
     */
    formatLabels(columns) {
      let result = {};
      const labelsWithVariant = this.labelsVariant.split(", ");
      let labelsWithVariantObj = {};

      labelsWithVariant.map(item => {
        const labelName = item.split(":")[0];
        const labelVariant = item.split(":")[1];
        labelsWithVariantObj[labelName] = labelVariant;
      });
      columns.map(header => {
        header.subHeaders ? (result[header.name] = []) : null;
        if (header.subHeaders) {
          Object.keys(header.subHeaders).map(key => {
            let subHeaderName = header.subHeaders[key];
            result[header.name].push(subHeaderName);
          });
          this.labelNames.push({
            name: header.name,
            variant: labelsWithVariantObj[header.name] || "primary"
          });
        }
      });

      return Object.assign({}, result);
    },
    /**
     * will make row for the table considering if some have hyperlinks found in other tables that have the same name with '-links'
     * @returns {Array} this.items - all the items
     * @returns {Object} this.items - certain values found for each header
     */
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
      return withHyperLinks.slice();
    },
    checkForHyperLinks(items) {
      let result = items.slice();

      result.map(row => {
        Object.keys(row).map(key => {
          const element = row[`${key}-links`]
            ? replaceLink(row[key], row[`${key}-links`])
            : row[key];
          row[key] = element;
        });
      });

      return result;

      function replaceLink(textToBeHyperLinked, textWithLink) {
        let link = textWithLink.split(">")[1].split("<")[0];
        let resultTemp = textWithLink.replace(link, textToBeHyperLinked);
        resultTemp = resultTemp.replace(link, textToBeHyperLinked);
        const result = resultTemp.replace(textToBeHyperLinked, link);

        return result;
      }
    },
    /**
     * checks for filter options by collecting all the values for that filter in all the rows (items)
     */
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
    },
    onFiltered(filteredItems) {
      this.totalRows = filteredItems.length;
      this.currentPage = 1;
    },
    onFilterByLabel(item, labelName, value) {
      this.userFilters[labelName]
        ? (this.userFilters[labelName].selected = value)
        : null;
    },
    onResetFilters() {
      Object.keys(this.userFilters).map(filterName => {
        let filter = this.userFilters[filterName];
        filter.selected = null;
      });
    },
    onResetSort() {
      this.sortBy = null;
    }
  }
};
</script>
