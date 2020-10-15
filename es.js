var view = null;
var recs = [ ];

const utf8decoder = new TextDecoder("utf-8");
function str(a,n) {
  return utf8decoder.decode(new Uint8Array(view.buffer,a,n));
}

function _u1(a) { return [view.getUint8    (a,true),a+1]; }
function _i1(a) { return [view.getInt8     (a,true),a+1]; }
function _u2(a) { return [view.getUint16   (a,true),a+2]; }
function _u4(a) { return [view.getUint32   (a,true),a+4]; }
function _i4(a) { return [view.getInt32    (a,true),a+4]; }
function _f4(a) { return [view.getFloat32  (a,true),a+4]; }
function _u8(a) { return [view.getBigUint64(a,true),a+8]; }
function _u1n(a,n) { return [new Uint8Array(view.buffer,a,n), a+n]; }
function _zstr(a,n) {
  let arr;
  [arr,a] = _u1n(a,n);
  while (arr[--n]==0);
  return [utf8decoder.decode(arr.subarray(0,n+1)), a];
}
function _bzstr(a) {
  let n;
  [n,a] = _u1(a);
  return _zstr(a,n);
}
function _time(a) {
  // year, month, dayofweek, day, hour, minutes, seconds, milliseconds
  return [new Date( ...[0,0,2,0,0,0,0].map(x => ([,a]=_u2(a+x))[0]) ),a];
}

const format3 = {
  "NAME": [ ['name', _zstr] ],
  "FNAM": [ ['name', _zstr] ],
  "MODL": [ ['model', _zstr] ],
  "TES3HEDR": [
    ['version', _f4],
    ['type', _u4],
    ['author', view => _zstr(view,32)],
    ['description', view => _zstr(view,256)],
    ['numrecs', _u4]
  ],
  "TES3GMDT": [
    ["_1", view => [...Array(6)].map(() => _f4(view))],
    ["CellName", view => _zstr(view,64)],
    ["_3", _f4],
    ["CharacterName", view => _zstr(view,32)]
  ],
  "TES3DATA": [ ['FileSize', _u8] ],
  "TES3MAST": [ ['name', _zstr] ],
  "TES3SCRS": [ ['screenshot', _u1n] ],
  "FMAPMAPD": [ ['map', _u1n] ],
  "JOURNAME": [
    ['journal', (view,n) => {
      const arr = _u1n(view,n);
      const end = arr.indexOf(0);
      return [
        utf8decoder.decode(arr.subarray(0,end)),
        arr.subarray(end) // what is this?
      ];
    }]
  ],
  "ALCHTEXT": [ ['icon', _zstr] ],
  "ALCHALDT": [
    ['weight', _f4],
    ['value', _u4],
    ['autocalc', _u4],
  ],
  "ALCHENAM": [
    ['effect', _u2],
    ['skill', _u1],
    ['attr', _u1],
    ['range', _u4],
    ['area', _u4],
    ['duration', _u4],
    ['min', _u4],
    ['max', _u4],
  ],
  "ENCHENDT": [
    ['type', _u4],
    ['cost', _u4],
    ['charge', _u4],
    ['autocalc', _u4],
  ],
  "ENCHENAM": [
    ['effect', _u2],
    ['skill', _u1],
    ['attr', _u1],
    ['range', _u4],
    ['area', _u4],
    ['duration', _u4],
    ['min', _u4],
    ['max', _u4],
  ],
  "SPELSPDT": [
    ['type', _u4],
    ['cost', _u4],
    ['flags', _u4],
  ],
  "SPELENAM": [
    ['effect', _u2],
    ['skill', _u1],
    ['attr', _u1],
    ['range', _u4],
    ['area', _u4],
    ['duration', _u4],
    ['min', _u4],
    ['max', _u4],
  ],
  "QUESDATA": [ ['data', _zstr] ],
  "INFOINAM": [ ['name', _zstr] ],
  "INFOACDT": [ ['name', _zstr] ],
  "DIALXIDX": [ ['name', _u4 ] ],
  "GLOBFLTV": [ ['val', (view,n,p) => { // TODO: make sure this is correct
      const t = p.find('FNAM').data.name;
      if (t=='s') return (_u2(view),_u2(view));
      if (t=='l') return _u4(view);
      if (t=='f') return _f4(view);
    }] ],
  "CLASDESC": [ ['desc', _zstr] ],
  "CLOTITEX": [ ['texture', _zstr] ],
  "CLOTENAM": [ ['enchant', _zstr] ],
  "CLOTBNAM": [ ['mesh', _zstr] ],
  "CREACNAM": [ ['class', _zstr] ],
  "CREASCRI": [ ['script', _zstr] ],
  "CREANPCS": [ ['spell', _zstr] ],
  "CREANPCO": [
    ['count', _i4],
    ['item', (view,n) => _zstr(view,n-4)]
  ],
  "NPC_CNAM": [ ['class', _zstr] ],
  "NPC_SCRI": [ ['script', _zstr] ],
  "NPC_ANAM": [ ['faction', _zstr] ],
  "NPC_NPCS": [ ['spell', _zstr] ],
  "NPC_RNAM": [ ['race', _zstr] ],
  "NPC_BNAM": [ ['head', _zstr] ],
  "NPC_KNAM": [ ['hair', _zstr] ],
  "NPC_NPCO": [
    ['count', _i4],
    ['item', (view,n) => _zstr(view,n-4)]
  ],
  "CNTCNPCO": [
    ['count', _i4],
    ['item', (view,n) => _zstr(view,n-4)]
  ],
  "CONTNPCO": [
    ['count', _i4],
    ['item', (view,n) => _zstr(view,n-4)]
  ],
  "CONTSCRI": [ ['script', _zstr] ],
  "CELLSCRI": [ ['script', _zstr] ],
  "CELLCNAM": [ ['owner', _zstr] ],
  "BOOKITEX": [ ['texture', _zstr] ],
  "BOOKTEXT": [ ['text', _zstr] ],
  "BOOKENAM": [ ['enchant', _zstr] ],
  "STLNONAM": [ ['owner', _zstr] ],
  "PCDTDNAM": [ ['topic', _zstr] ],
  "KLSTKNAM": [ ['name', _zstr] ],
  "ARMOENAM": [ ['enchant', _zstr] ],
  "WEAPENAM": [ ['enchant', _zstr] ],
  "WEAPITEX": [ ['texture', _zstr] ],
  "ARMOITEX": [ ['texture', _zstr] ],
  "ARMOBNAM": [ ['body', _zstr] ],
};

