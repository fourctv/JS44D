import { Injectable, Inject, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Base64 } from './base64';
import { Utf8 } from './utf8';


//
// Various Utility Functions useb by the code above
//
/**
 * convert object to encoded url string
 */
export let convertObjectToURL = function (obj: any) {
    const str: Array<any> = [];
    for (const p in obj) {
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
        }
    }
    return str.join('&');
};

/* tslint:disable: no-use-before-declare */
/**
 * Calculates hash code from URL string or POST form data
 */
export let calculateHash = function (formData: Object) {
    let value = '';
    for (const key in formData) {
        if (formData.hasOwnProperty(key)) {
            if (value !== '') { value += ','; }
            value += key + '=' + formData[key];
        }
    }

    // console.log('hash:' + value);
    return MD5.md5(value);
};
/* tslint */

/**
 * A collecion of static functions to communicate with 4D backend
 */
@Injectable()
export class FourDInterface {
    //
    // Global Properties
    //
    public static authentication: any;
    public static currentUser = '';
    public static currentUserID = 0;
    public static currentUserPassword = '';

    /**
      * 4D Web Server URL
      */
    public static fourDUrl = 'http://localhost:8080'; // defaults to the initiator URL, can be modified by the main app during development

    /**
     * current session key used in all http requests
     */
    public static sessionKey = '';

    /**
     * indicates if web app is running standalone or inside workspace
     */
    public static runningInsideWorkspace = false;

    /**
      * point to the HTTP service we'll use
      */
    public static http: HttpClient;

    //
    // cache variables 
    //
    private static _listCache: any = {};
    private static _registryCache: Array<any> = [];

    public static userHasSignedIn: EventEmitter<any> = new EventEmitter();


    /**
     * Generic function to call 4D backend using Angular2 HTTP 
     * 
     * 	@param fourdMethod: 4D's method name
     * 	@param body: the request body to send to 4D, an object that will be converted to URLSearchParams
     * 
     * @return returns a Promise for the database operation
     */
    public call4DRESTMethod(fourdMethod: string, body: any, options?: any): Observable<any> {
        body.Sessionkey = FourDInterface.sessionKey;
        body.hash = calculateHash(body);

        return FourDInterface.http.post(FourDInterface.fourDUrl + '/4DAction/' + fourdMethod, convertObjectToURL(body), options);

    }

    /**
     * Generic function to call 4D backend using Angular2 HTTP 
     * 
     * 	@param url: the utl request to proxy thru 4D
     * 
     * @return returns a Promise for the database operation
     */
    public proxyURLThru4D(url: string): Observable<any> {
        const body: any = { url: Base64.encode(Utf8.utf8encode(url)) };
        body.Sessionkey = FourDInterface.sessionKey;
        body.hash = calculateHash(body);

        return FourDInterface.http.post(FourDInterface.fourDUrl + '/4DAction/REST_ProxyHTTPGet',
            convertObjectToURL(body), {});

    }


    /**
     * Sign into 4D backend 
     * 
     * 	@param user: user name
     * 	@param pwd: MD5 password digest
     * 
     */
    public signIn(user, pwd): Promise<any> {
        FourDInterface.currentUser = user;
        FourDInterface.currentUserPassword = pwd;

        const body = { username: Base64.encode(Utf8.utf8encode(user)), password: Base64.encode(Utf8.utf8encode(pwd)) };

        return new Promise((resolve, reject) => {
            this.call4DRESTMethod('REST_Authenticate', body)
                .subscribe(resultJSON => {
                    if (resultJSON.valid) {
                        FourDInterface.authentication = resultJSON.session; // save authentication
                        FourDInterface.currentUserID = resultJSON.session.options._userID;
                        FourDInterface.sessionKey = resultJSON.session.key; // and the session ID we'll use from now on...

                        FourDInterface.userHasSignedIn.emit(FourDInterface.currentUser);

                        resolve(FourDInterface.authentication);

                    } else {
                        reject('Invalid username or password! ==> ' + resultJSON);
                    }
                },
                error => {
                    console.log('error:' + JSON.stringify(error));
                    reject(error);
                }
                );

        });
    }

    /**
     * Gets the values of a 4D Choice List.
     * 
     * 	@param listName the 4D Choice List name
     * 
     * @return returns a Promise for the database operation
     * 
     * <p><b>4D lists are cached to optimize traffic to/from 4D</b></p>
     * 
     **/
    public get4DList(listName: string): Promise<Array<string>> {
        if (FourDInterface._listCache[listName]) {
            return new Promise((resolve, reject) => { resolve(FourDInterface._listCache[listName]); });
        }

        const body: any = { list: listName };

        return new Promise((resolve, reject) => {
            this.call4DRESTMethod('REST_Get4DList', body)
                .subscribe(resultJSON => {
                    const listValues = resultJSON.values;
                    FourDInterface._listCache[listName] = listValues;
                    resolve(listValues);
                },
                error => {
                    console.log('error:' + JSON.stringify(error));
                    reject(error);
                });

        });

    }

