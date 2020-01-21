import { tsCoordinate, pathStats } from 'src/app/shared/interfaces';
import { GeoService } from 'src/app/shared/services/geo.service';
import { TsGeoJSON } from 'src/app/shared/classes/geo-json'
import { Injector } from '@angular/core';

/** 
 * Path class to define a complete or partial route or track - it can be used standalone, or 
 * can be part if a MultiPath instance if it defines a segment of a more complex route/track
 * 
 */
export class Path {

    private stats: pathStats = {distance: 0, nPoints: 0};
    private geoService: GeoService;
    private coordinates: Array<tsCoordinate>;
    private elevs: Array<number>;
    
    constructor(coords: Array<tsCoordinate>, elevs: Array<number>) {

        //TODO: dont understand what this is!! 
        const injector = Injector.create({ providers: [ { provide: GeoService, deps: [] } ] });
        this.geoService = Object.getPrototypeOf(injector.get(GeoService));

        // class variables
        this.coordinates = coords;
        this.elevs = elevs;
        this.stats.distance = this.geoService.calculatePathDistance(this.coordinates);
        this.stats.nPoints = this.coordinates.length;
        this.stats.elevations = this.geoService.calculateElevationStats(this.elevs, this.stats.distance);
    }

    /**
     * Allows elevations to be set after the class has be instantiated
     * @param elevs elevations array
     */
    public setElevations(elevs: Array<number>) {
            this.elevs = elevs;
            this.stats.elevations = this.geoService.calculateElevationStats(this.elevs, this.stats.distance);
    }

    /**
     * Returns the coordinate array for the instance
     */
    public getCoords() {
        return this.coordinates;
    }

    /**
     * Returns the coordinate array for the instance
     */
    // public length() {
    //     return this.coordinates.length;
    // }

    /**
     * Returns the elevations array for the instance
     */
    public getElevs() {
        return this.elevs ? this.elevs : []
    }

    /**
     * Returns the path statistics for the instance
     */
    public getPathStats() {
        return this.stats;
    }

    
    /**
     * Gets the last coordinate from the instance
     */
    public getLastPoint() {
        return this.coordinates[this.coordinates.length-1];
    }

    /**
     * Returns a geoJSON feature collection for the current path (one feature)
     */
    public getGeoJSON() {
        const geoJSON = new TsGeoJSON();
        geoJSON.addLineString(this.coordinates, this.elevs);
        return geoJSON;
    }

}





/**
 * Multipath is simply an array of Path instances, with a stats object attached to keep track of the 
 * aggregated stats on each path
 */
export class MultiPath {

    private paths: Array<Path> = [];
    private firstPoint: tsCoordinate;
    private geoJSON: TsGeoJSON;
    private stats: pathStats;
    private coords: Array<tsCoordinate> = []; //flattened array of coordinates
    private elevs: Array<number> = [];

    constructor(firstPath?: Path) {
        if (firstPath) { this.addPath(firstPath); }
        this.geoJSON = new TsGeoJSON();
        this.resetPathStats();
    }
    

    /**
     * Returns the number of paths on the multipath array 
     */
    public nPaths() {
        return this.paths.length;
    }

    public resetPathStats() {
        this.stats = {
            distance: 0,
            nPoints: 0,
            elevations: 
              { ascent: 0,
                descent: 0,
                lumpiness: 0,
                maxElev: 0,
                minElev: 0 }
          };
    }

    /**
     * Set the firstPoint variable on the instance - useful when creating a path
     * @param fp first point as a tsCoordinate
     */
    public setFirstPoint(fp: tsCoordinate) {
        this.firstPoint = fp;
    }

    /**
     * Returns the firstPoint variable on the instance - useful when creating a path
     */
    public getFirstPoint() {
        return this.firstPoint;
    }


    /**
     * Gets the last point from the last path entry
     */
    public getLastPoint() {
        if (this.paths.length === 0) {
            return this.firstPoint;
        } else {
            return this.paths[this.paths.length-1].getLastPoint();
        }
    }