const recref3 = {
  "NPC_CNAM_class": [['CLAS','NAME','name']],
  "NPC_NPCS_spell": [['SPEL','NAME','name']],
  "NPC_NPCO_item": [
    ['ALCH','NAME','name'],
    ['CLOT','NAME','name'],
    ['ARMO','NAME','name'],
    ['WEAP','NAME','name'],
    ['BOOK','NAME','name'],
  ],
  "CLOTENAM_enchant": [['ENCH','NAME','name']],
  "ARMOENAM_enchant": [['ENCH','NAME','name']],
  "WEAPENAM_enchant": [['ENCH','NAME','name']],
  "BOOKENAM_enchant": [['ENCH','NAME','name']],
};

const attributes3 = [
  "Strength", "Intelligence", "Willpower", "Agility", "Speed", "Endurance",
  "Personality", "Luck",
];

const skills3 = [
  "Block", "Armorer", "Medium Armor", "Heavy Armor", "Blunt Weapon",
  "Long Blade", "Axe", "Spear", "Athletics", "Enchant", "Destruction",
  "Alteration", "Illusion", "Conjuration", "Mysticism", "Restoration",
  "Alchemy", "Unarmored", "Security", "Sneak", "Acrobatics", "Light Armor",
  "Short Blade", "Marksman", "Mercantile", "Speechcraft", "Hand-to-hand"
];

