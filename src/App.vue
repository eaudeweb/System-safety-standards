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
          :number-of-sortable-columns="numberOfSortableColumns"
          :invisible-columns="invisibleColumns"
          :footer-links-standards-organizations="footerLinksStandardsOrganizations"
          :footnote-abbreviations="footnoteAbbreviations"
          :columns-with-footers="columnsWithFooters"
          :columns-footers="columnsFooters"
          :filter-columns="filterColumns"
          :labels-variant="labelsVariant"
        ></gs-table>
        
      </div>
    </div>
  </div>
</template>

<script>
import GSTable from './components/GSTable.vue';


export default {
  name: 'app',
  props: ['title', 'spreadsheetUrl', 'spreadsheetUrlExport', 'numberOfSortableColumns', 'invisibleColumns',
    'txt', 'footerLinksStandardsOrganizations', 'footnoteAbbreviations',
    'columnsWithFooters', 'columnsFooters', 'filterColumns', 'labelsVariant'],
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
