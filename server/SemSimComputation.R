library(GOSemSim)
library(GO.db)
library(stringr)
library(rlist)
library(lsa)
library(Rook)
library(httr)
library(data.table)


# TODO: load background via API
table <-
  read.table(
    "/Users/harbig/Downloads/pantherGeneList (1).txt",
    sep = "\t",
    quote = ""
  )
table <- table[, c("V1", "V6", "V7", "V8")]

geneLists <- list()

counter <- 0


colnames(table) <- c("geneID", "MF", "BP", "CC")

MF <-
  sapply(table$MF, function(x)
    str_extract_all(string = x, pattern = "GO:+[0-9]{7}"))
BP <-
  sapply(table$BP, function(x)
    str_extract_all(string = x, pattern = "GO:+[0-9]{7}"))
CC <-
  sapply(table$CC, function(x)
    str_extract_all(string = x, pattern = "GO:+[0-9]{7}"))

names(MF) <- table$geneID
names(BP) <- table$geneID
names(CC) <- table$geneID

MF <- stack(MF)
BP <- stack(BP)
CC <- stack(CC)

geneBackground <- BP
GOfrequencies <- prop.table(table(BP$values))
parents <- as.list(GOBPPARENTS)
offspring <- as.list(GOBPOFFSPRING)
ontologyId <- "GO:0008150"


max <- 1

setBackground <- function(ontology) {
  if (ontology == "BP") {
    geneBackground <<- BP
    GOfrequencies <<- prop.table(table(BP$values))
    parents <<- as.list(GOBPPARENTS)
    offspring <<- as.list(GOBPOFFSPRING)
    ontologyId <<- "GO:0008150"
  } else if (ontology == "MF") {
    geneBackground <<- MF
    GOfrequencies <<- prop.table(table(MF$values))
    parents <<- as.list(GOMFPARENTS)
    offspring <<- as.list(GOMFOFFSPRING)
    ontologyId <<- "GO:0003674"
  } else{
    geneBackground <<- CC
    GOfrequencies <<- prop.table(table(CC$values))
    parents <<- as.list(GOCCPARENTS)
    offspring <<- as.list(GOCCOFFSPRING)
    ontologyId <<- "GO:0005575"
    
  }
}


getFrequency <- function(goid) {
  frequency = 0
  
  if (!is.na(offspring[[goid]][1])) {
    goOffspring <- GOID(GOTERM[offspring[[goid]]])
    goOffspring <- intersect(goOffspring, names(GOfrequencies))
    offSpringFrequencies <- unlist(GOfrequencies[goOffspring])
    frequency <- sum(offSpringFrequencies)
    
  }
  if (goid %in% names(GOfrequencies)) {
    frequency = frequency + GOfrequencies[goid]
  }
  return(frequency)
}

pca <- function(pvalues) {
  pca <- prcomp(t(pvalues), center = TRUE)
  coords <- as.data.frame(pca$x)
  percentage <- round(pca$sdev / sum(pca$sdev) * 100, 2)
  return(list("coords" = coords[c("PC1", "PC2")], "percentage" = percentage[c(1, 2)]))
}

