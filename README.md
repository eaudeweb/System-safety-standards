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
        filter-columns="Type, Coverage, Market sectors, Life cycle stages"
        labels-variant="Market sectors:primary, Life cycle stages:warning"
        number-of-sortable-columns="4"
        invisible-columns="Coverage, Standard-links"
        columns-with-footers="Status, Further information, Life cycle stages"
        columns-footers='
                <span id="Status" class="tooltiptext">
                The year of the latest complete publication and/or amendment is given.
                </span>
                <span id="Further information" class="tooltiptext">
                The details on future work will not be final until the final voting on each individual standardisation project has taken place.
                </span>
                <span id="Life cycle stages" class="tooltiptext">
                Standards derived from the IEC 60335 series (the name usually includes
                “Household and similar electrical appliances – Safety”) cover explicitly only system design.
                These standards cover installation, operation and repair indirectly by specifying what is required to be
                written in the manuals of the appliances.
                This indirect coverage is indicated by “X” in the respective cells.
                </span>
        '
        txt='
                <p>
                This interactive tool presents a non-exhaustive list of international, 
                regional and national safety standards relevant to Refrigeration, Air-Conditioning and Heat Pump equipment developed 
                by relevant Standards Organizations
                <sup><a href="#bottom">1</a></sup>.
                </p>

                <p>
                The standards are broadly classified into two categories: Main system safety standards, subdivided into 
                <a
                class="tooltip-a"
                href="#"
                >Vertical system safety standards
                <span class="tooltiptext tooltip-a-center">
                Vertical system safety standards (also known as product standards) comprise safety aspects for a specific product or system, or a family of products or systems
                </span>
                </a>, and
                <a
                class="tooltip-a"
                href="#"
                >Horizontal system safety standards
                <span class="tooltiptext tooltip-a-center">
                Horizontal System safety standards (also known as group safety standard) comprise safety aspects applicable to several products or systems, or a family of similar products or systems
                </span>
                </a>
                and
                <a
                href="#"
                class="tooltip-a"
                >Supplementary standards
                <span class="tooltiptext tooltip-a-center">
                Supplementary standards support the main system safety standards for refrigeration, air-conditioning and heat-pump systems and appliances, for example, standards for refrigerant classification or standards for hazardous areas
                </span>
                </a>.
                </p>

                <p>
                To refine your search results, use more than one filter.
                </p>'
        footer-links-standards-organizations='
                <a
                target="_blank"
                href="https://www.iso.org"
                ><sup>1</sup>https://www.iso.org;
                </a>
                <a
                target="_blank"
                href="https://www.iec.ch/"
                >https://www.iec.ch/;
                </a>
                <a
                target="_blank"
                href="https://www.cencenelec.eu/Pages/default.aspx"
                >https://www.cencenelec.eu/Pages/default.aspx;
                </a>
                <a
                target="_blank"
                href="https://www.ul.com/"
                >https://www.ul.com/;
                </a>
                <a
                target="_blank"
                href="https://www.ansi.org/"
                >https://www.ansi.org/;
                </a>
                <a
                target="_blank"
                href="https://www.ashrae.org/;"
                >https://www.ashrae.org/;
                </a>
                <a
                target="_blank"
                href="http://www.chinacsrmap.org/"
                >http://www.chinacsrmap.org/
                </a>
        '
        footnote-abreviations='
                <i>Abbreviations</i>: AHSRAE - American Society of Heating, Refrigerating and Air-Conditioning Engineers, 
                ANSI – American National Standards Institute, EU – European Union, IEC – International Electrotechnical Commission, 
                EN – European Standard, IEC - International Electrotechnical Commission, ISO – International Standards Organization, 
                formerly known as Underwriters Laboratories.
        '
        ></gsheet-vue-widget>

