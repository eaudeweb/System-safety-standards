# System-safety-standards

 * This is a simplified version of Tabletop.js from https://github.com/jsoma/tabletop
 * Changes where made to get the name of the column headers and to identify the sub-headers
 * It presumes that there is only one sheet
 * It uses vuejs to make the necessary data for the boostrap-vue table
 * Currently it uses our sheet on https://docs.google.com/spreadsheets/d/1H4LeCBrDhiO8SRmMaZVDFPft7TnZik89N11Qdwnr1Ic/edit#gid=0

 ## How to embed


### Using it as a widget without iframe:
1. a `<div>` that will be the parent of the widget and will be used by Vuejs. It also has to be given some attributes to use in the app:

        <div
            id="app"
            v-cloak
            data-publicSpreadsheetUrl="https://docs.google.com/spreadsheets/d/1H4LeCBrDhiO8SRmMaZVDFPft7TnZik89N11Qdwnr1Ic/edit#gid=0"
            data-publicSpreadsheetUrlExportXlsx="https://docs.google.com/spreadsheets/d/1H4LeCBrDhiO8SRmMaZVDFPft7TnZik89N11Qdwnr1Ic/export?gid=0&format=xlsx"
            data-typeColumnName="Type"
            data-numberOfSortableHeaders="4"
            data-title="System safety standards"
        ></div>
* __id="app"__ is used by Vuejs
* __data-publicSpreadsheetUrl__ the full address of the published google sheet
* __data-publicSpreadsheetUrlExportXlsx__ the full address of the published google sheet with the desired termination used for download ex: `/export?gid=0&format=xlsx"` this will download as .xlsx
* __data-typeColumnName="Type"__ we merged 3 tables into one by including a type of standard column, we use this column for filtering so that a user can see the content of a single tables if they choose. `If this name will change in the google sheet, it aslo has to changed here`
* __data-numberOfSortableColumns="4"__ there isn't any information in the google sheet that will tell us which columns should be sortable, this way we consider the first few to be sortable, `so here the user sets the number, and in the google sheet, need to put them in the correct order from left to right`
* __data-title__ the title to show in the widget

2. a `<script>` that will load the javascript file that will process everything

        <script async src="main.js" charset="utf-8"></script>

* src="main.js" this is the location of the script, it cal also be a full address especially if it is embedded by using this way and not by inserting a published version of the widget inside an `<iframe>`
* inside the main.js there is a reference to a style.css file that will also need a full address of it

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