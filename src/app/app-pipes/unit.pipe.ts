import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'units'
})
export class UnitPipe implements PipeTransform {
  transform(value: number, type: string, unitA: string, unitB?: string): string {

    const M_2_FT = 3.28084;
    const KM_2_MI = 0.62137;
    
    // if value is a distance, baseline is km
    if (type === 'distance') {
      if (unitA === 'km') { return value.toFixed(2) + 'km' }
      else if (unitA === 'miles') {return (value * KM_2_MI).toFixed(2) + 'mi'}

    // if value is an elevation, baseline is meters
    } else if (type === 'elevation') {
      if (unitA === 'm') { return value.toFixed(0) + 'm' }
      else if (unitA === 'ft') {return (value * M_2_FT).toFixed(0) + 'ft'}
    
    // if value is a lumpiness (elevation/height), baseline is m/km
    } else if (type === 'lumpiness') {

      // work out what output units should be
      let unitString = unitA + '/' + (unitB === 'miles' ? 'mi' : 'km');

      // check for errors
      if (typeof unitB === 'undefined') { return 'pipe error'; }
      else if (unitA !== 'ft' && unitA !== 'm') { return 'pipe error'; }
      else if (unitB !== 'miles' && unitB !== 'km') { return 'pipe error'; }

      // check for divide by 0 error
      if (isNaN(value)) { return '0' + unitString}

      if (unitA === 'm') {
        if (unitB === 'km' ) { return value.toFixed(2) + unitString}
        else if (unitB === 'miles') { return (value / KM_2_MI).toFixed(2) + unitString}
      } else if (unitA === 'ft') {
        if (unitB === 'km' ) { return (value * M_2_FT).toFixed(2) + unitString}
        else if (unitB === 'miles') { return (value * M_2_FT / KM_2_MI).toFixed(2) + unitString}        
      }
    }
  }
}