* __title__ the title to be shown in the widget
* __spreadsheet-url__ the full address of the published google sheet
* __spreadsheet-url-export__ the full address of the published google sheet with the desired termination used for download ex: `/export?gid=0&format=xlsx"` this will download as .xlsx
* __number-of-sortable-columns="4"__ there isn't any information in the google sheet that will tell us which columns should be sortable, this way we consider the first few to be sortable, `so here the user sets the number, and in the google sheet, they need to put the columns in the correct order from left to right`
* __filter-columns__ the names of the columns that will be shown as filters, this order will be preferred in the app, the names must be exact as in the google sheet and must be separated by "," followed by one space (", "), ex: "Type, Coverage, Market sectors, Life cycle stages"
* __labels-variant__ the colour by which the labels will be shown, available are "primary, secondary, success, danger, warning, info, light, dark" (https://bootstrap-vue.js.org/docs/components/badge/#contextual-variations) ex: "Market sectors:primary, Life cycle stages:warning"
* __invisible-columns__ names of the columns that shouldn't appear in the app
* __columns-with-footers__ names of the columns with footers, that will be shown as tooltips
* __columns-footers__ the actual footers, this is html markup, we already have defined some css classes "tooltiptext, tooltip-a-center, tooltip-a". tooltip-a-center is only for centering the tooltip under the indicator. The id of the `<span>` should be the exact name of the column
* __txt__ the text above table, it is html, there is also and example of how to add a link to the footer
* __footer-links-standards-organizations__ the links that will be shown in the footer, this is html
* __footnote-abreviations__ the abbreviations in the footer, also html

2. a `<script>` that will load the javascript file that will process everything. It is a bundle of every file needed including vue, boostrap-vue etc

        <script src=/js/app.824dcb6a.js></script>

* src="app.824dcb6a.js" this is the location of the script, it should be a full address

3. a `<style>` that will load all css needed for the table, bundled in one file
### It can also be deployed and inserted inside an `<iframe>`.

### Google Sheet use
1. The first row needs to be empty, always. The Google `/feeds/worksheets/` api doesn't return the names of the headers, so this is a way to correct that.
1. Other columns can be added, even with subheaders.
1. Columns with links for other columns, to be shown as `hyperlinks` can be added but they have to have the same name followed by '-links'
1. The order of the columns can be changed
1. The order of the filters is taken from the order written in __filter-columns__ attribute in the widget
1. Rows can be added.
1. Sub-headers can be added or edited.
1. The links must include `http`, `https` or `www` in order to be shown as links in the widget.
1. If a new sheet is added that will not show in the app.

### Creating your own Google Sheet:
* __Create a new sheet__: in Google Sheets page on url __https://docs.google.com/spreadsheets/u/0/__ create a new sheet
* Get the link
* It should be like this `https://docs.google.com/spreadsheets/d/[your ID]/edit[other params]` - this needs to be used for the embed
* __Publish to web__: File -> Publish to web
* In Link tab, select Entire Document and Web Page
* Leave the rest as is
* Click Publish and OK on the popup (the resulting link is not important for the app, it is the link that can be used to see the sheet as a webpage)

## Development
This is a vuejs2 app with webpack 3, that uses the vue-custom-element package to create a widget.
It has livereload from webpack.

Requirements:
* nodejs at least 10 (10.15.0 used in the project, some earlier versions should also work, but they have not been tested)
* npm later than 6 (6.4.1 used)
* yarn 1.13.0 used

Installation:
* run in development mode

        yarn serve
* make build

        yarn build
the resulted build will be found in _/dist_ folder.

Development:
* The `index.html` file where the app is used as a widget is found in _/public_
All changes should be done here.
* `App.vue` is the main component, that wraps the app around the actual google sheet component. It also takes all the attributes and converts them into __props__ for the google sheet component.
* `GSTable.vue` takes the data provided by the `tableTop.js` file and formats it for the table.
* `tableTop.js` is the modified version, that treats data that is more complex (ex. headers with subheaders), it is made to consider only one sheet.

Publish to GitHub Pages (Github will look for _docs_ folder to load the statics it finds there):
* move the _/dist_ files in the _/docs_ folder
* modify the resulting index.html file (that is found in _/dist_) by replacing all src links to look into the same folder instead of looking in the root
        
        ex: '<link href=/css/app.dd3a6569.css ...' to '<link href=css/app.dd3a6569.css...'
* commit _/docs_ files to Github