iterateMatrix <- function(matrix, pvalues, cutoff) {
  GOList <- list()
  hierarchy <- list()
  
  treemapHierarchy <- list()
  
  avg <- colMeans(matrix)
  max <- 1
  range <- range(pvalues)
  maxDiff <- (range[2] - range[1]) * 0.05
  diag(matrix) <- -Inf
  max <- max(matrix)
  while (!is.null(nrow(matrix)))
  {
    maxElements <- which(matrix == max, arr.ind = TRUE)
    go1 <- rownames(matrix)[maxElements[1, "row"]]
    go2 <- colnames(matrix)[maxElements[1, "col"]]
    go1pvals <- pvalues[go1,]
    go2pvals <- pvalues[go2,]
    rejected <-
      testGOterms(go1,
                  go2,
                  go1pvals,
                  go2pvals,
                  maxDiff)
    toDelete <- rejected[['toDelete']]
    toKeep <- go1
    if (toDelete == go1) {
      toKeep <- go2
    }
    if (max > cutoff) {
      if (toDelete %in% names(hierarchy)) {
        if (toKeep %in% names(hierarchy)) {
          hierarchy[[toKeep]] = c(hierarchy[[toKeep]], hierarchy[[toDelete]], toDelete)
          hierarchy = hierarchy[names(hierarchy) != toDelete]
        } else{
          hierarchy[[toDelete]] = c(hierarchy[[toDelete]], toDelete)
          names(hierarchy)[names(hierarchy) == toDelete] <- toKeep
        }
      } else if (toKeep %in% names(hierarchy)) {
        hierarchy[[toKeep]] = c(hierarchy[[toKeep]], toDelete)
      } else{
        hierarchy[[toKeep]] <- list(toDelete)
      }
    } else {
      if (!toKeep %in% names(hierarchy)) {
        hierarchy[[toKeep]] <- vector()
      }
      if (!toDelete %in% names(hierarchy)) {
        hierarchy[[toDelete]] <- vector()
      }
      if (max > 0.15) {
        if (toDelete %in% names(treemapHierarchy)) {
          if (toKeep %in% names(treemapHierarchy)) {
            treemapHierarchy[[toKeep]] = c(treemapHierarchy[[toKeep]], treemapHierarchy[[toDelete]])
            treemapHierarchy = treemapHierarchy[names(treemapHierarchy) != toDelete]
          } else{
            treemapHierarchy[[toDelete]] = c(treemapHierarchy[[toDelete]], toKeep)
            names(treemapHierarchy)[names(treemapHierarchy) == toDelete] <-
              toKeep
          }
        } else if (toKeep %in% names(treemapHierarchy)) {
          treemapHierarchy[[toKeep]] = c(treemapHierarchy[[toKeep]], toDelete)
        } else{
          treemapHierarchy[[toKeep]] <- list(toKeep, toDelete)
        }
      } else{
        if (!toKeep %in% names(treemapHierarchy)) {
          treemapHierarchy[[toKeep]] <- list(toKeep)
        }
        if (!toDelete %in% names(treemapHierarchy)) {
          treemapHierarchy[[toDelete]] <- list(toDelete)
        }
      }
      
    }
    GOList[[toDelete]] <- list(
      "termID" = toDelete,
      "description" = Term(GOTERM[toDelete]),
      "frequency" = getFrequency(toDelete),
      "uniqueness" = 1 - avg[toDelete],
      "dispensability" = max,
      "rejection" = rejected[["reject"]],
      "pvalues" = -log10(pvalues[toDelete, ])
    )
    if (nrow(matrix) == 2) {
      GOList[[toKeep]] <- list(
        "termID" = toKeep,
        "description" = Term(GOTERM[toKeep]),
        "frequency" = getFrequency(toKeep),
        "uniqueness" = 1 - avg[toKeep],
        "dispensability" = max,
        "rejection" = "last",
        "pvalues" = -log10(pvalues[toKeep, ])
      )
    }
    matrix <-
      matrix[rownames(matrix) != toDelete, colnames(matrix) != toDelete]
    max <- max(matrix)
  }
  print("finished iterating")
  filtered <-
    lapply(GOList, function(x)
      x[x[["termID"]] %in% names(hierarchy)])
  pvals <- -log10(pvalues[names(filtered), ])
  names <- lapply(GOList, function(x)
    x[["termID"]])
  return(
    list(
      "data" = GOList,
      "conditions" = colnames(pvalues),
      "hierarchy" = hierarchy,
      "treemapHierarchy" = treemapHierarchy,
      "correlation" = cor(pvals),
      "pca" = pca(pvals)
    )
  )
}


testGOterms <- function(go1, go2, go1pvals, go2pvals, maxDiff) {
  frequency1 = getFrequency(go1)
  frequency2 = getFrequency(go2)
  # frequency check
  if (frequency1 > 0.05) {
    if (frequency2 > 0.05) {
      if (frequency2 > frequency1) {
        return(list("toDelete" = go2, "reject" = paste0("f ", go1)))
      } else{
        return(list("toDelete" = go1, "reject" = paste0("f ", go2)))
      }
    } else
      return(list("toDelete" = go1, "reject" = paste0("f ", go2)))
  } else{
    if (frequency2 > 0.05) {
      return(list("toDelete" = go2, "reject" = paste0("f ", go1)))
    }
    # p-value check
    else{
      filteredPvals <- which(abs(go1pvals - go2pvals) > maxDiff)
      filteredGo1 <- go1pvals[filteredPvals]
      filteredGo2 <- go2pvals[filteredPvals]
      if (length(which(filteredGo1 > filteredGo2)) >
          length(filteredPvals) / 2) {
        return(list(
          "toDelete" = go1,
          "reject" = paste0("pv ", go2)
        ))
      } else if (length(which(filteredGo1 < filteredGo2)) >
                 length(filteredPvals) / 2) {
        return(list(
          "toDelete" = go2,
          "reject" = paste0("pv ", go1)
        ))
      }
      # parent check
      else{
        go1parents <- GOID(GOTERM[parents[[go1]]])
        go2parents <- GOID(GOTERM[parents[[go2]]])
        if (go2 %in% go1parents) {
          go1Genes = geneBackground$ind[geneBackground$values == go1]
          go2Genes = geneBackground$ind[geneBackground$values == go2]
          if (length(go2Genes) * 0.75 <= length(intersect(go1Genes, go2Genes))) {
            return(list(
              "toDelete" = go2,
              "reject" = paste0("pa ", go1)
            ))
          } else
            return(list(
              "toDelete" = go1,
              "reject" = paste0("c ", go2)
            ))
          
        } else{
          # reject based on relationship
          if (go1 %in% go2parents) {
            # reject parent if parent consisits almost exclusively of child
            go1Genes = geneBackground$ind[geneBackground$values == go1]
            go2Genes = geneBackground$ind[geneBackground$values == go2]
            if (length(go1Genes) * 0.75 <= length(intersect(go1Genes, go2Genes))) {
              return(list(
                "toDelete" = go1,
                "reject" = paste0("pa ", go2)
              ))
              # reject child otherwise
            } else
              return(list(
                "toDelete" = go2,
                "reject" = paste0("c ", go1)
              ))
          }
          # random rejection
          else{
            set.seed(length(Term(GOTERM[go1])))
            if (runif(1) > 0.5) {
              return(list(
                "toDelete" = go1,
                "reject" = paste0("r ", go2)
              ))
            } else{
              return(list(
                "toDelete" = go2,
                "reject" = paste0("r ", go1)
              ))
            }
          }
        }
      }
    }
  }
}


