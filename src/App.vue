<template>
  <div class="container-fluid" v-cloak>
    <div class="row flex-xl-nowrap2">
      <div class="bd-content">
        <h1 class="text-center">{{title}}
        </h1>

        <div class="p-container" v-html="txt">
        </div>

        <!-- Table -->
        <gs-table 
          :spreadsheet-url="spreadsheetUrl"
          :spreadsheet-url-export="spreadsheetUrlExport"
          :type-column-name="typeColumnName"
          :number-of-sortable-columns="numberOfSortableColumns"
          :invisible-columns="invisibleColumns"
          :coverage-column-name="coverageColumnName"
          :footer-links-standards-organizations="footerLinksStandardsOrganizations"
          :footnote-abreviations="footnoteAbreviations"
          :columns-with-footers="columnsWithFooters"
          :columns-footers="columnsFooters"
        ></gs-table>
        
      </div>
    </div>
  </div>
</template>

<script>
import GSTable from './components/GSTable.vue';


export default {
  name: 'app',
  props: ['title', 'spreadsheetUrl', 'spreadsheetUrlExport', 'typeColumnName', 'coverageColumnName',
    'numberOfSortableColumns', 'invisibleColumns','txt', 'footerLinksStandardsOrganizations', 'footnoteAbreviations',
    'columnsWithFooters', 'columnsFooters'],
  components: {
    'gs-table': GSTable,
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  font-size: .9rem;
}
.p-container {
  padding-left: 20px;
  padding-right: 20px;
}
.p-container > p {
  margin-bottom: .25rem;
}
</style>
