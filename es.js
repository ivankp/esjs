const format = {
  "NAME": [ ['name', str] ],
  "FNAM": [ ['name', str] ],
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
  "JOURNAME": [
    ['journal', (view,a,n) => {
      const ints = new Int8Array(view.buffer,a,n);
      const end = ints.indexOf(0);
      return [
        utf8decoder.decode(ints.slice(0,end)),
        ints.slice(end).buffer // what is this?
      ];
    }]
  ],
  "ALCHNAME": [ ['id', str] ],
  "ALCHMODL": [ ['model', str] ],
  "ALCHTEXT": [ ['icon', str] ],
  "ALCHALDT": [
    ['weight', (view,a) => view.getFloat32(a,true)],
    ['value', (view,a) => view.getUint32(a+4,true)],
    ['autocalc', (view,a) => view.getUint32(a+8,true)]
  ],
  "ALCHENAM": [
    ['effectID', (view,a) => view.getUint16(a,true)],
    ['_2', (view,a,n) => view.buffer.slice(a+2,a+n)] // unknown
  ],
  "QUESNAME": [ ['name', str] ],
  "QUESDATA": [ ['data', str] ],
  "INFOINAM": [ ['name', str] ],
  "INFOACDT": [ ['name', str] ],
  "DIALNAME": [ ['name', str] ],
  "DIALXIDX": [ ['name', (view,a) => view.getUint8(a,true)] ],
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

function draw(div,data,pic) {
  data = new Uint8Array(data);
  const w = Math.sqrt(data.length/(pic ? 4 : 3));

  const ctx = $('<canvas>').appendTo(div)[0].getContext('2d');
  ctx.canvas.height = ctx.canvas.width = w;
  const img = ctx.createImageData(w,w);
  const len = img.data.length;
  if (pic)
    for (let i=0; i<len; i+=4) {
      img.data[i  ] = data[i+2]*2;
      img.data[i+1] = data[i+1]*2;
      img.data[i+2] = data[i  ]*2;
      img.data[i+3] = 255;
    }
  else
    for (let i=0, j=0; i<len; i+=4, j+=3) {
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

    var tab_defs = [ // TODO: ensure lifetime
      ['Records',function(tab){
        const div = $('<div>');
        const select1 = $('<select>').appendTo(div);
        const tags1 = new Set();
        for (let i=1; i<recs.length; ++i) // skip TES3 at 0
          tags1.add(recs[i].tag);
        Array.from(tags1).sort().forEach(
          x => $('<option>').text(x).appendTo(select1)
        );
        select1.on('change',function(){
          console.log( recs.filter(x => x.tag==$(this).val()) );
        });
        return div
      }]
    ].concat(is_save ? [
      ['Pic',function(tab){
        const div = $('<div>');
        draw(div,getrec('TES3','SCRS').data,true);
        return div
      }],
      ['Map',function(tab){
        const div = $('<div>');
        draw(div,getrec('FMAP','MAPD').data,false);
        return div
      }],
      ['Journal',function(tab){
        const div = $('<div>');
        const jour = getrec('JOUR','NAME').data.journal;
        div.html('<P>'+jour[0].replace(
          /@([^#]*)#/g, '<span class="jourlink">$1</span>'
        ));
        div.children().each((i,li) => { div.prepend(li); });
        return div
      }],
      ['Quests',function(tab){
        const div = $('<div>');
        const quests = [ ];
        const infos = { };
        const names = { };
        let dial = null;
        for (const rec of recs) {
          if (rec.tag=='DIAL') {
            const pair = ['NAME','XIDX'].map(x => {
              const sub = rec.find(x);
              return sub ? sub.data.name : null;
            });
            if (pair[0] && pair[1])
              dial = pair;
          } else
          if (rec.tag=='INFO') {
            const pair = ['INAM','ACDT'].map(x => {
              const sub = rec.find(x);
              return sub ? sub.data.name : null;
            });
            if (pair[0] && pair[1])
              infos[pair[0]] = { acdt: pair[1], dial: dial };
          } else
          if (rec.tag=='NPC_' || rec.tag=='CREA') {
            const pair = ['NAME','FNAM'].map(x => {
              const sub = rec.find(x);
              return sub ? sub.data.name : null;
            });
            if (pair[0] && pair[1])
              names[pair[0]] = pair[1];
          } else
          if (rec.tag=='QUES') {
            quests.push(rec);
          }
        }
        for (const ques of quests) {
          const data = ques.children.filter(x => x.tag=='DATA');
          const n = data.length;
          if (n) {
            const p = $('<p>').appendTo(div);
            let s;
            const span = text => s = $('<span>').text(text).appendTo(p);
            span(ques.find('NAME').data.name).addClass('ques');
            for (let i=0; i<n; ++i) {
              const inam = data[i].data.data;
              const info = infos[inam];
              if (i==0 && info.dial) {
                s.after(': ');
                span(info.dial[0]+' ['+info.dial[1]+']');
              }
              $('<br>').appendTo(p);
              if (info) {
                span(info.acdt);
                const name = names[info.acdt];
                if (name) {
                  s.after(' ');
                  span('('+name+')');
                }
                s.after(': ');
              }
              span(inam);
            }
          }
        }
        return div
      }]
    ] : [
    ]);
    const tabs_div = $('#tabs').empty();
    const tab_div = $('#tab').empty();
    for (const tab of tab_defs) {
      $('<button>').appendTo(tabs).text(tab[0]).on('click',function(){
        if (!$(this).hasClass('active')) {
          $('#tabs > button.active').removeClass('active');
          $(this).addClass('active');
          if (tab.length < 3)
            tab.push(tab[1](tab));
          tab_div.empty().append(tab[2]);
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
