function av(view,offset) { // advance view
  const prev = view[0];
  view[0] = new DataView(prev.buffer,prev.byteOffset+offset);
  return prev;
}

const utf8decoder = new TextDecoder("utf-8");
function str(view,a,n) {
  return utf8decoder.decode(new Uint8Array(view.buffer,a,n));
}

function get_ubyte  (view) { return av(view,1).getUint8  (0,true); }
function get_ushort (view) { return av(view,2).getUint16 (0,true); }
function get_ulong  (view) { return av(view,4).getUint32 (0,true); }
function get_float  (view) { return av(view,4).getFloat32(0,true); }
function get_u64    (view) { return av(view,8).getBigUint64(0,true); }
function get_ubytes (view,n) {
  const v = av(view,n);
  return new Uint8Array(v.buffer,v.byteOffset,n);
}
function get_string(view,n) {
  let arr = get_ubytes(view,n);
  while (arr[n-1]==0) --n;
  return utf8decoder.decode(arr.subarray(0,n));
}
function get_bstring(view) {
  return get_string(view,get_ubyte(view));
}
function get_systemtime(view) {
  return new Date(
    get_ushort(view), // year
    get_ushort(view), // month
 // get_ushort(view), // dayofweek
    get_ushort((av(view,2),view)), // day
    get_ushort(view), // hour
    get_ushort(view), // minutes
    get_ushort(view), // seconds
    get_ushort(view)  // milliseconds
  );
}

const format3 = {
  "NAME": [ ['name', get_string] ],
  "FNAM": [ ['name', get_string] ],
  "TES3HEDR": [
    ['version', get_float],
    ['type', get_ulong],
    ['author', view => get_string(view,32)],
    ['description', view => get_string(view,256)],
    ['numrecs', get_ulong]
  ],
  "TES3GMDT": [
    ["_1", view => [...Array(6)].map(() => get_float(view))],
    ["CellName", view => get_string(view,64)],
    ["_3", get_float],
    ["CharacterName", view => get_string(view,32)]
  ],
  "TES3DATA": [ ['FileSize', get_u64] ],
  "TES3MAST": [ ['name', get_string] ],
  "TES3SCRS": [ ['screenshot', get_ubytes] ],
  "FMAPMAPD": [ ['map', get_ubytes] ],
  "JOURNAME": [
    ['journal', (view,n) => {
      const arr = get_ubytes(view,n);
      const end = arr.indexOf(0);
      return [
        utf8decoder.decode(arr.subarray(0,end)),
        arr.subarray(end) // what is this?
      ];
    }]
  ],
  "ALCHNAME": [ ['id', get_string] ],
  "ALCHMODL": [ ['model', get_string] ],
  "ALCHTEXT": [ ['icon', get_string] ],
  "ALCHALDT": [
    ['weight', get_float],
    ['value', get_ulong],
    ['autocalc', get_ulong],
  ],
  "ALCHENAM": [
    ['effectID', get_ushort],
    ['_2', (view,n) => get_ubytes(view,n-2)] // unknown
  ],
  "QUESDATA": [ ['data', get_string] ],
  "INFOINAM": [ ['name', get_string] ],
  "INFOACDT": [ ['name', get_string] ],
  "DIALXIDX": [ ['name', get_ulong ] ],
};

