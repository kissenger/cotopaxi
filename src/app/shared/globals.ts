'use strict';
import { TsCoordinate, TsUnits, TsLineStyle } from 'src/app/shared/interfaces';

export const mapboxAccessToken = 'pk.eyJ1Ijoia2lzc2VuZ2VyIiwiYSI6ImNrMWYyaWZldjBtNXYzaHFtb3djaDJobmUifQ.ATRTeTi2mygBXAoXd42KSw';

export const KM_TO_MILE = 0.6213711922;
export const M_TO_FT = 3.28084;
export const EXPORT_FILE_SIZE_LIMIT = 100000;
export const LONG_PATH_THRESHOLD = 1000;

export const links = {
    wiki: {
        elevations: 'https://github.com/kissenger/cotopaxi/wiki/Elevations'
    }
};

// the following will eventually be set by user profile

export const units: TsUnits = {
        distance: 'miles',
        elevation: 'm'
      };

export const userHomeLocation: TsCoordinate = {lat: 51, lng: -4};

// lineStyles are defined here and on geoJSON - when specified locally they will override the geoJSON lineStyle
// export const overlayLineStyle = {lineWidth: 2, lineColour: 'blue', lineOpacity: 0.3};
export const routeLineStyle: TsLineStyle = {lineWidth: 4, lineColour: 'red', lineOpacity: 0.5};
export const overlayLineStyle: TsLineStyle = {lineWidth: 2, lineColour: 'red', lineOpacity: 0.3};
export const createRouteLineStyle: TsLineStyle = {lineWidth: 2, lineColour: 'red', lineOpacity: 1.0};
// export const routeReviewLineStyle: TsLineStyle = {lineWidth: 2, lineColour: 'red', lineOpacity: 1.0};
