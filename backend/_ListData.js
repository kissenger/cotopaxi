
class ListData  {

  constructor(docs, c) {

    let out = [];
    docs.forEach( (d) => {

      out.push({
        name: d.info.name,
        stats: d.stats,
        category: d.info.category,
        direction: d.info.direction,
        pathType: d.info.pathType,
        startTime: d.startTime,
        creationDate: d.creationDate,
        isElevations: d.info.isElevations,
        isLong: d.info.isLong,
        pathId: d._id,
        count: c
      })
    })

    return out;

  }


}

module.exports = {
  ListData
}
