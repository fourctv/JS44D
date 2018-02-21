/*! https://mths.be/utf8js v2.1.2 by @mathias */
// @dynamic
export class Utf8 {


	// Taken from https://mths.be/punycode
	private static ucs2decode(string) {
		var output = [];
		var counter = 0;
		var length = string.length;
		var value;
		var extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	// Taken from https://mths.be/punycode
	private static ucs2encode(array) {
		var length = array.length;
		var index = -1;
		var value;
		var output = '';
		while (++index < length) {
			value = array[index];
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += String.fromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += String.fromCharCode(value);
		}
		return output;
	}

	private static checkScalarValue(codePoint) {
		if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
			throw Error(
				'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
				' is not a scalar value'
			);
		}
	}
	/*--------------------------------------------------------------------------*/

	private static createByte(codePoint, shift) {
		return String.fromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
	}

	private static encodeCodePoint(codePoint) {
		if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
			return String.fromCharCode(codePoint);
		}
		var symbol = '';
		if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
			symbol = String.fromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
		}
		else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
			Utf8.checkScalarValue(codePoint);
			symbol = String.fromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
			symbol += Utf8.createByte(codePoint, 6);
		}
		else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
			symbol = String.fromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
			symbol += Utf8.createByte(codePoint, 12);
			symbol += Utf8.createByte(codePoint, 6);
		}
		symbol += String.fromCharCode((codePoint & 0x3F) | 0x80);
		return symbol;
	}

	public static utf8encode(string) {
		var codePoints = Utf8.ucs2decode(string);
		var length = codePoints.length;
		var index = -1;
		var codePoint;
		var byteString = '';
		while (++index < length) {
			codePoint = codePoints[index];
			byteString += Utf8.encodeCodePoint(codePoint);
		}
		return byteString;
	}

	/*--------------------------------------------------------------------------*/

	private static readContinuationByte() {
		if (Utf8.byteIndex >= Utf8.byteCount) {
			throw Error('Invalid byte index');
		}

		var continuationByte = Utf8.byteArray[Utf8.byteIndex] & 0xFF;
		Utf8.byteIndex++;

		if ((continuationByte & 0xC0) == 0x80) {
			return continuationByte & 0x3F;
		}

		// If we end up here, it’s not a continuation byte
		throw Error('Invalid continuation byte');
	}

	private static decodeSymbol() {
		var byte1;
		var byte2;
		var byte3;
		var byte4;
		var codePoint;

		if (Utf8.byteIndex > Utf8.byteCount) {
			throw Error('Invalid byte index');
		}

		if (Utf8.byteIndex == Utf8.byteCount) {
			return false;
		}

		// Read first byte
		byte1 = Utf8.byteArray[Utf8.byteIndex] & 0xFF;
		Utf8.byteIndex++;

		// 1-byte sequence (no continuation bytes)
		if ((byte1 & 0x80) == 0) {
			return byte1;
		}

		// 2-byte sequence
		if ((byte1 & 0xE0) == 0xC0) {
			byte2 = Utf8.readContinuationByte();
			codePoint = ((byte1 & 0x1F) << 6) | byte2;
			if (codePoint >= 0x80) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 3-byte sequence (may include unpaired surrogates)
		if ((byte1 & 0xF0) == 0xE0) {
			byte2 = Utf8.readContinuationByte();
			byte3 = Utf8.readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
			if (codePoint >= 0x0800) {
				Utf8.checkScalarValue(codePoint);
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 4-byte sequence
		if ((byte1 & 0xF8) == 0xF0) {
			byte2 = Utf8.readContinuationByte();
			byte3 = Utf8.readContinuationByte();
			byte4 = Utf8.readContinuationByte();
			codePoint = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0C) |
				(byte3 << 0x06) | byte4;
			if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
				return codePoint;
			}
		}

		throw Error('Invalid UTF-8 detected');
	}

	private static byteArray;
	private static byteCount;
	private static byteIndex;

	public static utf8decode(byteString) {

		Utf8.byteArray = Utf8.ucs2decode(byteString);
		Utf8.byteCount = Utf8.byteArray.length;
		Utf8.byteIndex = 0;
		var codePoints = [];
		var tmp;
		while ((tmp = Utf8.decodeSymbol()) !== false) {
			codePoints.push(tmp);
		}
		return Utf8.ucs2encode(codePoints);
	}


}
