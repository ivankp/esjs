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
};
const clear = (x,n=0) => {
  while (x.childElementCount > n) x.removeChild(x.lastChild);
  return x;
};
const last = xs => xs[xs.length-1];
const emplace = (arr,x) => arr[arr.push(x)-1];

const download = (name,data,params) => {
  const url = window.URL.createObjectURL(new Blob( [data], params ));
  const a = window.document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  window.URL.revokeObjectURL(url);
};

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

const structs3 = {
  "NAME": [ ['name', _zstr] ],
  "FNAM": [ ['name', _zstr] ],
  "MODL": [ ['model', _zstr] ],
  "SCRI": [ ['script', _zstr] ],
  "ITEX": [ ['texture', _zstr] ],
  "TEXT": [ ['texture', _zstr] ],
  "DESC": [ ['descr', _zstr] ],
  "FLTV": [ ['float', _f4] ],
  "INTV": [ ['float', _i4] ],
  "LUAT": [ ['lua', _zstr] ],

  "TES3MAST": [ ['esm', _zstr] ],

  "ARMONAME": [ ['id', _zstr] ],

  "BOOKNAME": [ ['id', _zstr] ],
  "BOOKTEXT": [ ['text', _zstr] ],
};
const get_struct3 = (t1,t2) => structs3[t1+t2] ?? structs3[t2] ?? [[null,null]];

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

const blanks = {
  0x00: '\\0',
  0x09: '\\t',
  0x0A: '\\n',
  0x0D: '\\r',
};

const enable_edit = (span,len) => {
  span.addEventListener('contextmenu',function(e) {
    e.preventDefault();
    const edit = $(null,'textarea',{cols:len,rows:1});
    edit.value = this.textContent;
    this.style.display = "none";
    this.parentElement.insertBefore(edit,this);
    edit.addEventListener('keydown', function(e) {
      if (!e.shiftKey && (e.which ?? e.keyCode)===13) {
        e.preventDefault();
        span.textContent = this.value;
        this.remove();
        span.style.display = null;
      }
    });
    edit.focus();
  });
};

const fmt_ascii = (e,a,n) => {
  for (const end=a+n; a<end; ++a) {
    const c = _u1(a);
    const span = $(e,'span',['byte']);
    span.textContent =
      (31 < c && c < 127)
      ? String.fromCharCode(c)
      : blanks[c] ?? c.toString(16).padStart(2,'0');
    enable_edit(span,2);
  }
};
const fmt_hex = (e,a,n) => {
  for (const end=a+n; a<end; ++a) {
    const span = $(e,'span',['byte']);
    span.textContent = _u1(a).toString(16).padStart(2,'0');
    enable_edit(span,2);
  }
};

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
            const td = $(tr,'td');

            const struct = get_struct3(t1,t2);
            let offset = 0;
            for (const [name,f] of struct) {
              const span = $(td,'span',['field'],'span');
              const states = [
                ['hex',fmt_hex],
                ['ascii',fmt_ascii]
              ];
              if (name) states.push([ name, (e,a,n) => {
                e.textContent = `${f(a,n)}`;
                enable_edit(e,32);
              }]);

              const a = offset;
              span.textContent = last(states)[0];
              offset += last(states)[1](
                $(span.parentElement,'span'), r2.data+a, r2.size-a) ?? 0;

              span.onclick = function() {
                states.unshift(states.pop());
                const state = last(states);
                this.textContent = state[0];
                state[1](
                  $(clear(this.parentElement,1),'span'), r2.data+a, r2.size-a);
              };
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
  const bsa_div = $(clear(_id('main')),'div',{id:'bsa_list'});
  (function f(dir,path='') {
    for (const [k,v] of Object.entries(dir).sort(
      ([k1,v1],[k2,v2]) => {
        const d = (v1.constructor === Object ? 1 : 0)
                - (v2.constructor === Object ? 1 : 0);
        if (d!==0) return d;
        if (k1 < k2) return -1;
        if (k1 > k2) return  1;
        return 0;
      }
    )) {
      if (v.constructor === Object) {
        f(v, path+k+'\\');
      } else {
        const div = $(bsa_div,'div');
        if (path.length) {
          const span = $(div,'span');
          span.textContent = path;
        }
        const span = $(div,'span');
        span.textContent = k;
        span.onclick = function(){
          download(k, _u1n(v[1],v[0]), { type: 'application/octet-stream' });
        };
      }
    }
  })(root);
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
    if (magic === 0x33534554) { // TES3
      // https://en.uesp.net/wiki/Morrowind_Mod:Mod_File_Format
      for (let a=0; a<size; ) {
        const r = new Record(a);
        a += 16 + r.size;
        recs.push(r);
        (tags[r.tag] ??= []).push(r);
      }
      console.log( performance.now() - start );
      // console.log(tags);
      make_html_es3();
    } else if (magic === 0x00000100) { // BSA
      // https://en.uesp.net/wiki/Morrowind_Mod:BSA_File_Format
      let a = 4;
      const hash_offset = _u4(a)+12; a += 4;
      const num_files = _u4(a); a += 4;
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

// https://docs.microsoft.com/en-us/windows/win32/direct3ddds/dx-graphics-dds-pguide
function parse_dds() {

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
