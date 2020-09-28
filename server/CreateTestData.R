library(GO.db)
library(rlist)

goterms <- 60
conditions <- 5
ontology <- "BP"

xx <- as.list(GOTERM)
filter <- sapply(xx, function(x) Ontology(x)==ontology)
filteredXX  <- xx[filter]
randomPick <- sample(1:length(filteredXX),goterms)
randomlySelected <- filteredXX[randomPick]
gos <- unlist(sapply(randomlySelected, function(x) GOID(x)))
names(gos)<-NULL
aureusGos <- c("GO:0009103","GO:0008653","GO:0006099","GO:0006189","GO:0046040","GO:0006188","GO:0009201","GO:0009145","GO:0009206","GO:0009205","GO:0009199","GO:0009060","GO:0009142","GO:0009168","GO:0009127","GO:0009167","GO:0009126","GO:0045333","GO:0015980","GO:0006412","GO:1901606","GO:0009141","GO:0009063","GO:0046034","GO:0009152","GO:0006164","GO:0016051","GO:0043043","GO:0072522","GO:0006091","GO:0006518","GO:0044262","GO:0018193","GO:0009260","GO:0006508","GO:0046390","GO:0019538","GO:0009150","GO:0046395","GO:0043604","GO:0044267","GO:0016054","GO:0043603","GO:0006163","GO:0005975","GO:0009259","GO:0072521","GO:0019693","GO:0044282","GO:0017144","GO:0044419","GO:0009117","GO:0016310","GO:1901293","GO:0006753","GO:0044248","GO:0009059","GO:0034645","GO:0009405","GO:0006796","GO:0010467","GO:0090407","GO:0044271","GO:0006793","GO:0019637","GO:1901137","GO:1901564","GO:0055086","GO:1901575","GO:0009056","GO:0044238","GO:0055114","GO:0043170","GO:1901566","GO:0044281","GO:1901135","GO:0044260","GO:0008152","GO:0071704","GO:1901576","GO:0009058","GO:0044249","GO:0006807","GO:0044237","GO:0008150","GO:0009987","GO:0034641","GO:0009987")

fakedata <- sapply(aureusGos, function(x){
  range <- rexp(2,15);
  return(runif(conditions,min(range),max(range)))
})
fakedata <- t(fakedata)
fakedata <- cbind(rownames(fakedata),fakedata)
rownames(fakedata) <- NULL
colnames(fakedata) <- c("GoTerm", 1:conditions)
write.table(fakedata,"AureoTestdata.tsv", sep="\t", row.names = FALSE)
