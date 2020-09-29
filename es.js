const format = {
  "TES3HEDR": [
    ['version', (view,a) => view.getFloat32(a,true)],
    ['type', (view,a) => view.getUint32(a+4,true)],
    ['author', (view,a) => str(view,a+8,32)],
    ['description', (view,a) => str(view,a+40,256)],
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

function Record(view,a,parent=null) {
  const a0 = a;

  this.tag = str(view,a,4); a+=4;
  this.size = view.getUint32(a,true); a+=4;

  this.parent = parent;
  if (!parent) {
    this.flags = new Uint8Array(view.buffer,a,8); a+=8;

    this.children = [ ];
    const end = a + this.size;
    while (a < end) {
      const x = new Record(view,a,this);
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
Record.prototype.find = function(tag) {
  return this.children.find(x => x.tag == tag);
}

function add_text(elem,text,d=', ') {
  if (text.length) {
    const text0 = elem.text();
    if (text0.length)
      elem.text(text0+d+text);
    else
      elem.text(text);
  }
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
    add_text(p1,size+' bytes');

    if (str(view,0,4)!="TES3") {
      alert("wrong initial bytes");
      return;
    }

    const recs = [ ];
    for (let a=0; a<size; ) {
      const x = new Record(view,a);
      recs.push(x);
      a += x.bytes;
    }
    function getrec(a,b) { return recs.find(x => x.tag==a).find(b); }
    add_text(p1,recs.length-1+' records');

    const HEDR = getrec('TES3','HEDR').data;
    const p2 = $('<p class="mc">').appendTo(info);
    add_text(p2,HEDR.description,'; ');

    // console.log( recs[0] );

    const is_save = HEDR.type==32;
    if (is_save) {
      const GMDT = getrec('TES3','GMDT').data;
      add_text(p2,GMDT.CharacterName+'; '+GMDT.CellName,'; ');
    }

    var tab_defs = [
      ['Pic',function(tab){
        if (tab.length < 3) {
          const div = $('<div>');
          draw(div,getrec('TES3','SCRS').data,4);
          tab.push(div);
        }
        return tab[2];
      }],
      ['Map',function(tab){
        if (tab.length < 3) {
          const div = $('<div>');
          draw(div,getrec('FMAP','MAPD').data,3);
          tab.push(div);
        }
        return tab[2];
      }],
      ['Records',function(tab){
        if (tab.length < 3) {
          const div = $('<div>');
          const select1 = $('<select>').appendTo(div);
          const tags1 = new Set();
          for (let i=1; i<recs.length; ++i) // skip TES3 at 0
            tags1.add(recs[i].tag);
          Array.from(tags1).sort().forEach(
            x => $('<option>').text(x).appendTo(select1)
          );
          tab.push(div);
        }
        return tab[2];
      }]
    ];
    const tabs_div = $('#tabs').empty();
    const tab_div = $('#tab').empty();
    for (const tab of tab_defs) {
      if (!is_save && tab[0] in ['pic','map']) continue;
      $('<button>').appendTo(tabs).text(tab[0]).on('click',function(){
        if (!$(this).hasClass('active')) {
          $('#tabs > button.active').removeClass('active');
          $(this).addClass('active');
          tab_div.empty().append(tab[1](tab));
        }
      });
    }
    $('#main').show();

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
