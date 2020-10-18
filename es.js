var view = null;
var recs = [ ];

function emplace(arr,x) { return arr[arr.push(x)-1]; }

const utf8decoder = new TextDecoder("utf-8");
function str(a,n) {
  return utf8decoder.decode(new Uint8Array(view.buffer,a,n));
}

const _u1 = {
  r: a => [view.getUint8(a), a+1]
};
const _i1 = {
  r: a => [view.getInt8(a), a+1]
};
const _u2 = {
  r: a => [view.getUint16(a,true), a+2]
};
const _u4 = {
  r: a => [view.getUint32(a,true), a+4]
};
const _i4 = {
  r: a => [view.getInt32(a,true), a+4]
};
const _f4 = {
  r: a => [view.getFloat32(a,true), a+4]
};
const _u8 = {
  r: a => [view.getBigUint64(a,true), a+8]
};
const _u1n = {
  r: (a,n) => [new Uint8Array(view.buffer,a,n), a+n]
};
const _zstr = {
  r: (a,n) => {
    let arr;
    [arr,a] = _u1n.r(a,n);
    let m = 0;
    for (; m<n; ++m) if (arr[m]==0) break;
    return [utf8decoder.decode(arr.subarray(0,m)), a];
  }
};
const _bzstr = {
  r: a => {
    let n;
    [n,a] = _u1.r(a);
    return _zstr.r(a,n);
  }
};
const _zstr0 = {
  r: (a,n) => {
    let [arr,] = _u1n.r(a,n);
    let m = 0;
    for (; m<n; ++m) if (arr[m]==0) break;
    if (m==n) throw '_zstr0: not a null terminated string';
    return [utf8decoder.decode(arr.subarray(0,m)), a+m+1];
  }
};
const _time = {
  r: a => [new Date( ...[0,0,2,0,0,0,0].map(x => ([,a]=_u2.r(a+x))[0]) ), a]
};
const _subview = {
  r: (a,n) => [new DataView(view.buffer,a,n), a+n]
};