#* Sends gene list file to server
#* @param file:file to send
#* @param condition condition of gene list
#* @post /sendFile
function(file, condition) {
  con <- textConnection(file)
  table <- read.table(con)
  
  genes <- paste0(table$V1, collapse = ",")
  geneLists[[condition]] <<- genes
}
#* Performs MultiRevio for gene lists
#* @param genome genome tu use
#* @param ontology ontology to consider
#* @param cutoff similarity cutoff
#* @param pvalueFilter filter for p-values
#' @serializer unboxedJSON
#* @post /MultiRevigoGeneLists
geneListRevigo <- function(genome, ontology, cutoff, pvalueFilter) {
  setBackground(ontology)
  
  enrichments <- lapply(geneLists, function(genes) {
    enrichmentCall <-
      GET(
        paste0(
          "http://pantherdb.org/services/oai/pantherdb/enrich/overrep?geneInputList=",
          genes,
          "&organism=",
          genome,
          "&annotDataSet=",
          ontologyId,
          "&enrichmentTestType=FISHER&correction=NONE"
        )
      )
    result <-
      content(enrichmentCall, "parsed")[['results']][['result']]
    result <-
      result[unlist(lapply(result, function(d)
        ! is.null(d[["term"]][['id']])))]
    pvalues <- unlist(lapply(result, function(d)
      d[['pValue']]))
    names <- unlist(lapply(result, function(d)
      d[['term']][['id']]))
    names(pvalues) <- names
    return(pvalues[order(names(pvalues))])
  })
  data <- do.call(cbind, enrichments)
  data <- cbind(data, GoTerm = rownames(data))
  rownames(data) <- NULL
  print("Finished GO enrichment")
  geneLists <<- list()
  
  multiRevigo(as.data.frame(data), ontology, cutoff, pvalueFilter)
}

# TODO: Provide multiple SemSim methods, provide multiple organisms
# Does Wang method work independently of organism?

#* Performs MultiRevio for data
#* @param data:file the data to analyze
#* @param ontology ontology to consider
#* @param cutoff similarity cutoff
#* @param pvalueFilter filter for p-values
#' @serializer unboxedJSON
#* @post /MultiRevigoGoList
function(data, ontology, cutoff, pvalueFilter) {
  print(data);
  setBackground(ontology)
  
  con <- textConnection(data)
  
  table <- read.table(con, header = T)
  
  multiRevigo(table, ontology, cutoff, pvalueFilter)
}

multiRevigo <- function(data, ontology, cutoff, pvalueFilter) {
  hsGO <-
    godata("org.EcK12.eg.db", ont = ontology, computeIC = FALSE)
  gos <- data[, "GoTerm"]
  data$GoTerm <- NULL
  data <- sapply(data, as.numeric)
  rownames(data) <- gos
  row.filter <- apply(data, 1, function(x) {
    all(x < 0.5)
  })
  data <- data[row.filter, ]
  row.filter <- apply(data, 1, function(x) {
    any(x < pvalueFilter)
  })
  data <- data[row.filter, ]
  data <- data[order(row.names(data)), ]
  print("create similarity matrix")
  similarityMatrix <-
    mgoSim(
      row.names(data),
      row.names(data),
      semData = hsGO,
      measure = "Wang",
      combine = NULL
    )
  print("finished creating similarity matrix")
  iterateMatrix(similarityMatrix, data, cutoff)
}
