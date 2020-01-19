'use strict';
import { tsCoordinate } from 'src/app/shared/interfaces'

export const mapboxAccessToken: string = 'pk.eyJ1Ijoia2lzc2VuZ2VyIiwiYSI6ImNrMWYyaWZldjBtNXYzaHFtb3djaDJobmUifQ.ATRTeTi2mygBXAoXd42KSw';

export const KM_TO_MILE = 0.6213711922;
export const M_TO_FT = 3.28084;
export const EXPORT_FILE_SIZE_LIMIT = 100000;

// the following will eventually be set by user profile

export const units: {distance: 'miles' | 'kms', elevation: 'm' | 'ft'} = 
    {
        distance: 'miles',
        elevation: 'm'
    }

export const userHomeLocation: tsCoordinate = {lat: 51, lng: -4};

export const overlayLineStyle = {lineWidth: 2, lineColor: 'blue', lineOpacity: 0.3};
export const routeLineStyle = {lineWidth: 3, lineColor: 'red', lineOpacity: 0.5};