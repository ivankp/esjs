const _id = id => document.getElementById(id);
const $ = (p,...args) => {
  if (p===null) {
    if (args[0].constructor !== String) throw new Error('expected tag name');
    p = document.createElement(args.shift());
  }
  for (let x of args) {
    if (x.constructor === String) {
      p = p.appendChild( (p instanceof SVGElement || x==='svg')
        ? document.createElementNS('http://www.w3.org/2000/svg',x)
        : document.createElement(x)
      );
    } else if (x.constructor === Array) {
      x = x.filter(x=>!!x);
      if (x.length) p.classList.add(...x);
    } else if (x.constructor === Object) {
      for (const [key,val] of Object.entries(x)) {
        if (key==='style') {
          for (const [skey,sval] of Object.entries(val)) {
            if (sval!==null)
              p.style[skey] = sval;
            else
              p.style.removeProperty(skey);
          }
        } else {
          if (p instanceof SVGElement)
            p.setAttributeNS(null,key,val);
          else
            p.setAttribute(key,val);
        }
      }
    }
  }
  return p;
}
const clear = (x,n=0) => {
  while (x.childElementCount > n) x.removeChild(x.lastChild);
  return x;
}
const last = xs => xs[xs.length-1];
const emplace = (arr,x) => arr[arr.push(x)-1];

var view, recs, tags;

const utf8decoder = new TextDecoder('utf-8');
const _u1 = a => view.getUint8(a);
const _i1 = a => view.getInt8(a);
const _u2 = a => view.getUint16(a,true);
const _u4 = a => view.getUint32(a,true);
const _i4 = a => view.getInt32(a,true);
const _f4 = a => view.getFloat32(a,true);
const _u8 = a => view.getBigUint64(a,true);
const _u1n = (a,n) => new Uint8Array(view.buffer,a,n);
const _str = (a,n) => utf8decoder.decode(_u1n(a,n));
const _zstr = (a,n) => {
  const arr = _u1n(a,n);
  const i = arr.indexOf(0);
  return utf8decoder.decode(i===-1 ? arr : arr.subarray(0,i));
};

const defs = {
  "NAME": [ ['name', _zstr] ],
  "FNAM": [ ['name', _zstr] ],
  "MODL": [ ['model', _zstr] ],
  "ITEX": [ ['texture', _zstr] ],
  "SCRI": [ ['script', _zstr] ],
  "LUAT": [ ['lua', _zstr] ],
};

function Record(a,parent=null) {
  this.tag = _str(a,4); a += 4;
  this.size = _u4(a); a += 4;

  if (!parent) {
    // this.flags = u1n(a,8);
    a += 8;
    this.data = a;
    this.children = [ ];
    const b = a + this.size;
    while (a < b)
      a += 8 + emplace(this.children,new Record(a,this)).size;
    if (a != b) throw new Error(
      `size of parent != size of children for ${this.tag} at offset ${a}`
    );
  } else {
    this.data = a;
    this.parent = parent;
  }
}
// Record.prototype.tag = function() { return _str(this.a,4); }
Record.prototype.find = function(tag) {
  return this.children.find(x => x.tag === tag);
}
const trunc = (a,n,m) => {
  const l = n > m;
  let name = _zstr(a, l ? m : n);
  if (l && name) name += '…';
  return name;
};
Record.prototype.pretty_name = function() {
  let name;
  if (name = this.find('NAME')) name = trunc(name.data,name.size,128);
  if (!name) {
    if (this.tag === 'CELL')
      if (name = this.find('RGNN')) name = trunc(name.data,name.size,128);
  }
  if (!name) name = this.tag;
  return name;
}

