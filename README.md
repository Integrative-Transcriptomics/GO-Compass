
# Welcome to GO-Compass!

GO-Compass is a tool for the interactive comparison of GO enrichment analyses. Due to the structure of the GO graph there can be a lot of redundance in enrichment results, since enrichment of child terms propagates to parent terms. Therefore, GO-Compass clusters GO terms hierarchically based on their dispensability. Users can interactively select dispensability cutoffs to filter the data and to create flat clusters from the hierarchical clustering. 

## Data Input

### Required Files:

* **Enrichment data:** The results of an GO enrichment analysis in form of a table containing the p-values of the terms at different conditions **or** Multiple lists of genes for which the enrichment is performed by GO-Compass using the package goatools. If the result of a GO enrichment is uploaded, lists of genes are optional.
* **Background files:** One or multiple background files containing the genes with the associated GO terms. Multiple background files might be of interest when analyzing multiple species or in multi-omics comparisons.


### File Formats:

* **GO term input:** Tab seperated value (.tsv) file. First column needs to contain GO Terms (name of column "GoTerm") other columns contain p-values at conditions
* **Gene list input:** Simple line-break separated gene lists or a tsv if the genes are associated with values.
* **Background file:** Two column tsv. First column contains gene ids, second column contains semicolon separated GO Terms

Find example data [here](https://github.com/Integrative-Transcriptomics/GO-Compass/tree/master/gocompass/data).

Background lists can be downloaded (for example) at [http://genome2d.molgenrug.nl/](http://genome2d.molgenrug.nl/) 

### Semantic Similarity
GO-Compass clusters GO terms based on their semantic similarity. There are various definitions of semantic similarity. The simplest measure of semantic similarity is the shortest path between two GO terms A and B in the GO graph (Edge-distance measurement). A problem with this measure is that it assumes uniform distances in the graph. Since the GO-graph for all three ontologies is highly imbalanced, GO-Compass offers three other commonly used measures, the Resnik, Lin, and Wang semantic similarity. Resnik and Lin are IC-based methods based on annotation frequencies. The Wang method is graph-based and takes the semantics of all ancestors of the GO terms into account to calculate their similarity. 

We recommend using Wang's semantic similatity. The details of the semantic similarity measures are reviewed [here](https://doi.org/10.1093/bib/bbw067) [1]
## Component description

### Dispensability tree and cutoff selection
The tree visualizes the dispensability clustering created with the modified REVIGO algorithm. The nodes in the tree represent GO terms, positioned by their dispensability indicated on the x-axis. Two sliders in the tree can be used for selecting the data for the other visualizations. With the right slider, redundant terms can be filtered out. The left slider cuts the tree at a specific dispensability to produce flat clusters.

Next to each slider a number is shown indicating the number of flat clusters and the total number of GO terms currently visualized. Numbers next to the GO terms indicate the number of direct descendants of this term in the hierarchical clustering that are currently filtered out. 

The heatmap shows the negative logarithm of the p-values in the different lists using a color scale from white (high p-value) to red (low p-value). The p-values that pass the significance threshold defined by the user are indicated using a black dot in the center of the heatmap cell.
### Treemaps
For list-centered overviews, the significance of GO terms at each condition is visualized using treemaps. The size of a rectangle corresponds to the negative logarithm of the p-value. Rectangles representing GO terms with significant p-values receive a full color fill, non-significant GO terms are indicated with a striped fill. One condition is selected to be shown as the main treemap, while the others are visualized in small multiples.
### Summary visualizations
Two summary visualizations show the similarity of GO terms between the lists. The user can choose between visualizing the correlation of the p-values of the GO terms or the intersecting sets of significant GO terms across the lists. A correlation heatmap visualizes Pearson’s correlation of the p-values of GO terms between the lists regardless of the significance threshold. The set summary visualization shows the overlap of significantly enriched GO terms between the conditions. For less than three lists, a Venn diagram is used. For more than three lists an UpSet plot is visualized instead [2].
### Bar chart
By hovering over a cell in the correlation heatmap or over an intersection of the Venn diagram or UpSet plot, the GO terms can be compared in more detail in vertically juxtaposed bar charts, where each bar chart corresponds to one list.
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

## References

[1] Mazandu, Gaston K., Emile R. Chimusa, and Nicola J. Mulder. "Gene ontology semantic similarity tools: survey on features and challenges for biological knowledge discovery." Briefings in bioinformatics 18.5 (2017): 886-901.
[2] Conway, Jake R., Alexander Lex, and Nils Gehlenborg. "UpSetR: an R package for the visualization of intersecting sets and their properties." Bioinformatics (2017).