    /**
     * Update values of a 4D Choice List
     * 
     * @param listName 4D choice list name
     * @param listValues array of list values to update on 4D side
     */
    public update4DList(listName: string, listItems: Array<string>): Promise<any> {
        const body: any = { listName: listName, listValues: Base64.encode(Utf8.utf8encode(JSON.stringify({ items: listItems }))) };

        return new Promise((resolve, reject) => {
            this.call4DRESTMethod('REST_Update4DList', body, { responseType: 'text' })
                .subscribe(
                response => { resolve(); },
                error => {
                    console.log('error:' + JSON.stringify(error));
                    reject(error);
                });

        });

    }

    /**
     * Retrieve a filtered 4D List from 4C-TV. Used to access a single level of a hierarchical 4D List.
     * 
      * 
     * @param listName 4D list name
     * @param selector the hierarchical selector, only items under that selector in the hierarchy will be returned
     * @return returns a Promise for the database operation
     * 
     */
    public getFiltered4DList(listName: string, selector: string): Promise<Array<string>> {

        const body: any = { Listname: listName, Selector: selector };

        return new Promise((resolve, reject) => {
            this.call4DRESTMethod('REST_GetFiltered4DList', body)
                .subscribe(resultJSON => {
                    resolve(resultJSON.values);
                },
                error => {
                    console.log('error:' + JSON.stringify(error));
                    reject(error);
                });

        });

    }

    /**
     * Function getRegistryValue: get current registry value
     * 
     * @param theClass the Registry Class to retrieve
     * @param theParameter the Registry Parameter to retrieve (optional, if blank gets all values for the Registry Class)
     * @param theDefaultValue a default value to return, in case the Registry entry is not defined in 4D
     * @param theSelector the Registry Selector to retrieve (optional, if blank gets all values for the Registry Class/Parameter)
     * 
     * @return returns a Promise for the database operation
     * 
     * <b>Retrieved Registry entries are cached in to optimize traffic to/from 4D </b>
     * 
     */
    public getRegistryValue(theClass: string,
        theParameter: string,
        theDefaultValue: string = '',
        theSelector: string = ''): Promise<string> {
        let item: any = {};
        for (item of FourDInterface._registryCache) {
            if (item.class === theClass && item.parameter === theParameter && item.selector === theSelector) {
                return new Promise((resolve, reject) => { resolve(item.registryValue); });
            }
        }

        const body: any = { class: theClass, parameter: theParameter, defaultValue: theDefaultValue, selector: theSelector };

        return new Promise((resolve, reject) => {
            this.call4DRESTMethod('REST_GetRegistryValue', body, { responseType: 'text' })
                .subscribe(
                response => {
                    body.registryValue = response;
                    FourDInterface._registryCache.push(body);
                    resolve(body.registryValue);
                },
                error => {
                    console.log('error:' + JSON.stringify(error));
                    reject(error);
                });

        });

    }


    /**
     * Function setRegistryValue: set a registry entry value
     * 
     * @param theClass the Registry Class to set
     * @param theParameter the Registry Parameter to set
     * @param theValue a Registry value to set
     * @param theSelector the Registry Selector to set (optional)
     * 
    */
    public setRegistryValue(theClass: string, theParameter: string, theValue: string, theSelector: string = ''): Promise<any> {
        const body: any = { class: theClass, parameter: theParameter, value: theValue, selector: theSelector };

        return new Promise((resolve, reject) => {
            this.call4DRESTMethod('REST_SetRegistryValue', body)
                .subscribe(
                response => {
                    resolve();
                },
                error => {
                    console.log('error:' + JSON.stringify(error));
                    reject(error);
                });

        });

    }

    /**
     * Converts a DOM date to 4D format (YYYYMMDD).
     *  
     * @param theDate a DOM date value
     * @return a 4D formatted date string (YYYYMMDD)
     * 
     */
    public dateTo4DFormat(theDate: Date): string {

        return theDate.toJSON().substr(0, 10).replace(/-/g, '');
    }

}


/**
 * MD5 has calculation
 */
export class MD5 {

    static hex_chr = '0123456789abcdef'.split('');