function make_html_es3() {
  const main = clear(_id('main'));
  const sel = $(main,'select',{id:'recs_type'});
  const keys = Object.keys(tags).sort();
  keys.unshift(keys.splice(keys.findIndex(x => x.match(/^TES[3-9]/)),1)[0]);
  for (const tag of keys)
    $(sel,'option').textContent = tag;
  sel.onchange = function(){
    const list = clear( _id('recs_list') ?? $(main,'div',{id:'recs_list'}) );
    const t1 = this.value;
    for (const r1 of tags[t1]) {
      const div = $(list,'div','div');
      div.textContent = r1.pretty_name();
      div.onclick = function(){
        const p = this.parentElement;
        if (p.childElementCount > 1) {
          clear(p,1);
        } else {
          const table = $(p,'table');
          for (const r2 of r1.children) {
            const t2 = r2.tag;
            const tr = $(table,'tr');
            $(tr,'td').textContent = t2;
            let td = $(tr,'td');
            for (let a=r2.data, end=a+r2.size; a<end; ++a) {
              const c = _u1(a);
              $(td,'span').textContent =
                (31 < c && c < 127)
                ? String.fromCharCode(c)
                : c.toString(16).padStart(2,'0');
            }
          }
        }
      };
    }
  };
  sel.onchange();
}

function make_html_bsa3() {
  const root = { };
  for (const [name,m] of Object.entries(recs)) {
    const path = name.split('\\');
    let dir = root;
    for (let i=0, n=path.length-1; i<n; ++i) {
      dir = (dir[path[i]] ??= { });
    }
    dir[last(path)] = m;
  }
  (function f(dir,ul) {
    for (const [k,v] of Object.entries(dir)) {
      const li = $(ul,'li');
      const span = $(li,'span');
      span.textContent = k;
      if (v.constructor === Object) {
        f(v,$(li,'ul'));
      } else {
        span.onclick = function() {
          console.log(...v);
          console.log(_u1n(v[1],v[0]));
          const url = window.URL.createObjectURL(new Blob(
            [_u1n(v[1],v[0])],
            { type: 'application/octet-stream' }
          ));
          const a = window.document.createElement('a');
          a.href = url;
          a.download = k;
          a.click();
          window.URL.revokeObjectURL(url);
        };
      }
    }
  })(root,$(clear(_id('main')),'ul'));
}

function read_file(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    view = new DataView(e.target.result);
    recs = [ ];
    tags = { };
    const size = view.byteLength;
    const start = performance.now();
    const magic = _u4(0);
    if (magic === 861095252) { // TES3
      for (let a=0; a<size; ) {
        const r = new Record(a);
        a += 16 + r.size;
        recs.push(r);
        (tags[r.tag] ??= []).push(r);
      }
      console.log( performance.now() - start );
      // console.log(tags);
      make_html_es3();
    } else if (magic === 256) { // BSA
      // https://en.uesp.net/wiki/Morrowind_Mod:BSA_File_Format
      let a = 4;
      const hash_offset = _u4(a)+12; a += 4;
      const num_files = _u4(a); a += 4;
      console.log({num_files});
      let f = a;
      a += num_files*8;
      let name = a;
      a += num_files*4;
      recs = { };
      if (num_files > 0) {
        let b1=0, b2;
        for (let i=1; i<num_files; ++i) {
          b2 = _u4(name += 4); // next file name
          recs[_str(a+b1,b2-b1-1)] = new Uint32Array(view.buffer,f,2);
          f += 8;
          b1 = b2;
        }
        b2 = hash_offset - a;
        recs[_str(a+b1,b2-b1-1)] = new Uint32Array(view.buffer,f,2);
        console.log(recs);

        a = hash_offset + num_files*8;
        for (const m of Object.values(recs)) {
          m[1] += a;
        }
        console.log( performance.now() - start );
        make_html_bsa3();
      }
    } else {
      alert("Unexpected leading 4 bytes in file "+e.target.fileName);
    }
    console.log( performance.now() - start );
  };
  reader.readAsArrayBuffer(file);
}

document.addEventListener('DOMContentLoaded', () => {
  const input = _id('file');
  input.onchange = function(e){
    const files = this.files;
    if (files && files.length==1)
      read_file(files[0]);
  };

  window.addEventListener('keydown', function(e) {
    if ( e.ctrlKey && !(e.shiftKey || e.altKey || e.metaKey))
      switch (e.which ?? e.keyCode) {
        case 79: // Ctrl + o
          if (input) {
            e.preventDefault();
            input.click();
          }
          break;
        // case 83: // Ctrl + s
        //   break;
      }
  });
});
