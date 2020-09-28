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
    if (this.tag=='HEDR' && parent.tag=='TES3') {
      this.data = {
        version: view.getFloat32(a,true),
        type: view.getUint32(a+4,true),
        author: str(view,a+8,32),
        name: str(view,a+40,256),
        nrecs: view.getUint32(a+296,true)
      };
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
    const info_p = $('<p class="tt">').appendTo(info);
    $('<span>').text(size+' bytes').appendTo(info_p);

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
    $('<span>').text(recs.length-1+' records').appendTo(info_p);

    const HEDR = getrec('TES3','HEDR').data;
    info.append($('<p class="mc">').text(HEDR.name));

    if (HEDR.type==32) { // save file
      const div = $('<div id="img">').appendTo(info);
      draw(div,getrec('FMAP','MAPD').data,3);
      draw(div,getrec('TES3','SCRS').data,4);
    }

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
