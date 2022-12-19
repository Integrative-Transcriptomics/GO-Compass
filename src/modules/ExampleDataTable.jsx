import React from 'react';
import PropTypes from "prop-types";
import {Button, Link, Table, TableBody, TableCell, TableHead, TableRow} from "@material-ui/core";
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';

const ExampleDataTable = (props) => {
    return (<Table>
        <TableHead>
            <TableRow>
                <TableCell/>
                <TableCell>
                    Data set name
                </TableCell>
                <TableCell>Original study</TableCell>
                <TableCell>Number of lists</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Data</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            <TableRow>
                <TableCell>
                    <Button size="small" endIcon={<PlayArrowIcon/>}
                            onClick={props.loadMouse} variant={"contained"} disabled={props.isLoading}>Analyze
                        Data</Button>
                </TableCell>
                <TableCell>
                    Functional enrichment of antibiotic response in the mouse transcriptome
                </TableCell>
                <TableCell>
                    Lavelle, Aonghus, et al. "Baseline microbiota composition modulates antibiotic-mediated effects on
                    the gut microbiota and host." Microbiome 7.1 (2019): 1-13. <Link
                    href="https://doi.org/10.1186/s40168-019-0725-3" target="_blank"
                    rel="noopener noreferrer">https://doi.org/10.1186/s40168-019-0725-3</Link>
                </TableCell>
                <TableCell>5</TableCell>
                <TableCell>
                    The authors addressed the question how antibiotics change the transcriptome response across a time
                    window of 18 days in two mice. For this, they sampled RNA at four different time points (Day 0, 8,
                    11 and 18), analyzed the expression levels using microarrays and computed differentially expressed
                    genes between each time point. For each pairwise comparison with diff. expr. genes (five out of six)
                    a list of enriched GO terms was computed by the authors.
                </TableCell>
                <TableCell>
                    <Link
                        href="https://github.com/Integrative-Transcriptomics/GO-Compass/tree/master/gocompass/data/MusMusculus"
                        target="_blank" rel="noopener noreferrer">
                        <OpenInNewIcon/>
                    </Link>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell>
                    <Button size="small" variant={"contained"} endIcon={<PlayArrowIcon/>}
                            onClick={props.loadTreponema} disabled={props.isLoading}>Analyze Data</Button>
                </TableCell>
                <TableCell>
                    Genomic variability in the syphilis agent, Treponema pallidum </TableCell>
                <TableCell>
                    Pla-Díaz, Marta, et al. "Evolutionary processes in the emergence and recent spread of the syphilis
                    agent, Treponema pallidum." Molecular biology and evolution 39.1 (2022): msab318. <Link
                    href="https://doi.org/10.1093/molbev/msab318" target="_blank"
                    rel="noopener noreferrer">https://doi.org/10.1093/molbev/msab318</Link>
                </TableCell>
                <TableCell>3</TableCell>
                <TableCell>
                    A phylogenetic SNP tree was constructed from 76 T.pallidum samples and GO enrichment has been
                    conducted for genes associated with SNPs in three phylogenetic clades.
                </TableCell>
                <TableCell>
                    <Link
                        href="https://github.com/Integrative-Transcriptomics/GO-Compass/tree/master/gocompass/data/TreponemaPallidum"
                        target="_blank" rel="noopener noreferrer">
                        <OpenInNewIcon/>
                    </Link>
                </TableCell>
            </TableRow>
        </TableBody>
    </Table>)
};
ExampleDataTable.propTypes = {
    isLoading: PropTypes.bool.isRequired,
    loadMouse: PropTypes.func.isRequired,
    loadTreponema: PropTypes.func.isRequired,
};
export default ExampleDataTable;