const effects3 = [
  "Water Breathing", "Swift Swim", "Water Walking", "Shield", "Fire Shield",
  "Lightning Shield", "Frost Shield", "Burden", "Feather", "Jump", "Levitate",
  "SlowFall", "Lock", "Open", "Fire Damage", "Shock Damage", "Frost Damage",
  "Drain Attribute", "Drain Health", "Drain Magicka", "Drain Fatigue",
  "Drain Skill", "Damage Attribute", "Damage Health", "Damage Magicka",
  "Damage Fatigue", "Damage Skill", "Poison", "Weakness to Fire",
  "Weakness to Frost", "Weakness to Shock", "Weakness to Magicka",
  "Weakness to Common Disease", "Weakness to Blight Disease",
  "Weakness to Corprus Disease", "Weakness to Poison",
  "Weakness to Normal Weapons", "Disintegrate Weapon", "Disintegrate Armor",
  "Invisibility", "Chameleon", "Light", "Sanctuary", "Night Eye", "Charm",
  "Paralyze", "Silence", "Blind", "Sound", "Calm Humanoid", "Calm Creature",
  "Frenzy Humanoid", "Frenzy Creature", "Demoralize Humanoid",
  "Demoralize Creature", "Rally Humanoid", "Rally Creature", "Dispel",
  "Soultrap", "Telekinesis", "Mark", "Recall", "Divine Intervention",
  "Almsivi Intervention", "Detect Animal", "Detect Enchantment", "Detect Key",
  "Spell Absorption", "Reflect", "Cure Common Disease", "Cure Blight Disease",
  "Cure Corprus Disease", "Cure Poison", "Cure Paralyzation",
  "Restore Attribute", "Restore Health", "Restore Magicka", "Restore Fatigue",
  "Restore Skill", "Fortify Attribute", "Fortify Health", "Fortify Magicka",
  "Fortify Fatigue", "Fortify Skill", "Fortify Maximum Magicka",
  "Absorb Attribute", "Absorb Health", "Absorb Magicka", "Absorb Fatigue",
  "Absorb Skill", "Resist Fire", "Resist Frost", "Resist Shock",
  "Resist Magicka", "Resist Common Disease", "Resist Blight Disease",
  "Resist Corprus Disease", "Resist Poison", "Resist Normal Weapons",
  "Resist Paralysis", "Remove Curse", "Turn Undead", "Summon Scamp",
  "Summon Clannfear", "Summon Daedroth", "Summon Dremora",
  "Summon Ancestral Ghost", "Summon Skeletal Minion", "Summon Bonewalker",
  "Summon Greater Bonewalker", "Summon Bonelord", "Summon Winged Twilight",
  "Summon Hunger", "Summon Golden Saint", "Summon Flame Atronach",
  "Summon Frost Atronach", "Summon Storm Atronach", "Fortify Attack",
  "Command Creature", "Command Humanoid", "Bound Dagger", "Bound Longsword",
  "Bound Mace", "Bound Battle Axe", "Bound Spear", "Bound Longbow",
  "EXTRA SPELL", "Bound Cuirass", "Bound Helm", "Bound Boots", "Bound Shield",
  "Bound Gloves", "Corprus", "Vampirism", "Summon Centurion Sphere",
  "Sun Damage", "Stunted Magicka"
];

const idmap3 = {
  'ALCHENAM_effect': effects3,
  'ALCHENAM_attr': attributes3,
  'ALCHENAM_skill': skills3,
  'ENCHENAM_effect': effects3,
  'ENCHENAM_attr': attributes3,
  'ENCHENAM_skill': skills3,
  'ENCHENAM_range': ['Self','Touch','Target'],
  'ENCHENDT_type': ['Once','On Strike','When Used','Const. Effect'],
  'SPELENAM_effect': effects3,
  'SPELENAM_attr': attributes3,
  'SPELENAM_skill': skills3,
  'SPELENAM_range': ['Self','Touch','Target'],
  'SPELSPDT_type': ['Spell','Ability','Blight','Disease','Cure','Power'],
}

function Record(view,parent=null) {
  this.tag = _zstr(view,4);
  this.size = _u4(view);

  this.parent = parent;
  if (!parent) {
    this.flags = _u1n(view,8);

    this.children = [ ];
    const end = view[0].byteOffset + this.size;
    while (view[0].byteOffset < end)
      this.children.push(new Record(view,this));
  } else {
    const fmt = format3[parent.tag+this.tag] || format3[this.tag];
    if (fmt) {
      this.data = { };
      const a = view[0].byteOffset;
      for (const x of fmt)
        this.data[x[0]] = x[1](view,this.size,parent);
      const read = view[0].byteOffset-a;
      if (read != this.size)
        throw 'size of a '+parent.tag+'.'+this.tag+' ('+this.size+')'
          + ' not equal to size read ('+read+')';
    } else {
      // this.data = _zstr(view,this.size);
      const v = av(view,this.size);
      this.data = new DataView(v.buffer,v.byteOffset,this.size)
    }
  }
}
Record.prototype.find = function(tag) {
  return this.children.find(x => x.tag == tag);
}

