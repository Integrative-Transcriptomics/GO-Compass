library(plumber)
print(getwd())
plumb(file=paste0(getwd(),'/server/SemSimComputation.R'))$run(port=3001)



