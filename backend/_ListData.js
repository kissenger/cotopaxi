
class ListData  {

  constructor(docs, c) {

    let out = [];
    docs.forEach( (d) => {

      out.push({
        // name: d.name.length === 0 ? d.category + ' ' + d.pathType : d.name,
        name: d.name,
        stats: d.stats,
        category: d.category,
        direction: d.direction,
        pathType: d.pathType,
        startTime: d.startTime,
        pathId: d._id,
        count: c
      })
    })


   return out

  }


}

module.exports = {
  ListData
}
