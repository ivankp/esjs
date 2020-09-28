const utf8decoder = new TextDecoder("utf-8");
function str(view,a,n) {
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
      console.log(a);
      const x = new Struct(view,a,this);
      this.children.push(x);
      a += x.bytes;
    }
  } else {
    this.data = view.buffer.slice(a,this.size);
    a += this.size;
  }

  this.bytes = a - a0;
}

function read_es_file(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const view = new DataView(e.target.result);

      const info = $('#file_info').empty();
      info.append(
        $('<p style="font-family: monospace;">').text(
          view.byteLength+' bytes'));

      if (str(view,0,4)!="TES3") throw "wrong initial bytes";

      const data = new Struct(view,0);
      console.log(data);

    } catch (e) {
      alert(e);
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
