import { tsCoordinate } from 'src/app/shared/interfaces';
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

        return <GeoJSON.FeatureCollection>{
            "type": "FeatureCollection",
            "features": []
        };
    }

    // /**
    //  * Allows to add a lineString onto the features array of the geoJSON instance
    //  * @param path list of cooordinates either as a Path instance, or just a list of coordinates in an object
    //  */

    public addLineString(path: Path | {coords: Array<tsCoordinate>}) {

        let coordsList: Array<tsCoordinate>;
        if (path instanceof Path) { coordsList = path.getCoords(); } 
        else { coordsList = path.coords; }

        const lineString: GeoJSON.Feature = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coordsList.map( c => [c.lng, c.lat])
            },
            "properties": {
                "name": ""
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

    public remLineString(index: number = this.featureCollection.features.length) {
        if (index > this.featureCollection.features.length) { return 'invalid index'; }
        return this.featureCollection.features.splice(index, 1);
    }


    /**
     * Returns the featurecollection of the instance
     */
    public getFeatureCollection() {
        return <GeoJSON.FeatureCollection> this.featureCollection;
    }


}