import { Pipe, PipeTransform } from "@angular/core";

/*
 * Convert a 4D Date string into Locale Date String 
 * Usage:
 *   value | fourDDateToLocaleString 
 * 
*/
@Pipe({name: 'fourDDateToString'})
export class FourDDateToString implements PipeTransform {
    transform(value): string {
        if (value) {
            if (typeof (value) === 'string' && value !== '') {
                const date = new Date(value.replace(/-/g, '\/'));
                return date.toLocaleDateString();
            } else return value.toLocaleDateString();
        } else return ''; // handle case where date field is null/undefined
      }
}