function record_table(rec) {
  const table = $('<table class="rec_data">');
  table.append($('<tr>').append($('<td>').text(rec.tag)));
  for (const sub of rec.children) {
    const tr = $('<tr>').appendTo(table);
    $('<td>').text(sub.tag).appendTo(tr);
    if (sub.data.constructor === DataView) {
      $('<td>').appendTo(tr);
      new Uint8Array(
        sub.data.buffer,
        sub.data.byteOffset,
        sub.data.byteLength
      ).reduce( (td,c) => td.append($('<span>').text(
          (31 < c && c < 127)
          ? String.fromCharCode(c)
          : c.toString(16).padStart(2,'0')
        )), $('<td class="raw">').appendTo(tr)
      )
    } else {
      for (const [key,val] of Object.entries(sub.data)) {
        $('<td>').text(key).appendTo(tr);
        const td = $('<td>').appendTo(tr);
        const tag = rec.tag + sub.tag +'_'+ key;
        let val2 = idmap3[tag];
        val2 = val2 ? val2[val] || val : val;
        const val_span = $('<span class="val">').text(val2).appendTo(td);
        edit_record_value(val_span);
        const refs = recref3[tag];
        if (refs) {
          $('<span class="ref click">').on('click',function(e){
            const id = tag + val.replace(/\W/g,'_');
            let subtab = $('#'+id);
            if (subtab.length) {
              subtab.remove();
              td.removeClass('bold');
            } else {
              const subrec = recs.find(
                x => refs.some( ref =>
                  x.tag==ref[0] && x.find(ref[1]).data[ref[2]] === val
                )
              );
              if (subrec) {
                table.after(subtab = record_table(subrec).prop('id',id));
                td.addClass('bold');
                $([document.documentElement, document.body]).animate({
                  scrollTop: subtab.offset().top-5
                }, 1000);
              } else {
                this.remove();
              }
            }
          }).appendTo(td);
        }
      }
    }
  }
  return table;
}

function edit_record_value(val_span) {
  const edit = $('<span class="edit click">').on('click',function(e){
    edit.hide();
    const ta = $('<textarea>').val(val_span.text());
    val_span.hide().after(ta);
    const y = $('<span class="editY click">').on('click',function(e){
      val_span.text(ta.val()); // TODO: save changes
      done();
    });
    edit.after(y);
    const n = $('<span class="editN click">').on('click',function(e){
      done();
    });
    edit.after(n);
    function done() {
      for (const x of [ta,y,n]) x.remove();
      for (const x of [val_span,edit]) x.show();
    }
  });
  val_span.after(edit);
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
    view = new DataView(e.target.result);
    const size = view.byteLength;

    const info = $('#file_info').empty();
    const p1 = $('<p class="tt">').appendTo(info);
    add_text(p1,size+' bytes');

    if (str(0,4)=="TES3") {

      const view = [data_view];

      recs = [ ];
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

      const tab_defs = [
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
              // console.log(rec);
              let lbl = null;
              const name = [ rec.find('NAME'), rec.find('FNAM') ];
              if (name[0]) lbl = name[0].data.name;
              if (name[1]) lbl += ' ('+name[1].data.name+')';
              if (!lbl) lbl = rec.tag;
              $('<div>').append( $('<div class="rec_lbl">').text(lbl)
              .on('click',function(){
                const next = $(this).nextAll();
                if (next.length) {
                  next.remove();
                  $(this).removeClass('bold');
                } else {
                  $(this).addClass('bold').after(record_table(rec));
                }
              })).appendTo(subdiv);
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
            tab_div.empty().append(tab[1](tab));
          }
        });
      }
      $('#main').show();

    } else if (str(0,4)=="TES4") {

      const is_save = str(4,8)=='SAVEGAME';

      const tab_defs = [
      ].concat(is_save ? [
        ['Info',function(tab){
          const div = $('<div>');
          let offset = 12;
          function get(f) { return ([,offset] = f(offset))[0]; }
          const header = {
            majorVersion: get(_u1),
            minorVersion: get(_u1),
            exeTime: get(_time),
            headerVersion: get(_u4),
            saveHeaderSize: get(_u4),
            saveNum: get(_u4),
            pcName: get(_bzstr),
            pcLevel: get(_u2),
            pcLocation: get(_bzstr),
            gameDays: get(_f4),
            gameTicks: get(_u4),
            gameTime: get(_time),
            screenshot: {
              size: get(_u4),
              width: get(_u4),
              height: get(_u4),
            }
          };
          let row = $('<div class="row">').appendTo(div);
          $('<div class="inline">').append(
            $('<pre>').text(JSON.stringify(header,null,2))
          ).appendTo(row);
          {
            const data = get(a => _u1n(a,header.screenshot.size-8));
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

          const pluginsNum = get(_u1);
          $('<h2>').text('Plugins ['+pluginsNum+']:').appendTo(row);
          for (let i=0; i<pluginsNum; ++i)
            $('<p class="narrow">').text(get(_bzstr)).appendTo(row);

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
            tab_div.empty().append(tab[1](tab));
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
  $('#file_name').on('change',function(e){
    const files = this.files;
    if (files && files.length==1) {
      read_es_file(files[0]);
    } else alert('Invalid input file');
  });
});