    static md5cycle(x, k) {
        let a = x[0], b = x[1], c = x[2], d = x[3];

        a = MD5.ff(a, b, c, d, k[0], 7, -680876936);
        d = MD5.ff(d, a, b, c, k[1], 12, -389564586);
        c = MD5.ff(c, d, a, b, k[2], 17, 606105819);
        b = MD5.ff(b, c, d, a, k[3], 22, -1044525330);
        a = MD5.ff(a, b, c, d, k[4], 7, -176418897);
        d = MD5.ff(d, a, b, c, k[5], 12, 1200080426);
        c = MD5.ff(c, d, a, b, k[6], 17, -1473231341);
        b = MD5.ff(b, c, d, a, k[7], 22, -45705983);
        a = MD5.ff(a, b, c, d, k[8], 7, 1770035416);
        d = MD5.ff(d, a, b, c, k[9], 12, -1958414417);
        c = MD5.ff(c, d, a, b, k[10], 17, -42063);
        b = MD5.ff(b, c, d, a, k[11], 22, -1990404162);
        a = MD5.ff(a, b, c, d, k[12], 7, 1804603682);
        d = MD5.ff(d, a, b, c, k[13], 12, -40341101);
        c = MD5.ff(c, d, a, b, k[14], 17, -1502002290);
        b = MD5.ff(b, c, d, a, k[15], 22, 1236535329);

        a = MD5.gg(a, b, c, d, k[1], 5, -165796510);
        d = MD5.gg(d, a, b, c, k[6], 9, -1069501632);
        c = MD5.gg(c, d, a, b, k[11], 14, 643717713);
        b = MD5.gg(b, c, d, a, k[0], 20, -373897302);
        a = MD5.gg(a, b, c, d, k[5], 5, -701558691);
        d = MD5.gg(d, a, b, c, k[10], 9, 38016083);
        c = MD5.gg(c, d, a, b, k[15], 14, -660478335);
        b = MD5.gg(b, c, d, a, k[4], 20, -405537848);
        a = MD5.gg(a, b, c, d, k[9], 5, 568446438);
        d = MD5.gg(d, a, b, c, k[14], 9, -1019803690);
        c = MD5.gg(c, d, a, b, k[3], 14, -187363961);
        b = MD5.gg(b, c, d, a, k[8], 20, 1163531501);
        a = MD5.gg(a, b, c, d, k[13], 5, -1444681467);
        d = MD5.gg(d, a, b, c, k[2], 9, -51403784);
        c = MD5.gg(c, d, a, b, k[7], 14, 1735328473);
        b = MD5.gg(b, c, d, a, k[12], 20, -1926607734);

        a = MD5.hh(a, b, c, d, k[5], 4, -378558);
        d = MD5.hh(d, a, b, c, k[8], 11, -2022574463);
        c = MD5.hh(c, d, a, b, k[11], 16, 1839030562);
        b = MD5.hh(b, c, d, a, k[14], 23, -35309556);
        a = MD5.hh(a, b, c, d, k[1], 4, -1530992060);
        d = MD5.hh(d, a, b, c, k[4], 11, 1272893353);
        c = MD5.hh(c, d, a, b, k[7], 16, -155497632);
        b = MD5.hh(b, c, d, a, k[10], 23, -1094730640);
        a = MD5.hh(a, b, c, d, k[13], 4, 681279174);
        d = MD5.hh(d, a, b, c, k[0], 11, -358537222);
        c = MD5.hh(c, d, a, b, k[3], 16, -722521979);
        b = MD5.hh(b, c, d, a, k[6], 23, 76029189);
        a = MD5.hh(a, b, c, d, k[9], 4, -640364487);
        d = MD5.hh(d, a, b, c, k[12], 11, -421815835);
        c = MD5.hh(c, d, a, b, k[15], 16, 530742520);
        b = MD5.hh(b, c, d, a, k[2], 23, -995338651);

        a = MD5.ii(a, b, c, d, k[0], 6, -198630844);
        d = MD5.ii(d, a, b, c, k[7], 10, 1126891415);
        c = MD5.ii(c, d, a, b, k[14], 15, -1416354905);
        b = MD5.ii(b, c, d, a, k[5], 21, -57434055);
        a = MD5.ii(a, b, c, d, k[12], 6, 1700485571);
        d = MD5.ii(d, a, b, c, k[3], 10, -1894986606);
        c = MD5.ii(c, d, a, b, k[10], 15, -1051523);
        b = MD5.ii(b, c, d, a, k[1], 21, -2054922799);
        a = MD5.ii(a, b, c, d, k[8], 6, 1873313359);
        d = MD5.ii(d, a, b, c, k[15], 10, -30611744);
        c = MD5.ii(c, d, a, b, k[6], 15, -1560198380);
        b = MD5.ii(b, c, d, a, k[13], 21, 1309151649);
        a = MD5.ii(a, b, c, d, k[4], 6, -145523070);
        d = MD5.ii(d, a, b, c, k[11], 10, -1120210379);
        c = MD5.ii(c, d, a, b, k[2], 15, 718787259);
        b = MD5.ii(b, c, d, a, k[9], 21, -343485551);

        x[0] = MD5.add32(a, x[0]);
        x[1] = MD5.add32(b, x[1]);
        x[2] = MD5.add32(c, x[2]);
        x[3] = MD5.add32(d, x[3]);

    }

