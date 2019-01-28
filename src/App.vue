<template>
  <div class="container-fluid" v-cloak>
    <div class="row flex-xl-nowrap2">
      <div class="bd-content">
        <h1 class="text-center">{{title}}</h1>

        <!-- Table -->
        <gs-table 
          :title="title"
          :spreadsheet-url="spreadsheetUrl"
          :spreadsheet-url-export="spreadsheetUrlExport"
          :type-column-name="typeColumnName"
          :number-of-sortable-columns="numberOfSortableColumns"
        ></gs-table>
        
      </div>
    </div>
  </div>
</template>

<script>
import GSTable from './components/GSTable.vue';


export default {
  name: 'app',
  props: ['title', 'spreadsheetUrl', 'spreadsheetUrlExport', 'typeColumnName', 'numberOfSortableColumns'],
  components: {
    'gs-table': GSTable,
  },

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
}
</style>