function Record(view,parent=null) {
  this.tag = get_string(view,4);
  this.size = get_ulong(view);

  this.parent = parent;
  if (!parent) {
    this.flags = get_ubytes(view,8);

    this.children = [ ];
    const end = view[0].byteOffset + this.size;
    while (view[0].byteOffset < end)
      this.children.push(new Record(view,this));
  } else {
    const fmt = format3[parent.tag+this.tag] || format3[this.tag];
    if (fmt) {
      this.data = { };
      for (const x of fmt)
        this.data[x[0]] = x[1](view,this.size);
    } else {
      // this.data = get_string(view,this.size);
      const v = av(view,this.size);
      this.data = new DataView(v.buffer,v.byteOffset,this.size)
    }
  }
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
    const data_view = new DataView(e.target.result);
    const size = data_view.byteLength;

    const info = $('#file_info').empty();
    const p1 = $('<p class="tt">').appendTo(info);
    add_text(p1,size+' bytes');

    if (str(data_view,0,4)=="TES3") {

      const view = [data_view];

      const recs = [ ];
      while (view[0].byteOffset < size)
        recs.push(new Record(view));

      function getrec(a,b) { return recs.find(x => x.tag==a).find(b); }
      add_text(p1,recs.length-1+' records');

      const HEDR = getrec('TES3','HEDR').data;
      const p2 = $('<p class="mc">').appendTo(info);
      add_text(p2,HEDR.description,'; ');

      const is_save = HEDR.type==32;
      if (is_save) {
        const GMDT = getrec('TES3','GMDT').data;
        add_text(p2,GMDT.CharacterName+'; '+GMDT.CellName,'; ');
      }

      var tab_defs = [
        ['Records',function(tab){
          const div = $('<div>');
          const sel = $('<select id="record_select">').appendTo(div);
          $('<option>').appendTo(sel);
          const tags1 = new Set();
          for (let i=1; i<recs.length; ++i) // skip TES3 at 0
            tags1.add(recs[i].tag);
          Array.from(tags1).sort().forEach(
            x => $('<option>').text(x).appendTo(sel)
          );
          const subdiv = $('<div>').appendTo(div);
          $('body').on('change','#record_select',function(){
            const val = $(this).val();
            subdiv.empty();
            if (val) for (const rec of recs.filter(x => x.tag==val)) {
              $('<div>').text(rec.tag).appendTo(subdiv);
            }
          });
          return div;
        }]
      ].concat(is_save ? [
        ['Pic',function(tab){
          const div = $('<div>');
          draw(div,getrec('TES3','SCRS').data.screenshot,true);
          return div;
        }],
        ['Map',function(tab){
          const div = $('<div>');
          draw(div,getrec('FMAP','MAPD').data.map,false);
          return div;
        }],
        ['Journal',function(tab){
          const div = $('<div>');
          const jour = getrec('JOUR','NAME').data.journal;
          div.html('<P>'+jour[0].replace(
            /@([^#]*)#/g, '<span class="jourlink">$1</span>'
          ));
          div.children().each((i,li) => { div.prepend(li); });
          return div;
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
            } else {
              dial = null;
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
                if (info) {
                  if (i==0 && info.dial) {
                    s.after(': ');
                    span(info.dial[0]+' ['+info.dial[1]+']');
                  }
                  $('<br>').appendTo(p);
                  span(info.acdt);
                  const name = names[info.acdt];
                  if (name) {
                    s.after(' ');
                    span('('+name+')');
                  }
                  s.after(': ');
                } else {
                  $('<br>').appendTo(p);
                }
                span(inam);
              }
            }
          }
          return div;
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

    } else if (str(data_view,0,4)=="TES4") {

      const is_save = str(data_view,0,12)=='TES4SAVEGAME';

      var tab_defs = [
      ].concat(is_save ? [
        ['Info',function(tab){
          const div = $('<div>');
          const view = [data_view];
          av(view,12);
          const header = {
            majorVersion: get_ubyte(view),
            minorVersion: get_ubyte(view),
            exeTime: get_systemtime(view),
            headerVersion: get_ulong(view),
            saveHeaderSize: get_ulong(view),
            saveNum: get_ulong(view),
            pcName: get_bstring(view),
            pcLevel: get_ushort(view),
            pcLocation: get_bstring(view),
            gameDays: get_float(view),
            gameTicks: get_ulong(view),
            gameTime: get_systemtime(view),
            screenshot: {
              size: get_ulong(view),
              width: get_ulong(view),
              height: get_ulong(view),
            }
          };
          let row = $('<div class="row">').appendTo(div);
          $('<div class="inline">').append(
            $('<pre>').text(JSON.stringify(header,null,2))
          ).appendTo(row);
          {
            const data = get_ubytes(view,header.screenshot.size-8);
            const ctx = $('<canvas>').appendTo(
              $('<div class="inline">').appendTo(row)
            )[0].getContext('2d');
            const w = ctx.canvas.width = header.screenshot.width;
            const h = ctx.canvas.height = header.screenshot.height;
            const img = ctx.createImageData(w,h);
            const len = img.data.length;
            for (let i=0, j=0; i<len; i+=4, j+=3) {
              img.data[i  ] = data[j  ];
              img.data[i+1] = data[j+1];
              img.data[i+2] = data[j+2];
              img.data[i+3] = 255;
            }
            ctx.putImageData(img,0,0);
          }
          row = $('<div class="row">').appendTo(div);

          const pluginsNum = get_ubyte(view);
          $('<h2>').text('Plugins ['+pluginsNum+']:').appendTo(row);
          for (let i=0; i<pluginsNum; ++i)
            $('<p class="narrow">').text(get_bstring(view)).appendTo(row);

          return div;
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

    } else {
      alert("wrong initial bytes");
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
