
## Welcome to "MultiGO"!

MultiGO is a tool for the interactive comparison of GO enrichment analyses. Due to the structure of the GO graph there can be a lot of redundance in enrichment results, since enrichment of child terms propagates to parent terms. Therefore, MultiGO clusters GO terms hierarchically based on their dispensability. Users can interactively select dispensability cutoffs to filter the data and to create flat clusters from the hierarchical clustering.  

To run MultiGO in the development environment run
### `conda env create -f environment.yml`
### `conda activate MultiGO`
### `npm install`
### `npm run dev`

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Data Input

MultiGO has two input options:

* The results of an GO enrichment analysis in form of a table containing the p-values of the terms at different conditions
* Multiple lists of genes for which the enrichment is performed by MultiGO using the package goatools

MultiGO also requires a background file containing the genes with the associated GO Terms for each species in the comparison. 

MultiGO supports the following file formats:

* Go term input: Tab seperated value (.tsv) file. First column needs to contain GO Terms (name of column "GoTerm") other columns contain p-values at conditions
* Gene list input: Simple line-break separated gene lists
* Backgound file: Two column tsv. First column contains gene ids, second column contains comma separated GO Terms

Background lists can be downloaded (for example) at [http://genome2d.molgenrug.nl/](http://genome2d.molgenrug.nl/) 