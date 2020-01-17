import { tsCoordinate, pathStats, tsElevations } from 'src/app/shared/interfaces';
import { Path } from 'src/app/shared/classes/path-classes';


/**
 * Class to construct and operate on GeoJSON objects
 */
export class TsGeoJSON {

    private featureCollection = this.getEmptyFeatureCollection();
    
    constructor() {
    }

    /**
     * Returns a feature collection object with an empty features array
     */
    private getEmptyFeatureCollection() {

        return {
            "type": "FeatureCollection",
            "features": []
        };
    }

    // /**
    //  * Allows to add a lineString onto the features array of the geoJSON instance
    //  * @param path list of cooordinates either as a Path instance, or just a list of coordinates in an object
    //  */

    public addLineString(path: Path | Array<tsCoordinate>, elevations: tsElevations, pathStats?: pathStats) {

        let coordsList: Array<tsCoordinate> = path instanceof Path ? path.getCoords() : path;

        const lineString = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coordsList.map( c => [c.lng, c.lat])
            },
            "properties": {
                "params": {
                    "elev": elevations.elevs
                },
                "stats": pathStats,
                "info": {
                    "name": "",
                    "description": ""
                }
            }
            };

        this.featureCollection.features.push(lineString);
    }


    /** Allows a point feature to be added
     * @param p coordinate to add as tsCoordinate
     */
    addPoint(p: tsCoordinate) {
        return <GeoJSON.Feature> {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [p.lng, p.lat]
          },
          "properties": {}
        };
      }

    /**
     * Allows to remove a linestring from the features array at a given index position
     * @param index integer defining the position of the feature to remove
     */

    public remLineString(index: number = this.featureCollection.features.length - 1) {
        if (index > this.featureCollection.features.length - 1) { return 'invalid index'; }
        return this.featureCollection.features.splice(index, 1);
    }


    /**
     * Returns the featurecollection of the instance
     */
    public getFeatureCollection() {
        return <GeoJSON.FeatureCollection> this.featureCollection;
    }


}