function DictIntersection (dictA:any, dictB:any) {
  const intersection:any = {}
  for (let k in dictB) {
    if (k in dictA) {
      intersection[k] = dictA[k]
    }
  }
  return intersection
}

function DictDifference(dictA:any, dictB:any) {
  const diff = { ...dictA }
  for (let k in dictB) {
    delete diff[k]
  }
  return diff
}

export {DictDifference, DictIntersection}