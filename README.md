
## Welcome to GO-Compass!

GO-Compass is a tool for the interactive comparison of GO enrichment analyses. Due to the structure of the GO graph there can be a lot of redundance in enrichment results, since enrichment of child terms propagates to parent terms. Therefore, GO-Compass clusters GO terms hierarchically based on their dispensability. Users can interactively select dispensability cutoffs to filter the data and to create flat clusters from the hierarchical clustering. 

### Data Input

#### GO-Compass requires at least one of the following files to run:

* **Enrichment data:** The results of an GO enrichment analysis in form of a table containing the p-values of the terms at different conditions **or** Multiple lists of genes for which the enrichment is performed by GO-Compass using the package goatools. If the result of a GO enrichment is uploaded, lists of genes are optional.
* **Background files:** One or multiple background files containing the genes with the associated GO terms. Multiple background files might be of interest when analyzing multiple species or in multi-omics comparisons.


#### GO-Compass supports the following file formats:

* **GO term input:** Tab seperated value (.tsv) file. First column needs to contain GO Terms (name of column "GoTerm") other columns contain p-values at conditions
* **Gene list input:** Simple line-break separated gene lists or a tsv if the genes are associated with values.
* **Background file:** Two column tsv. First column contains gene ids, second column contains semicolon separated GO Terms

Background lists can be downloaded (for example) at [http://genome2d.molgenrug.nl/](http://genome2d.molgenrug.nl/) 

## Running GO-Compass locally

To run GO-Compass in the development environment do the following:
cd to the directory where the venv should be located and create the venv.
```
cd <path/to/venv-parent-dir>
virtualenv <your-venv>
```
Install required Python packages by referring to the requirements.txt-file.
```
source <your-venv>/bin/activate
pip install <path/to/go-compass>/requirements.txt
```
Install required js packages using
```
npm install
```
run development environment
```
npm run dev
```