const format3 = {
  "NAME": [ ['name', _zstr] ],
  "FNAM": [ ['name', _zstr] ],
  "MODL": [ ['model', _zstr] ],
  "ITEX": [ ['texture', _zstr] ],
  "SCRI": [ ['script', _zstr] ],
  "LUAT": [ ['lua', _zstr] ],
  "NPCO": [
    ['count', _i4],
    ['item', _zstr]
  ],
  "TES3HEDR": [
    ['version', _f4],
    ['type', _u4],
    ['author', _zstr, 32],
    ['description', _zstr, 256],
    ['numrecs', _u4]
  ],
  "TES3GMDT": [
    ['', {
      r: a => [ [...Array(6)].map(() => ([,a]=_f4.r(a))[0]), a ]
    }],
    ['CellName', _zstr, 64],
    ['', _f4],
    ['CharacterName', _zstr, 32]
  ],
  "TES3DATA": [ ['FileSize', _u8] ],
  "TES3MAST": [ ['name', _zstr] ],
  "TES3SCRS": [ ['screenshot', _u1n] ],
  "FMAPMAPD": [ ['map', _u1n] ],
  "JOURNAME": [ ['journal', {
      r: (a,n) => {
        let arr;
        [arr,a] = _u1n.r(a,n);
        const end = arr.indexOf(0);
        return [[
          utf8decoder.decode(arr.subarray(0,end)),
          arr.subarray(end) // what is this?
        ], a];
      }
    }] ],
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
  "GLOBFLTV": [ ['val', {
    r: (a,n,p) => { // TODO: make sure this is correct
      switch (p.find('FNAM').data[0]) {
        case 's': return _u2.r(a+2);
        case 'l': return _u4.r(a);
        case 'f': return _f4.r(a);
      }
    }
  }] ],
  "CLASDESC": [ ['desc', _zstr] ],
  "CLOTENAM": [ ['enchant', _zstr] ],
  "CLOTBNAM": [ ['mesh', _zstr] ],
  "CREACNAM": [ ['class', _zstr] ],
  "CREANPCS": [ ['spell', _zstr] ],
  "NPC_CNAM": [ ['class', _zstr] ],
  "NPC_ANAM": [ ['faction', _zstr] ],
  "NPC_NPCS": [ ['spell', _zstr] ],
  "NPC_RNAM": [ ['race', _zstr] ],
  "NPC_BNAM": [ ['head', _zstr] ],
  "NPC_KNAM": [ ['hair', _zstr] ],
  "CELLCNAM": [ ['owner', _zstr] ],
  "BOOKTEXT": [ ['text', _zstr] ],
  "BOOKENAM": [ ['enchant', _zstr] ],
  "STLNONAM": [ ['owner', _zstr] ],
  "PCDTDNAM": [ ['topic', _zstr] ],
  "KLSTKNAM": [ ['name', _zstr] ],
  "ARMOENAM": [ ['enchant', _zstr] ],
  "WEAPENAM": [ ['enchant', _zstr] ],
  "ARMOBNAM": [ ['body', _zstr] ],
  "PCDTFNAM": [
    // ['faction', _subview],
    ['faction', _subview, 12],
    ['name', _zstr0],
    ['', _subview],
  ],
  "PCDTMNAM": [ ['', _zstr] ],
  "PCDTBNAM": [ ['birthsign', _zstr] ],
  "PCDTKNAM": [
    ['1', _u1], ['item', _zstr, 39],
    ['2', _u1], ['item', _zstr, 39],
    ['3', _u1], ['item', _zstr, 39],
    ['4', _u1], ['item', _zstr, 39],
    ['5', _u1], ['item', _zstr, 39],
    ['6', _u1], ['item', _zstr, 39],
    ['7', _u1], ['item', _zstr, 39],
    ['8', _u1], ['item', _zstr, 39],
    ['9', _u1], ['item', _zstr, 39],
    ['0', _u1], ['item', _zstr, 39],
  ],
  "FACTRNAM": [ ['rank', _zstr, 32] ],
  "FACTANAM": [ ['faction', _zstr] ],
  "FACTINTV": [ ['reaction', _i4] ],
  "REFRWNAM": [ ['', _zstr] ],
  // "REGNWEAT": [
  //   ['Clear',    _u1],
  //   ['Cloudy',   _u1],
  //   ['Foggy',    _u1],
  //   ['Overcast', _u1],
  //   ['Rain',     _u1],
  //   ['Thunder',  _u1],
  //   ['Ash',      _u1],
  //   ['Blight',   _u1],
  // ],
  "REGNBNAM": [ ['sleep creature', _zstr] ],
  "REGNCNAM": [
    ['red',   _u1],
    ['green', _u1],
    ['blue',  _u1],
    ['alpha', _u1],
  ],
  "SCPTSCHD": [
    ['name', _zstr, 32],
    ['NumShorts', _u4],
    ['NumLongs',  _u4],
    ['NumFloats', _u4],
    ['data size', _u4],
    ['local size', _u4],
  ],
  "SPLMNAME": [ ['', _subview] ],
  "LEVIINAM": [ ['item', _zstr] ],
};

const recref3_item = [
  ['ALCH','NAME'],
  ['CLOT','NAME'],
  ['ARMO','NAME'],
  ['WEAP','NAME'],
  ['BOOK','NAME'],
  ['INGR','NAME'],
  ['LEVI','NAME'],
];
const recref3 = {
  "NPC_CNAM-class": [['CLAS','NAME']],
  "NPC_NPCS-spell": [['SPEL','NAME']],
  "NPC_NPCO-item": recref3_item,
  "CREANPCS-spell": [['SPEL','NAME']],
  "CREANPCO-item": recref3_item,
  "CRECNPCO-item": recref3_item,
  "CNTCNPCO-item": recref3_item,
  "CONTNPCO-item": recref3_item,
  "LEVIINAM-item": recref3_item,
  "CLOTENAM-enchant": [['ENCH','NAME']],
  "ARMOENAM-enchant": [['ENCH','NAME']],
  "WEAPENAM-enchant": [['ENCH','NAME']],
  "BOOKENAM-enchant": [['ENCH','NAME']],
  "PCDTKNAM-item": [
    ['SPEL','NAME'],
    ['ALCH','NAME'],
    ['CLOT','NAME'],
    ['ARMO','NAME'],
    ['WEAP','NAME'],
    ['BOOK','NAME'],
    ['INGR','NAME'],
  ],
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
  'ALCHENAM-effect': effects3,
  'ALCHENAM-attr': attributes3,
  'ALCHENAM-skill': skills3,
  'ENCHENAM-effect': effects3,
  'ENCHENAM-attr': attributes3,
  'ENCHENAM-skill': skills3,
  'ENCHENAM-range': ['Self','Touch','Target'],
  'ENCHENDT-type': ['Once','On Strike','When Used','Const. Effect'],
  'SPELENAM-effect': effects3,
  'SPELENAM-attr': attributes3,
  'SPELENAM-skill': skills3,
  'SPELENAM-range': ['Self','Touch','Target'],
  'SPELSPDT-type': ['Spell','Ability','Blight','Disease','Cure','Power'],
}

