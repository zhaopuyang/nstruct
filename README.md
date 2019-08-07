Introduction
======
nodejs struct like C Language

Installation
============

To install:
 
    npm install nstruct
    

Example
=======

	var NStruct = require('nstruct');

	var ns = new NStruct();

	var buffer = Buffer.from([0x00, 0x01, 0x47, 0x6F, 0x64, 0x64, 0x01, 0xff]);

	var template = {
      id: 'UInt16',
      name: 'Char[3]',
      rank: 'UInt8',
      pos: {x: 'UInt8',y: 'UInt8'}
	};

	var structInstance = ns.bufferToStruct(buffer, template);

	console.log(structInstance);

	var bufferInstance = ns.structToBuffer(structInstance, template);

	console.log(bufferInstance);
		
Output:
	{ 
	  id: 1,
	  name: [ 'G', 'o', 'd' ],
      rank: 100,
      pos: { x: 1, y: 255 } 
	}
	<Buffer 00 01 47 6f 64 64 01 ff>
	     
Basic Type
=========

| type		| 	bytes	|
| ---- 		| 	---- 	|
| UInt8		|   1  		|
| UInt16	|   2  		|
| UInt32	|   4  		|
| Int8		|   1  		|
| Int16		|   2  		|
| Int32		|   4  		|
| Char		|   1  		|
| Float		|   4  		|
| Double	|   8  		|

Array Type
=========
 
Arrays are supported for all base types 

eg: <code>UInt8[2] Float[4] </code>

Template
=========

Basic organization of data structures,like

	{ 
	  id: 'UInt32',
	  name: 'Char[3]',
      rank: 'Int8',
      pos: [{ x: 'UInt8', y:'UInt8' },{ x: 'UInt8', y: 'UInt8' }]
	}

Function
=========

<code><strong>sizeof(template)</strong> calculate bytes of template</code>

<code><strong>offset(template, field)</strong> calculate field offset in template</code>

<code><strong>bufferToStruct(buffer, template)</strong> convert to struct from buffer</code>

<code><strong>structToBuffer(struct, template)</strong> convert to buffer from struct</code>
