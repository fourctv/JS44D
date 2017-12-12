import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/*
 * Convert a Base64 Image string into an embedded Image URL 
 * Usage:
 *   value | base64ImageRef {:type}
 * Parameters:
 *   optional image type parameter, default is "jpeg"
*/
@Pipe({name: 'base64ImageRef'})
export class Base64ImageRef implements PipeTransform {
  transform(value: string, imageType: string = 'jpeg'): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl('data:image/'+imageType+';base64,'+value);
  }

  constructor(private sanitizer: DomSanitizer) {}
}