function Record(a,parent=null) {
  this.tag = str(a,4);
  [this.size,a] = _u4.r(a+4);

  let b = a + this.size;
  if (!parent) {
    [this.flags,a] = _u1n.r(a,8); b += 8;
    this.children = [ ];
    while (a < b)
      a += 8 + emplace(this.children,new Record(a,this)).size;
  } else {
    this.parent = parent;
    this.data = this.fmt().map(x => ([,a] = x[1].r(a,x[2]||(b-a),parent))[0]);
  }
  if (a != b) {
    console.log(this);
    throw 'size of a '+(parent ? parent.tag+'.' : '')+this.tag
      + ' ('+this.size+')'+' not equal to size read ('+(this.size+b-a)+')';
  }
}
Record.prototype.find = function(tag) {
  return this.children.find(x => x.tag === tag);
}
Record.prototype.fmt = function() {
  return format3[this.parent.tag + this.tag]
      || format3[this.tag]
      || [['',_subview]];
}

function record_table(rec) {
  const table = $('<table class="rec_data">');
  table.append($('<tr>').append($('<td>').text(rec.tag)));
  for (const sub of rec.children) {
    const tr = $('<tr>').appendTo(table);
    $('<td>').text(sub.tag).appendTo(tr);
    const tag = rec.tag + sub.tag;
    const fmt = sub.fmt();
    sub.data.forEach((val,i) => {
      let val2, tag2;
      const fmti = fmt[i];
      if (fmti && fmti[0]) {
        tag2 = tag+'-'+fmti[0];
        val2 = idmap3[tag2];
      }
      val2 = val2 ? val2[val] || val : val;

      $('<td>').text(fmti[0]).appendTo(tr);
      if (val.constructor === DataView) {
        new Uint8Array(
          val.buffer,
          val.byteOffset,
          val.byteLength
        ).reduce( (td,c) => td.append($('<span>').text(
            (31 < c && c < 127)
            ? String.fromCharCode(c)
            : c.toString(16).padStart(2,'0')
          )), $('<td class="raw">').appendTo(tr)
        )
      } else {
        const td = $('<td>').appendTo(tr);
        const val_span = $('<span class="val">').text(val2).appendTo(td);
        edit_record_value(val_span);
        const refs = recref3[tag2];
        if (refs) {
          $('<span class="ref click">').on('click',function(e){
            const id = tag2 +'-'+ val.replace(/\W/g,'_');
            let subtab = $('#'+id);
            if (subtab.length) {
              subtab.remove();
            } else {
              const subrec = recs.find(
                x => refs.some( ref =>
                  x.tag===ref[0] && x.find(ref[1]).data[ref[2]||0] === val
                )
              );
              if (subrec) {
                table.after(subtab = record_table(subrec).prop('id',id));
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
    });
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
  return ctx;
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

      recs = [ ];
      for (let a=0; a<size; )
        a += 16 + emplace(recs,new Record(a)).size;

      function getrec(a,b) { return recs.find(x => x.tag===a).find(b); }
      add_text(p1,recs.length-1+' records');

      const HEDR = getrec('TES3','HEDR').data;
      const p2 = $('<p class="mc">').appendTo(info);
      add_text(p2,HEDR[3],'; ');

      const is_save = HEDR[1]===32;
      if (is_save) {
        const GMDT = getrec('TES3','GMDT').data;
        add_text(p2,GMDT[3]+'; '+GMDT[1],'; ');
      }

      const tab_defs = [
        ['Records',function(tab){
          const div = $('<div>');
          const sel = $('<select>').appendTo(div);
          $('<option>').appendTo(sel);
          const tags1 = new Set();
          for (let i=1; i<recs.length; ++i) // skip TES3 at 0
            tags1.add(recs[i].tag);
          Array.from(tags1).sort().forEach(
            x => $('<option>').text(x).appendTo(sel)
          );
          const subdiv = $('<div>').appendTo(div);
          sel.on('change',function(){
            const val = $(this).val();
            subdiv.empty();
            if (val) for (const rec of recs.filter(x => x.tag==val)) {
              let lbl = null;
              const name = [ rec.find('NAME'), rec.find('FNAM') ];
              if (name[0]) {
                lbl = name[0].data[0];
                if (lbl.length && lbl.length < 256) {
                  if (name[1]) lbl += ' ('+name[1].data[0]+')';
                } else lbl = rec.tag;
              } else if (rec.tag==='SCPT') {
                lbl = rec.find('SCHD').data[0];
              } else lbl = rec.tag;
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
          const fr = new DocumentFragment();
          draw(fr,getrec('TES3','SCRS').data[0],true);
          return fr;
        }],
        ['Map',function(tab){
          const div = $('<div class="map">');
          const ctx = draw(div,getrec('FMAP','MAPD').data[0],false);
          const a = $('<a>').prop({
            download: file.name.replace(
              /^(?:.*[\\\/])?(.*)(?:\.ess$)/, '$1_map.png'),
            href: ctx.canvas.toDataURL('image/png').replace(
              'image/png', 'image/octet-stream')
          }).hide();
          $('<div>').append([
            a,
            $('<button>').text('Save as png').on('click',function(){
              a[0].click();
            }),
            $('<input type="file">').on('change',function(){
              const files = this.files;
              if (files && files.length==1) {
                const img = new Image;
                img.onload = function() {
                  if (this.width===512 && this.height===512) {
                    ctx.drawImage(img,0,0);
                  } else alert('Map image must be 512×512. Given image is '
                    + this.width + '×' + this.height
                  );
                }
                img.src = URL.createObjectURL(files[0]);
              }
            }),
            $('<button>').text('Replace').on('click',function(){
              console.log('Replace');
            }),
          ]).appendTo(div);
          return div;
        }],
        ['Journal',function(tab){
          const div = document.createElement('div');
          const jour = getrec('JOUR','NAME').data[0];
          div.innerHTML = '<P>'+jour[0].replace(
            /@([^#]*)#/g, '<span class="jourlink">$1</span>'
          );
          const n = div.childNodes.length;
          for (let i=1; i<n; ++i)
            div.prepend(div.childNodes[i]);
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
                return sub ? sub.data[0] : null;
              });
              if (pair[0] && pair[1])
                dial = pair;
            } else
            if (rec.tag=='INFO') {
              const pair = ['INAM','ACDT'].map(x => {
                const sub = rec.find(x);
                return sub ? sub.data[0] : null;
              });
              if (pair[0] && pair[1])
                infos[pair[0]] = { acdt: pair[1], dial: dial };
            } else {
              dial = null;
              if (rec.tag=='NPC_' || rec.tag=='CREA') {
                const pair = ['NAME','FNAM'].map(x => {
                  const sub = rec.find(x);
                  return sub ? sub.data[0] : null;
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
              span(ques.find('NAME').data[0]).addClass('ques');
              for (let i=0; i<n; ++i) {
                const inam = data[i].data[0];
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
          function get(f) { return ([,offset] = f.r(offset))[0]; }
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
            const data = get({r: a => _u1n.r(a,header.screenshot.size-8)});
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
    if (files && files.length==1)
      read_es_file(files[0]);
  });
});
