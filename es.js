const format = {
  "TES3HEDR": [
    ['version', (view,a) => view.getFloat32(a,true)],
    ['type', (view,a) => view.getUint32(a+4,true)],
    ['author', (view,a) => str(view,a+8,32)],
    ['name', (view,a) => str(view,a+40,256)],
    ['numrecs', (view,a) => view.getUint32(a+296,true)]
  ],
  "TES3GMDT": [
    ["_1", (view,a) => Array(6).map((x,i) => view.getFloat32(a+i*4,true))],
    ["CellName", (view,a) => str(view,a+24,64)],
    ["_3", (view,a) => view.getFloat32(a+88,true)],
    ["CharacterName", (view,a) => str(view,a+92,32)]
  ],
  "TES3DATA": [ ['FileSize', (view,a) => view.getBigUint64(a,true)] ],
  "TES3MAST": [ ['name', str] ],
  "ALCHNAME": [ ['id', str] ],
  "ALCHMODL": [ ['model', str] ],
  "ALCHTEXT": [ ['icon', str] ],
  "ALCHFNAM": [ ['name', str] ],
  "ALCHALDT": [
    ['weight', (view,a) => view.getFloat32(a,true)],
    ['value', (view,a) => view.getUint32(a+4,true)],
    ['autocalc', (view,a) => view.getUint32(a+8,true)]
  ],
  "ALCHENAM": [
    ['effectID', (view,a) => view.getUint16(a,true)],
    ['_2', (view,a,n) => view.buffer.slice(a+2,a+n)] // unknown
  ],
};

const utf8decoder = new TextDecoder("utf-8");
function str(view,a,n) {
  while (n>0 && view.getUint8(a+n-1)==0) --n;
  return utf8decoder.decode(new Uint8Array(view.buffer,a,n));
}

function Struct(view,a,parent=null) {
  const a0 = a;

  this.tag = str(view,a,4); a+=4;
  this.size = view.getUint32(a,true); a+=4;

  this.parent = parent;
  if (!parent) {
    this.flags = new Uint8Array(view.buffer,a,8); a+=8;

    this.children = [ ];
    const end = a + this.size;
    while (a < end) {
      const x = new Struct(view,a,this);
      this.children.push(x);
      a += x.bytes;
    }
  } else {
    const fmt = format[parent.tag+this.tag] || format[this.tag];
    if (fmt) {
      this.data = { };
      for (const x of fmt)
        this.data[x[0]] = x[1](view,a,this.size);
    } else {
      this.data = view.buffer.slice(a,a+this.size);
    }
    a += this.size;
  }

  this.bytes = a - a0;
}
Struct.prototype.find = function(tag) {
  return this.children.find(x => x.tag == tag);
}

function draw(div,data,ch) {
  data = new Uint8Array(data);
  const len = data.length;
  const w = Math.sqrt(len/ch);

  const ctx = $('<canvas>').appendTo(div)[0].getContext('2d');
  ctx.canvas.height = ctx.canvas.width = w;
  const img = ctx.createImageData(w,w);
  for (let i=0, j=0; j<len; i+=4, j+=ch) {
    img.data[i  ] = data[j  ];
    img.data[i+1] = data[j+1];
    img.data[i+2] = data[j+2];
    img.data[i+3] = 255;
  }
  ctx.putImageData(img,0,0);
}

function read_es_file(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const view = new DataView(e.target.result);
    const size = view.byteLength;

    const info = $('#file_info').empty();
    const p1 = $('<p class="tt">').appendTo(info);
    $('<span>').text(size+' bytes').appendTo(p1);

    if (str(view,0,4)!="TES3") {
      alert("wrong initial bytes");
      return;
    }

    const recs = [ ];
    for (let a=0; a<size; ) {
      const x = new Struct(view,a);
      recs.push(x);
      a += x.bytes;
    }
    function getrec(a,b) { return recs.find(x => x.tag==a).find(b); }
    $('<span>').text(recs.length-1+' records').appendTo(p1);

    const HEDR = getrec('TES3','HEDR').data;
    const p2 = $('<p class="mc">').appendTo(info);
    $('<span>').text(HEDR.name).appendTo(p2);

    // console.log( recs[0] );

    if (HEDR.type==32) { // save file
      const div = $('<div id="img">').appendTo(info);
      draw(div,getrec('FMAP','MAPD').data,3);
      draw(div,getrec('TES3','SCRS').data,4);

      const GMDT = getrec('TES3','GMDT').data;
      $('<span>').text(GMDT.CharacterName).appendTo(p2);
      $('<span>').text(GMDT.CellName).appendTo(p2);
    }
    // TODO: draw in async function, same for list of records

    // show records
    // const div_recs = $('#records');
    // for (const rec of recs) {
    //   $('<p>').text(rec.tag).appendTo(div_recs);
    // }

    console.log( recs.filter(x => x.tag=='ALCH') );

  };
  reader.readAsArrayBuffer(file);
}

$(() => {
  $('#file_form').submit(function(e){
    e.preventDefault();
    const files = $('#file_name')[0].files;
    if (files && files.length==1) {
      read_es_file(files[0]);
    } else alert('Invalid input file');
  });
});
