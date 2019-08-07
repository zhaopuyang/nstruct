/*!
 *  nstruct JavaScript Library v1.0
 *  Author: zhaopuyang
 *  Date:   2019-08-07
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

/**
 * 
 * @param {*} order (BE:big Endian  |   LE:little Endian)
 */
function NStruct(order = 'BE') {
    this.$order = order;
}

var fn = NStruct.prototype;

/**
 *   clone object
 */
fn.clone = function (obj) {
    var o;
    if (typeof obj == "object") {
        if (obj === null) {
            o = null;
        } else {
            o = {};
            for (var k in obj) {
                o[k] = this.clone(obj[k]);
            }
        }
    } else {
        o = obj;
    }
    return o;
}

/**
 *   verify type in template
 */
fn.verify = function (template) {
    if (typeof template !== 'object') {
        (/(\w+)(\[(\d+)\])*/g).exec(template);
        var type = RegExp.$1;
        if (!type_map.has(type)) {
            throw new Error('Error type found in template!')
        }
        return;
    }
    Object.keys(template).forEach(key => {
        if (typeof template[key] !== 'object') {
            (/(\w+)(\[(\d+)\])*/g).exec(template[key]);
            var type = RegExp.$1;
            if (!type_map.has(type)) {
                throw new Error('Error type found in template!')
            }
        } else {
            this.verify(template[key]);
        }
    })
}
/**
 *   calculate bytes of template
 */
fn.sizeof = function (template) {
    this.verify(template);
    if (typeof template !== 'object') {
        (/(\w+)(\[(\d+)\])*/g).exec(template);
        var type = RegExp.$1;
        var type_array_len = RegExp.$3;
        var size = type_array_len == "" ? type_map.get(type) : type_map.get(type) * parseInt(type_array_len);
        return size;
    }
    template.$size = 0;
    for (var key in template) {
        if (key == '$size') continue;
        if (typeof template[key] !== 'object') {
            (/(\w+)(\[(\d+)\])*/g).exec(template[key]);
            var type = RegExp.$1;
            var type_array_len = RegExp.$3;
            if (type_array_len == "") {
                template.$size += type_map.get(type);
            } else {
                template.$size += type_map.get(type) * parseInt(type_array_len);
            }
        } else {
            template.$size += this.sizeof(template[key]);
        }
    }
    var size = template.$size;
    delete template.$size;
    return size;
}
/**
 *   calculate field offset in template
 */
fn.offset = function (template, field) {
    this.verify(template);
    if (typeof template !== 'object') {
        throw new Error('template must be an object type!')
    }
    var index = 0;
    for (var key in template) {
        if (key === field) break;
        index += this.sizeof(template[key]);
    }
    return index;
}
/**
 *   convert to struct from buffer
 */
fn.bufferToStruct = function (buffer, template) {
    if (this.sizeof(template) > buffer.length) {
        throw new Error('buffer is too short!');
    }
    var struct = this.clone(template);
    for (var key in template) {
        var start = this.offset(template, key);
        var end = start + this.sizeof(template[key]);
        var buf_bytes = buffer.slice(start, end);
        if (typeof template[key] === 'object') {
            struct[key] = this.bufferToStruct(buf_bytes, template[key]);
        } else {
            (/(\w+)(\[(\d+)\])*/g).exec(template[key]);
            var type = RegExp.$1;
            var len = RegExp.$3;
            var strbyteorder = type_map.get(type) != 1 ? this.$order : '';
            if (len == "") {
                struct[key] = (type !== 'Char') ? eval('buf_bytes.read' + type + (strbyteorder) + '()') : buf_bytes.toString('ascii');
            } else {
                struct[key] = [];
                len = parseInt(len);
                for (var i = 0; i < len; i++) {
                    (type !== 'Char') ? struct[key].push(eval('buf_bytes.read' + type + (strbyteorder) + '(' + i + ')')): struct[key].push(String.fromCharCode(buf_bytes[i]));
                }
            }
        }
    }
    return struct;
}
/**
 *  convert to buffer from struct
 */
fn.structToBuffer = function (struct, template) {
    var buffer = Buffer.alloc(this.sizeof(template));
    for (var key in template) {
        var start = this.offset(template, key);
        var end = start + this.sizeof(template[key]);
        var subarray_buffer = buffer.subarray(start, end);
        if (typeof template[key] === 'object') {
            var obj_buffer = this.structToBuffer(struct[key], template[key]);
            var index = 0;
            for (var value of obj_buffer.values()) {
                subarray_buffer[index++] = value;
            }
        } else {
            (/(\w+)(\[(\d+)\])*/g).exec(template[key]);
            var type = RegExp.$1;
            var len = RegExp.$3;
            var strbyteorder = type_map.get(type) != 1 ? this.$order : '';
            if (len == "") {
                (type !== 'Char') ? eval('subarray_buffer.write' + type + (strbyteorder) + '(' + struct[key] + ')'): subarray_buffer[0] = struct[key].charCodeAt(0);
            } else {
                len = parseInt(len);
                for (var i = 0; i < len; i++) {
                    (type !== 'Char') ? eval('subarray_buffer.write' + type + (strbyteorder) + '(' + struct[key][i] + ',' + i + ')'): subarray_buffer[i] = struct[key][i].charCodeAt(0);
                }
            }
        }
    }
    return buffer;
}

module.exports = NStruct