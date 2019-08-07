var NStruct = require('./nstruct');

var ns = new NStruct();

var buffer = Buffer.from([0x00, 0x01, 0x47, 0x6F, 0x64, 0x64, 0x01, 0xff]);

var template = {
    id: 'UInt16',
    name: 'Char[3]',
    score: 'UInt8',
    pos: {
        x: 'UInt8',
        y: 'UInt8'
    }
};

var structInstance = ns.bufferToStruct(buffer, template);

console.log(structInstance);

var bufferInstance = ns.structToBuffer(structInstance, template);

console.log(bufferInstance);