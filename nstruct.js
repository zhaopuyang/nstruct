/*!
 *  nstruct JavaScript Library v1.0
 *  Author: zhaopuyang
 *  Date:   2019-08-05
 *  City:   Harbin in China
 */
'use scrict'
/**
 * define basetype and type data length
 */
const type_map = new Map();
type_map.set('UInt8', 1);
type_map.set('UInt16', 2);
type_map.set('UInt32', 4);
type_map.set('Int8', 1);
type_map.set('Int16', 2);
type_map.set('Int32', 4);
type_map.set('Float', 4);
type_map.set('Double', 8);
type_map.set('Char', 1);

function clone(obj) {
    var o;
    if (typeof obj == "object") {
        if (obj === null) {
            o = null;
        } else {
            o = {};
            for (var k in obj) {
                o[k] = clone(obj[k]);
            }
        }
    } else {
        o = obj;
    }
    return o;
};
/**
 * 
 * @param {*} struct     object template
 * @param {*} byteorder  Big endian or little endian mode default:Big('BE')
 */
function nstruct(struct, byteorder = 'BE') {
    return {
        _struct: struct,
        _structObject: clone(struct),
        _sizeofBytes: 0,
        _offsetIndex: 0,
        _byteorder: byteorder,
        __sizeof__: function (obj) {
            if (typeof obj === 'object') {
                for (var key in obj) {
                    this.__sizeof__(obj[key]);
                }
            }
            if (typeof obj === 'string') {
                var data = (/(\w+)(\[(\d+)\])*/g).exec(obj);
                if (data) {
                    var type_array_len = data[3];
                    this._sizeofBytes += (type_map.get(data[1])) * (type_array_len == undefined ? 1 : parseInt(type_array_len));
                }
            }
        },
        sizeof: function (obj) {
            this.__sizeof__(obj);
            var result = this._sizeofBytes;
            this._sizeofBytes = 0;
            return result;
        },
        __offset__: function (obj, field) {
            for (var key in obj) {
                if (key === field) {
                    return this._offsetIndex;
                }
                this._offsetIndex += this.sizeof(obj[key]);
            }
        },
        offset: function (obj, field) {
            this.__offset__(obj, field);
            var result = this._offsetIndex;
            this._offsetIndex = 0;
            return result;
        },
        /**
         * 
         * @param {*} buffer nodejs Buffer
         * @param {*} obj    object template
         * @param {*} structobject object template object instance
         */
        resolve: function (buffer, obj = this._struct, structobject = this._structObject) {
            if (buffer.length < this.sizeof(obj)) return "buffer is too short!";
            for (var key in obj) {
                var start = this.offset(obj, key);
                var end = start + this.sizeof(obj[key]);
                var buf_bytes = buffer.slice(start, end);
                if (typeof obj[key] === 'string') {
                    (/(\w+)(\[(\d+)\])*/g).exec(obj[key]);
                    var type = RegExp.$1;
                    var len = RegExp.$3;
                    var strbyteorder = type_map.get(type) != 1 ? this._byteorder : '';
                    if (len == "") {
                        if (type !== 'Char') {
                            structobject[key] = eval('buf_bytes.read' + type + (strbyteorder) + '()');
                        } else {
                            structobject[key] = buf_bytes.toString('ascii');
                        }
                    } else {
                        structobject[key] = [];
                        len = parseInt(len);
                        for (var i = 0; i < len; i++) {
                            if (type !== 'Char') {
                                structobject[key].push(eval('buf_bytes.read' + type + (strbyteorder) + '(' + i + ')'));
                            } else {
                                structobject[key].push(String.fromCharCode(buf_bytes[i]));
                            }
                        }
                    }
                } else if (typeof obj[key] === 'object') {
                    this.resolve(buf_bytes, obj[key], structobject[key]);
                }
            }
            return structobject;
        }
    }
}

module.exports = nstruct