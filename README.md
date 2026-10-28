
# Welcome to GO-Compass!

GO-Compass is a tool for the interactive comparison of GO enrichment analyses. Due to the structure of the GO graph there can be a lot of redundance in enrichment results, since enrichment of child terms propagates to parent terms. Therefore, GO-Compass clusters GO terms hierarchically based on their dispensability. Users can interactively select dispensability cutoffs to filter the data and to create flat clusters from the hierarchical clustering. 

## Data Input

### Required Files:

* **Enrichment data:** The results of an GO enrichment analysis in form of a table containing the p-values of the terms at different conditions **or** Multiple lists of genes for which the enrichment is performed by GO-Compass using the package goatools. If the result of a GO enrichment is uploaded, lists of genes are optional.
* **Background files:** One or multiple background files containing the genes with the associated GO terms. Multiple background files might be of interest when analyzing multiple species or in multi-omics comparisons.


### File Formats:

* **GO term input:** Tab seperated value (.tsv) file. First column needs to contain GO Terms (name of column "GoTerm") other columns contain p-values at conditions.
* **Gene list input:** Simple line-break separated gene lists or a tsv if the genes are associated with values.
* **Background file:** Two column tsv. First column contains gene ids, second column contains semicolon separated GO Terms.

Find example data [here](https://github.com/Integrative-Transcriptomics/GO-Compass/tree/master/gocompass/data). Background lists can be downloaded (for example) at [http://genome2d.molgenrug.nl/](http://genome2d.molgenrug.nl/).

### Semantic Similarity

GO-Compass clusters GO terms based on their semantic similarity. There are various definitions of semantic similarity. The simplest measure of semantic similarity is the shortest path between two GO terms A and B in the GO graph (Edge-distance measurement). A problem with this measure is that it assumes uniform distances in the graph. Since the GO-graph for all three ontologies is highly imbalanced, GO-Compass offers three other commonly used measures, the Resnik, Lin, and Wang semantic similarity. Resnik and Lin are IC-based methods based on annotation frequencies. The Wang method is graph-based and takes the semantics of all ancestors of the GO terms into account to calculate their similarity. 

We recommend using Wang's semantic similatity. The details of the semantic similarity measures are reviewed [here](https://doi.org/10.1093/bib/bbw067) [1].

## Component Description

### Dispensability Tree and Cutoff Selection

The tree visualizes the dispensability clustering created with the modified REVIGO algorithm. The nodes in the tree represent GO terms, positioned by their dispensability indicated on the x-axis. Two sliders in the tree can be used for selecting the data for the other visualizations. With the right slider, redundant terms can be filtered out. The left slider cuts the tree at a specific dispensability to produce flat clusters.

Next to each slider a number is shown indicating the number of flat clusters and the total number of GO terms currently visualized. Numbers next to the GO terms indicate the number of direct descendants of this term in the hierarchical clustering that are currently filtered out. 

The heatmap shows the negative logarithm of the p-values in the different lists using a color scale from white (high p-value) to red (low p-value). The p-values that pass the significance threshold defined by the user are indicated using a black dot in the center of the heatmap cell.

### Treemaps

For list-centered overviews, the significance of GO terms at each condition is visualized using treemaps. The size of a rectangle corresponds to the negative logarithm of the p-value. Rectangles representing GO terms with significant p-values receive a full color fill, non-significant GO terms are indicated with a striped fill. One condition is selected to be shown as the main treemap, while the others are visualized in small multiples.

### Summary Visualizations

Two summary visualizations show the similarity of GO terms between the lists. The user can choose between visualizing the correlation of the p-values of the GO terms or the intersecting sets of significant GO terms across the lists. A correlation heatmap visualizes Pearson’s correlation of the p-values of GO terms between the lists regardless of the significance threshold. The set summary visualization shows the overlap of significantly enriched GO terms between the conditions. For less than three lists, a Venn diagram is used. For more than three lists an UpSet plot is visualized instead [2].

### Bar Chart

By hovering over a cell in the correlation heatmap or over an intersection of the Venn diagram or UpSet plot, the GO terms can be compared in more detail in vertically juxtaposed bar charts, where each bar chart corresponds to one list.

## Provenance Tracking and Session Management

GO-Compass supports provenance tracking based on the [trrack-vis](https://www.npmjs.com/package/@visdesignlab/trrack-vis) library. This functionality allows users to import and export sessions, track their analysis steps and decisions, and navigate their action history, enhancing reproducibility and transparency in their research workflow.

### Session Import and Export
   - Export the current session using the **Export Session** button in the title bar (left side).
   - Restore a previously saved session using the **Import Session** button.

### Action History Timeline
   - An action recovery bar in the center of the title bar displays the current position in the action history.
   - The timeline follows the pattern: `Previous Action → Current Action → Next Action`.

### Undo and Redo
   - Navigate through the action history using the dedicated **Undo** and **Redo** buttons in the title bar.
   - Alternatively, use the following keyboard shortcuts:
     - **Undo:** `Ctrl + Z`
     - **Redo:** `Ctrl + Y`

### Interactive Provenance Graph
   - Visualize the recorded action history as an interactive graph.
   - Open the graph using the **Graph** button in the title bar or by pressing `G`.
   - The graph appears in a drawer along the right edge of the screen.
   - Each node represents the application state reached after a provenance-enabled action and is labeled with the same descriptive text displayed in the action history timeline.

## Running GO-Compass Locally

### Docker

The current version of GO-Compass is deployed as a Docker container. To run the container, first install [Docker](https://docs.docker.com/get-docker/). Then, clone the repository and run the following command in the project root:

```bash
docker build --tag gocompass .
```

Start the container:

```bash
docker run -dp 127.0.0.1:5000:5000 gocompass
```

Stop the container:

```bash
docker ps -a --filter ancestor=gocompass --format='{{.ID}}' | xargs docker stop
```

### Development

To run GO-Compass in a development environment, we recommend using a virtual environment to avoid package conflicts, for example using `conda`:

```bash
conda create -n go-compass python=3.12
conda activate go-compass
```

Next, install required Python packages by referring to the requirements.txt-file (from the project root):

```bash
python -m pip install -r gocompass/requirements.txt
python -m pip install -e .
python -m pip check
```

Install required JavaScript packages (tested using `Node.js v24.12.0` and `yarn v1.22.22`):

```bash
corepack enable
yarn install
```

Start the development environment:

```bash
yarn dev
```

## References

<sup>[1] Mazandu, Gaston K., Emile R. Chimusa, and Nicola J. Mulder. "Gene ontology semantic similarity tools: survey on features and challenges for biological knowledge discovery." Briefings in bioinformatics 18.5 (2017): 886-901.</sup>

<sup>[2] Conway, Jake R., Alexander Lex, and Nils Gehlenborg. "UpSetR: an R package for the visualization of intersecting sets and their properties." Bioinformatics (2017).</sup>