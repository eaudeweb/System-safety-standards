# System-safety-standards

 * This is a simplified version of Tabletop.js from https://github.com/jsoma/tabletop
 * Changes where made to get the name of the column headers and to identify the sub-headers
 * It presumes that there is only one sheet
 * It uses vuejs to make the necessary data for the boostrap-vue table
 * Currently it uses our sheet on https://docs.google.com/spreadsheets/d/1H4LeCBrDhiO8SRmMaZVDFPft7TnZik89N11Qdwnr1Ic/edit#gid=0

 ## How to embed

`There is a folder named docs where the index.html file shows the way it can be done, without <iframe>`

### Using it as a widget without iframe:
1. a `<gsheet-vue-widget>` that will be the widget and will be used by Vuejs. It also has to be given some attributes to use in the app:

        <gsheet-vue-widget
          title="System safety standards"
          spreadsheet-url="https://docs.google.com/spreadsheets/d/1H4LeCBrDhiO8SRmMaZVDFPft7TnZik89N11Qdwnr1Ic/edit?usp=sharing"
          spreadsheet-url-export="https://docs.google.com/spreadsheets/d/1H4LeCBrDhiO8SRmMaZVDFPft7TnZik89N11Qdwnr1Ic/export?gid=0&format=xlsx"
          type-column-name=Type
          number-of-sortable-columns=4
        ></gsheet-vue-widget>

* __title__ the title to be shown in the widget
* __spreadsheet-url__ the full address of the published google sheet
* __spreadsheet-url-export__ the full address of the published google sheet with the desired termination used for download ex: `/export?gid=0&format=xlsx"` this will download as .xlsx
* __type-column-name="Type"__ we merged 3 tables into one by including a _type of standard_ column, we use this column for filtering, so that a user can see the content of a single table if they choose. `If this name will change in the google sheet, it aslo has to changed here`
* __number-of-sortable-columns="4"__ there isn't any information in the google sheet that will tell us which columns should be sortable, this way we consider the first few to be sortable, `so here the user sets the number, and in the google sheet, they need to put the columns in the correct order from left to right`

2. a `<script>` that will load the javascript file that will process everything. It is a bundle of every file needed including vue, boostrap-vue etc

        <script src=/js/app.824dcb6a.js></script>

* src="app.824dcb6a.js" this is the location of the script, it should be a full address

3. a `<style>` that will load all css needed for the table, bundled in one file
### It can also be deployed and inserted inside an `<iframe>`.

### Google Sheet use
1. The first row needs to be empty, always. The Google `/feeds/worksheets/` api doesn't return the names of the headers, so this is a way to correct that.
1. Other columns can be added.
1. `Keep only two columns with sub-headers` (like Market sectors)
1. The order of the columns can be changed, but keep in mind the sortable aspect.
1. Rows can be added.
1. Sub-headers can be added or edited.
1. The links must include `http` or `https` in order to be shown as links in the widget.
1. If a new sheet is added that will not show in the app.

### Creating your own Google Sheet:
* __Create a new sheet__: in Google Sheets page on url __https://docs.google.com/spreadsheets/u/0/__ create a new sheet
* Get the link
* It should be like this `https://docs.google.com/spreadsheets/d/[your ID]/edit[other params]` - this needs to be used for the embed
* __Publish to web__: File -> Publish to web
* In Link tab, select Entire Document and Web Page
* Leave the rest as is
* Click Publish and OK on the popup (the resulting link is not important for the app, it is the link that can be used to see the sheet as a webpage)