    /**
     * add a path to the multipath array, and update multipath stats
     * @param path path to add as Path instance
     */
    public addPath(path: Path) {
        this.paths.push(path);
        this.coords = this.coords.concat(path.getCoords());
        this.elevs = this.elevs.concat(path.getElevs());
        this.addStats(path.getPathStats());
        this.geoJSON.remLineString();
        this.geoJSON.addLineString( this.coords, this.elevs, this.getStats() );
    }

    /**
     * remove a path at a provided index (defaults to last entry if not provided)
     * @param index integer defining position to delete
     */
    public remPath(index: number = this.paths.length - 1) {
        const path = this.paths.splice(index, 1);
        this.coords = this.paths.reduce( (a, p) => a.concat(p.getCoords()), [] );
        this.elevs = this.paths.reduce( (a, p) => a.concat(p.getElevs()), [] );
        this.remStats(path[0].getPathStats());
        this.geoJSON.remLineString();
        this.geoJSON.addLineString( this.coords, this.elevs, this.getStats() );
    }

    /**
     * adds elevations to the last path on the array, then achieves stats update by:
     * 1) remove the stats for the path from the multiPath - this removes the non-elev stats
     * 2) add elevations to the path
     * 3) add the new stats back onto the multiPath - adds the distance back in plus new elevs
     * @param elevations array of elevations
     * @param index optional index of path to add to
     * specifying an index ensures that if points are clicked rapidly, the correct path is adjusted rather thaan
     * picking a new path that was added to the array in the meantime
     */
    // public addElevationsToPath(elevations: Array<number>, index: number = this.paths.length - 1) {
    //     this.remStats(this.paths[index].getPathStats());
    //     this.paths[index].setElevations(elevations);
    //     this.addStats(this.paths[index].getPathStats());
    // }

    /**
     * Add a provided pathstats object from a path instance to the pathstats on the multipath
     * @param pathStats pathstats object from the Path instance that was added to the multipath array
     */
    private addStats(pathStats: pathStats) {
        
        this.stats.distance += pathStats.distance;
        this.stats.nPoints += pathStats.nPoints;
        if (pathStats.elevations) {
            this.stats.elevations.ascent += pathStats.elevations.ascent;
            this.stats.elevations.descent += pathStats.elevations.descent;
            this.stats.elevations.maxElev += pathStats.elevations.maxElev;
            this.stats.elevations.minElev += pathStats.elevations.minElev;
            this.stats.elevations.lumpiness = (this.stats.elevations.ascent - this.stats.elevations.descent) / this.stats.distance;
        }
        
    }

    /**
     * Substract the provided pathstats object stats from a path instance to the pathstats on the multipath
     * @param pathStats pathstats object from the Path instance that was removed from the multipath array
     */
    private remStats(pathStats: pathStats) {
        
        this.stats.distance -= pathStats.distance;
        this.stats.nPoints -= pathStats.nPoints;
        if (pathStats.elevations) {
            this.stats.elevations.ascent -= pathStats.elevations.ascent;
            this.stats.elevations.descent -= pathStats.elevations.descent;
            this.stats.elevations.maxElev -= pathStats.elevations.maxElev;
            this.stats.elevations.minElev -= pathStats.elevations.minElev;
            this.stats.elevations.lumpiness = (this.stats.elevations.ascent - this.stats.elevations.descent) / this.stats.distance;
            this.paths.forEach( path => {
                // if (path) avoids an error which clicking map too fast for elevs to keep up - not sure of result but doesnt throw error!!
                const pathElevs = path.getPathStats().elevations;
            })
        }
        
    }


    public getGeoJSON() {
        return this.geoJSON.getFeatureCollection();
    }

    // simplifies a multipath GeoJSON (single path defined by multiple features) into a single feature
    // public getFlatCoordsAndElevs() {
    //     const coords = [].concat.apply([], this.paths.map( path => path.coordinates.map( c => [c.lng, c.lat]) ));
    //     const elevs  = [].concat.apply([], this.paths.map( path => path.elevations ));
    //     const elevations = {elevs, elevationStatus: 'A'}
    //     return {coords, elevations};
    // }

    public getStats() {
        return this.stats;
    }

}