    static cmn(q, a, b, x, s, t) {
        a = MD5.add32(MD5.add32(a, q), MD5.add32(x, t));
        return MD5.add32((a << s) | (a >>> (32 - s)), b);
    }

    static ff(a, b, c, d, x, s, t) {
        return MD5.cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    static gg(a, b, c, d, x, s, t) {
        return MD5.cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    static hh(a, b, c, d, x, s, t) {
        return MD5.cmn(b ^ c ^ d, a, b, x, s, t);
    }

    static ii(a, b, c, d, x, s, t) {
        return MD5.cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    static md51(s) {
        const n = s.length;
        const state = [1732584193, -271733879, -1732584194, 271733878];
        let i;
        for (i = 64; i <= s.length; i += 64) {
            MD5.md5cycle(state, MD5.md5blk(s.substring(i - 64, i)));
        }
        s = s.substring(i - 64);
        const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < s.length; i++) { tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3); }
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            MD5.md5cycle(state, tail);
            for (i = 0; i < 16; i++) { tail[i] = 0; }
        }
        tail[14] = n * 8;
        MD5.md5cycle(state, tail);
        return state;
    }

    /* there needs to be support for Unicode here,
     * unless we pretend that we can redefine the MD-5
     * algorithm for multi-byte characters (perhaps
     * by adding every four 16-bit characters and
     * shortening the sum to 32 bits). Otherwise
     * I suggest performing MD-5 as if every character
     * was two bytes--e.g., 0040 0025 = @%--but then
     * how will an ordinary MD-5 sum be matched?
     * There is no way to standardize text to something
     * like UTF-8 before transformation; speed cost is
     * utterly prohibitive. The JavaScript standard
     * itself needs to look at this: it should start
     * providing access to strings as preformed UTF-8
     * 8-bit unsigned value arrays.
     */
    static md5blk(s) { /* I figured global was faster.   */
        const md5blks = []; /* Andy King said do it this way. */
        for (let i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = s.charCodeAt(i)
                + (s.charCodeAt(i + 1) << 8)
                + (s.charCodeAt(i + 2) << 16)
                + (s.charCodeAt(i + 3) << 24);
        }
        return md5blks;
    }

    static rhex(n) {
        let s = '', j = 0;
        for (; j < 4; j++) {
            s += MD5.hex_chr[(n >> (j * 8 + 4)) & 0x0F]
                + MD5.hex_chr[(n >> (j * 8)) & 0x0F];
        }
        return s;
    }

    static hex(x) {
        for (let i = 0; i < x.length; i++) { x[i] = MD5.rhex(x[i]); }
        return x.join('');
    }

    static md5(s) {
        return MD5.hex(MD5.md51(MD5.str2rstr_utf8(s)));
    }

    /* this function is much faster,
     so if possible we use it. Some IEs
     are the only ones I know of that
     need the idiotic second function,
     generated by an if clause.  */

    static add32(a, b) {
        return (a + b) & 0xFFFFFFFF;
    }


    /*
    * Encode a string as utf-8.
    * For efficiency, this assumes the input is valid utf-16.
    */
    static str2rstr_utf8(input: string): string {
        let output = '';
        let i = -1;
        let x: number, y: number;

        while (++i < input.length) {
            /* Decode utf-16 surrogate pairs */
            x = input.charCodeAt(i);
            y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
            if (0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF) {
                x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
                i++;
            }

            /* Encode output as utf-8 */
            if (x <= 0x7F) {
                output += String.fromCharCode(x);
            } else if (x <= 0x7FF) {
                output += String.fromCharCode(0xC0 | ((x >>> 6) & 0x1F),
                    0x80 | (x & 0x3F));
            } else if (x <= 0xFFFF) {
                output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
                    0x80 | ((x >>> 6) & 0x3F),
                    0x80 | (x & 0x3F));
            } else if (x <= 0x1FFFFF) {
                output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
                    0x80 | ((x >>> 12) & 0x3F),
                    0x80 | ((x >>> 6) & 0x3F),
                    0x80 | (x & 0x3F));
            }
        }
        return output;
    }

}

export class FourDQuery {
    query?: Array<any>;
    union?: Array<any>;
    intersection?: Array<any>;
    custom?: string;
    joinTable?: string;
    joinPK?: string;
    joinFK?: string;
    join?: Array<any>;
}
