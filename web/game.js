/* ============================================================
   我的世界 · Web Edition  —— 纯前端体素生存游戏
   地形/水/村庄/树木 · 僵尸/苦力怕/猪 · 剑镐合成 · 粒子特效
   ============================================================ */
'use strict';

/* ---------------- 设备检测：电脑 / 手机自动切换 ---------------- */
const IS_MOBILE=(function(){
 if(window.__FORCE_MOBILE)return true;
 const ua=navigator.userAgent;
 if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua))return true;
 if(/Windows NT|Macintosh|X11|CrOS/.test(ua))return false; // 桌面系统（含触屏笔记本）
 return (('ontouchstart' in window)||navigator.maxTouchPoints>0)&&Math.min(screen.width,screen.height)<820;
})();

/* ---------------- 工具函数 ---------------- */
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function hash2(x,z){var n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);}
function smoothT(t){return t*t*(3-2*t);}
function vnoise(x,z){
  var xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi;
  var a=hash2(xi,zi),b=hash2(xi+1,zi),c=hash2(xi,zi+1),d=hash2(xi+1,zi+1);
  var u=smoothT(xf),v=smoothT(zf);
  return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
}
function fbm(x,z){return vnoise(x*0.05,z*0.05)*0.55+vnoise(x*0.13+37,z*0.13+91)*0.3+vnoise(x*0.34+113,z*0.34+57)*0.15;}
function smoothstep(a,b,x){x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x);}

/* ---------------- 方块 / 物品定义 ---------------- */
const B={AIR:0,GRASS:1,DIRT:2,STONE:3,SAND:4,LOG:5,LEAVES:6,PLANKS:7,COBBLE:8,WATER:9,COAL_ORE:10,IRON_ORE:11,DIAMOND_ORE:12,BEDROCK:13,
GLASS:14,TORCH:15,OBSIDIAN:16,TNT:17,GLOWSTONE:18,NETHERRACK:19,QUARTZ_ORE:20,LAVA:21,PORTAL:22,CRAFT_TABLE:23,FURNACE:24,BED:25,EMERALD_ORE:26,WOOL:27,CHEST:28,PISTON:29,FORCE_ORE:30,GOLD_ORE:31,SNOW:32,CACTUS:33,
FARMLAND:34,WHEAT_1:35,WHEAT_2:36,WHEAT_3:37,ENCHANT_TABLE:38};
const I={STICK:100,COAL:101,IRON_INGOT:102,DIAMOND:103,PORKCHOP:104,ROTTEN_FLESH:105,GUNPOWDER:106,APPLE:107,
FLINT_STEEL:108,COOKED_PORKCHOP:109,
WOOD_SWORD:110,STONE_SWORD:111,IRON_SWORD:112,DIAMOND_SWORD:113,
WOOD_PICK:120,STONE_PICK:121,IRON_PICK:122,DIAMOND_PICK:123,
BOW:124,ARROW:125,GOLDEN_APPLE:126,FORCE_SHARD:127,FORCE_APPLE:128,
RAW_BEEF:135,RAW_CHICKEN:136,LEATHER:137,FEATHER:138,COOKED_BEEF:139,
MUTTON:130,BONE:131,EMERALD:132,QUARTZ:133,GOLD_INGOT:134,
SEEDS:150,WHEAT:151,BREAD:152,RAW_FISH:153,COOKED_FISH:154,FISH_ROD:155,COOKED_CHICKEN:156};

// tiles:[顶,底,侧]  hard: 徒手秒数  pick: 镐类加成  minPow: 开采所需最低镐力  pcolor: 粒子色  cat: 渲染类别
const BLOCKS={};
BLOCKS[B.GRASS]     ={name:'草方块',tiles:[0,2,1],hard:0.6,pick:false,pcolor:0x5d9c3f,drop:{id:B.DIRT,n:1}};
BLOCKS[B.DIRT]      ={name:'泥土',tiles:[2,2,2],hard:0.6,pick:false,pcolor:0x8b6244,drop:{id:B.DIRT,n:1}};
BLOCKS[B.STONE]     ={name:'石头',tiles:[3,3,3],hard:4.0,pick:true,pcolor:0x8f8f8f,drop:{id:B.COBBLE,n:1}};
BLOCKS[B.SAND]      ={name:'沙子',tiles:[4,4,4],hard:0.5,pick:false,pcolor:0xdbd3a0,drop:{id:B.SAND,n:1}};
BLOCKS[B.LOG]       ={name:'橡木原木',tiles:[6,6,5],hard:1.4,pick:false,pcolor:0x6b4f2e,drop:{id:B.LOG,n:1}};
BLOCKS[B.LEAVES]    ={name:'树叶',tiles:[7,7,7],hard:0.25,pick:false,pcolor:0x3e7a25,drop:null};
BLOCKS[B.PLANKS]    ={name:'木板',tiles:[8,8,8],hard:1.0,pick:false,pcolor:0xa8834f,drop:{id:B.PLANKS,n:1}};
BLOCKS[B.COBBLE]    ={name:'圆石',tiles:[9,9,9],hard:4.0,pick:true,pcolor:0x7a7a7a,drop:{id:B.COBBLE,n:1}};
BLOCKS[B.WATER]     ={name:'水',tiles:[10,10,10],hard:Infinity,pick:false,pcolor:0x3b62d9,drop:null,cat:'water'};
BLOCKS[B.COAL_ORE]  ={name:'煤矿石',tiles:[11,11,11],hard:4.5,pick:true,pcolor:0x444444,drop:{id:I.COAL,n:1}};
BLOCKS[B.IRON_ORE]  ={name:'铁矿石',tiles:[12,12,12],hard:4.5,pick:true,minPow:4,pcolor:0xc9a184,drop:{id:B.IRON_ORE,n:1}};
BLOCKS[B.DIAMOND_ORE]={name:'钻石矿石',tiles:[13,13,13],hard:5,pick:true,minPow:6,pcolor:0x4fe3df,drop:{id:I.DIAMOND,n:1}};
BLOCKS[B.BEDROCK]   ={name:'基岩',tiles:[14,14,14],hard:Infinity,pick:true,pcolor:0x222222,drop:null};
BLOCKS[B.GLASS]     ={name:'玻璃',tiles:[15,15,15],hard:0.4,pick:false,pcolor:0xd8eef2,drop:{id:B.GLASS,n:1},cat:'glass'};
BLOCKS[B.TORCH]     ={name:'火把',tiles:[17,16,16],hard:0.05,pick:false,pcolor:0xffcc55,drop:{id:B.TORCH,n:1},cat:'torch'};
BLOCKS[B.OBSIDIAN]  ={name:'黑曜石',tiles:[18,18,18],hard:11,pick:true,minPow:4,pcolor:0x241533,drop:{id:B.OBSIDIAN,n:1}};
BLOCKS[B.TNT]       ={name:'TNT',tiles:[20,20,19],hard:0.4,pick:false,pcolor:0xd04030,drop:{id:B.TNT,n:1}};
BLOCKS[B.GLOWSTONE] ={name:'萤石',tiles:[21,21,21],hard:0.5,pick:false,pcolor:0xffd966,drop:{id:B.GLOWSTONE,n:1},cat:'emit'};
BLOCKS[B.NETHERRACK]={name:'下界岩',tiles:[22,22,22],hard:0.55,pick:false,pcolor:0x6e3533,drop:{id:B.NETHERRACK,n:1}};
BLOCKS[B.QUARTZ_ORE]={name:'下界石英矿石',tiles:[23,23,23],hard:4.5,pick:true,minPow:4,pcolor:0xefe6d8,drop:{id:I.QUARTZ,n:1}};
BLOCKS[B.LAVA]      ={name:'岩浆',tiles:[24,24,24],hard:Infinity,pick:false,pcolor:0xff6a00,drop:null,cat:'emit',liquid:true};
BLOCKS[B.PORTAL]    ={name:'下界传送门',tiles:[25,25,25],hard:Infinity,pick:false,pcolor:0x9b4dd6,drop:null,cat:'portal'};
BLOCKS[B.CRAFT_TABLE]={name:'合成台',tiles:[26,8,27],hard:1.6,pick:false,pcolor:0xa8834f,drop:{id:B.CRAFT_TABLE,n:1}};
BLOCKS[B.FURNACE]   ={name:'熔炉',tiles:[3,3,28],hard:3.5,pick:true,pcolor:0x7a7a7a,drop:{id:B.FURNACE,n:1}};
BLOCKS[B.BED]       ={name:'床',tiles:[30,8,30],hard:0.5,pick:false,pcolor:0xc02020,drop:{id:B.BED,n:1},cat:'bed'};
BLOCKS[B.EMERALD_ORE]={name:'绿宝石矿石',tiles:[31,31,31],hard:5,pick:true,minPow:6,pcolor:0x2ecc40,drop:{id:I.EMERALD,n:1}};
BLOCKS[B.WOOL]      ={name:'羊毛',tiles:[32,32,32],hard:0.8,pick:false,pcolor:0xe8e8e8,drop:{id:B.WOOL,n:1}};
BLOCKS[B.CHEST]     ={name:'宝箱',tiles:[34,34,33],hard:1.2,pick:false,pcolor:0x9a7330,drop:{id:B.CHEST,n:1}};
BLOCKS[B.PISTON]    ={name:'活塞',tiles:[36,35,35],hard:1.5,pick:false,pcolor:0xc9773a,drop:{id:B.PISTON,n:1}};
BLOCKS[B.FORCE_ORE] ={name:'原力晶石矿',tiles:[37,37,37],hard:5,pick:true,minPow:6,pcolor:0x7af0e0,drop:{id:I.FORCE_SHARD,n:1},cat:'emit'};
BLOCKS[B.GOLD_ORE]  ={name:'金矿石',tiles:[38,38,38],hard:5,pick:true,minPow:6,pcolor:0xf5d94a,drop:{id:B.GOLD_ORE,n:1}};
BLOCKS[B.FARMLAND]  ={name:'耕地',tiles:[39,39,39],hard:0.6,pick:false,pcolor:0x6b4a2a,drop:{id:B.DIRT,n:1}};
BLOCKS[B.WHEAT_1]   ={name:'小麦苗',tiles:[40,40,40],hard:0.1,pick:false,pcolor:0x3e7a25,drop:{id:I.SEEDS,n:1},cat:'crop'};
BLOCKS[B.WHEAT_2]   ={name:'小麦',tiles:[41,41,41],hard:0.1,pick:false,pcolor:0x6f9c2a,drop:{id:I.SEEDS,n:1},cat:'crop'};
BLOCKS[B.WHEAT_3]   ={name:'成熟小麦',tiles:[42,42,42],hard:0.1,pick:false,pcolor:0xd9b84a,drop:null,cat:'crop'};
BLOCKS[B.ENCHANT_TABLE]={name:'附魔台',tiles:[43,44,44],hard:3.5,pick:false,pcolor:0x7a5bd6,drop:{id:B.ENCHANT_TABLE,n:1}};

const ITEMS={};
ITEMS[B.GRASS]={name:'草方块',kind:'block'};
ITEMS[B.DIRT]={name:'泥土',kind:'block'};
ITEMS[B.STONE]={name:'石头',kind:'block'};
ITEMS[B.SAND]={name:'沙子',kind:'block'};
ITEMS[B.LOG]={name:'橡木原木',kind:'block'};
ITEMS[B.LEAVES]={name:'树叶',kind:'block'};
ITEMS[B.PLANKS]={name:'木板',kind:'block'};
ITEMS[B.COBBLE]={name:'圆石',kind:'block'};
ITEMS[B.IRON_ORE]={name:'铁矿石',kind:'block'};
ITEMS[B.GLASS]={name:'玻璃',kind:'block'};
ITEMS[B.TORCH]={name:'火把',kind:'block'};
ITEMS[B.OBSIDIAN]={name:'黑曜石',kind:'block'};
ITEMS[B.TNT]={name:'TNT',kind:'block'};
ITEMS[B.GLOWSTONE]={name:'萤石',kind:'block'};
ITEMS[B.NETHERRACK]={name:'下界岩',kind:'block'};
ITEMS[B.QUARTZ_ORE]={name:'下界石英矿石',kind:'block'};
ITEMS[B.CRAFT_TABLE]={name:'合成台',kind:'block'};
ITEMS[B.FURNACE]={name:'熔炉',kind:'block'};
ITEMS[B.BED]={name:'床',kind:'block'};
ITEMS[B.EMERALD_ORE]={name:'绿宝石矿石',kind:'block'};
ITEMS[B.WOOL]={name:'羊毛',kind:'block'};
ITEMS[B.CHEST]={name:'宝箱',kind:'block'};
ITEMS[B.PISTON]={name:'活塞',kind:'block'};
ITEMS[B.FORCE_ORE]={name:'原力晶石矿',kind:'block'};
ITEMS[B.GOLD_ORE]={name:'金矿石',kind:'block'};
ITEMS[B.FARMLAND]={name:'耕地',kind:'block'};
ITEMS[B.ENCHANT_TABLE]={name:'附魔台',kind:'block'};
ITEMS[I.SEEDS]={name:'小麦种子',kind:'material'};
ITEMS[I.WHEAT]={name:'小麦',kind:'material'};
ITEMS[I.BREAD]={name:'面包',kind:'food',heal:5};
ITEMS[I.RAW_FISH]={name:'生鱼',kind:'food',heal:4};
ITEMS[I.COOKED_FISH]={name:'熟鱼',kind:'food',heal:8};
ITEMS[I.COOKED_CHICKEN]={name:'熟鸡肉',kind:'food',heal:10};
ITEMS[I.FISH_ROD]={name:'钓鱼竿',kind:'rod'};
ITEMS[I.STICK]={name:'木棍',kind:'material'};
ITEMS[I.COAL]={name:'煤炭',kind:'material'};
ITEMS[I.IRON_INGOT]={name:'铁锭',kind:'material'};
ITEMS[I.DIAMOND]={name:'钻石',kind:'material'};
ITEMS[I.GUNPOWDER]={name:'火药',kind:'material'};
ITEMS[I.ARROW]={name:'箭',kind:'material'};
ITEMS[I.FORCE_SHARD]={name:'原力水晶',kind:'material'};
ITEMS[I.APPLE]={name:'苹果',kind:'food',heal:4};
ITEMS[I.PORKCHOP]={name:'生猪排',kind:'food',heal:6};
ITEMS[I.COOKED_PORKCHOP]={name:'熟猪排',kind:'food',heal:12};
ITEMS[I.ROTTEN_FLESH]={name:'腐肉',kind:'food',heal:3};
ITEMS[I.MUTTON]={name:'羊肉',kind:'food',heal:6};
ITEMS[I.GOLDEN_APPLE]={name:'金苹果',kind:'food',heal:20};
ITEMS[I.FORCE_APPLE]={name:'原力苹果',kind:'food',heal:10};
ITEMS[I.FLINT_STEEL]={name:'打火石',kind:'tool'};
ITEMS[I.BOW]={name:'弓',kind:'bow',dmg:6};
ITEMS[I.BONE]={name:'骨头',kind:'material'};
ITEMS[I.EMERALD]={name:'绿宝石',kind:'material'};
ITEMS[I.QUARTZ]={name:'下界石英',kind:'material'};
ITEMS[I.GOLD_INGOT]={name:'金锭',kind:'material'};
ITEMS[I.WOOD_SWORD]={name:'木剑',kind:'sword',dmg:4};
ITEMS[I.STONE_SWORD]={name:'石剑',kind:'sword',dmg:5};
ITEMS[I.IRON_SWORD]={name:'铁剑',kind:'sword',dmg:6};
ITEMS[I.DIAMOND_SWORD]={name:'钻石剑',kind:'sword',dmg:7};
ITEMS[I.WOOD_PICK]={name:'木镐',kind:'pick',power:2.5,dmg:2};
ITEMS[I.STONE_PICK]={name:'石镐',kind:'pick',power:4,dmg:3};
ITEMS[I.IRON_PICK]={name:'铁镐',kind:'pick',power:6,dmg:4};
ITEMS[I.DIAMOND_PICK]={name:'钻石镐',kind:'pick',power:9,dmg:5};

/* ---- 网格合成配方 ----
   shaped: shape 二维数组（0=空），需在网格中按形状摆放（任意位置）
   shapeless: ing 数量匹配即可（任意摆放） */
const P=B.PLANKS,C=B.COBBLE,S=I.STICK,DI=I.DIAMOND,IR=I.IRON_INGOT,W=B.WOOL,A=I.APPLE,G=I.GOLD_INGOT,F=I.FORCE_SHARD;
const CRAFT_SHAPED=[
 {out:[I.STICK,4],shape:[[P],[P]]},
 {out:[B.TORCH,4],shape:[[I.COAL],[S]]},
 {out:[B.CRAFT_TABLE,1],shape:[[P,P],[P,P]]},
 {out:[B.FURNACE,1],shape:[[C,C,C],[C,0,C],[C,C,C]]},
 {out:[I.WOOD_PICK,1],shape:[[P,P,P],[0,S,0],[0,S,0]]},
 {out:[I.WOOD_SWORD,1],shape:[[P],[P],[S]]},
 {out:[I.STONE_PICK,1],shape:[[C,C,C],[0,S,0],[0,S,0]]},
 {out:[I.STONE_SWORD,1],shape:[[C],[C],[S]]},
 {out:[I.IRON_PICK,1],shape:[[IR,IR,IR],[0,S,0],[0,S,0]]},
 {out:[I.IRON_SWORD,1],shape:[[IR],[IR],[S]]},
 {out:[I.DIAMOND_PICK,1],shape:[[DI,DI,DI],[0,S,0],[0,S,0]]},
 {out:[I.DIAMOND_SWORD,1],shape:[[DI],[DI],[S]]},
 {out:[I.FLINT_STEEL,1],shape:[[IR],[B.SAND]]},
 {out:[B.TNT,1],shape:[[I.GUNPOWDER,B.SAND,I.GUNPOWDER],[B.SAND,I.GUNPOWDER,B.SAND],[I.GUNPOWDER,B.SAND,I.GUNPOWDER]]},
 {out:[B.BED,1],shape:[[W,W,W],[P,P,P]]},
 {out:[I.BOW,1],shape:[[0,P,W],[P,0,W],[0,P,W]]},
 {out:[I.GOLDEN_APPLE,1],shape:[[G,G,G],[G,A,G],[G,G,G]]},
 {out:[I.FORCE_APPLE,1],shape:[[0,F,0],[F,A,F],[0,F,0]]},
 {out:[B.PISTON,1],shape:[[P,P,P],[C,IR,C],[C,F,C]]}
];

// 农业 / 钓鱼 / 附魔相关
CRAFT_SHAPED.push({out:[I.BREAD,1],shape:[[I.WHEAT,I.WHEAT,I.WHEAT]]});
CRAFT_SHAPED.push({out:[I.FISH_ROD,1],shape:[[0,0,S],[0,S,S],[S,0,0]]});
CRAFT_SHAPED.push({out:[B.ENCHANT_TABLE,1],shape:[[DI,DI,DI],[B.OBSIDIAN,B.OBSIDIAN,B.OBSIDIAN],[P,P,P]]});
const CRAFT_SHAPELESS=[
 {out:[B.PLANKS,4],ing:[[B.LOG,1]]},
 {out:[I.ARROW,4],ing:[[I.STICK,1],[B.COBBLE,1]]}
];
const SMELT={};
SMELT[B.IRON_ORE]=I.IRON_INGOT;
SMELT[B.GOLD_ORE]=I.GOLD_INGOT;
SMELT[B.SAND]=B.GLASS;
SMELT[I.PORKCHOP]=I.COOKED_PORKCHOP;
SMELT[I.RAW_BEEF]=I.COOKED_BEEF;
SMELT[I.RAW_CHICKEN]=I.COOKED_CHICKEN;
SMELT[I.RAW_FISH]=I.COOKED_FISH;
SMELT[B.LOG]=I.COAL;
const FUEL={};
FUEL[I.COAL]=20;FUEL[B.LOG]=2.5;FUEL[B.PLANKS]=2.5;FUEL[I.STICK]=1.5;
const TRADES=[
 {give:[[I.PORKCHOP,3]],get:[I.EMERALD,1]},
 {give:[[B.COBBLE,12]],get:[I.EMERALD,1]},
 {give:[[I.BONE,2]],get:[I.EMERALD,1]},
 {give:[[I.QUARTZ,2]],get:[I.EMERALD,1]},
 {give:[[I.EMERALD,1]],get:[B.TORCH,8]},
 {give:[[I.EMERALD,2]],get:[I.IRON_INGOT,1]},
 {give:[[I.EMERALD,2]],get:[I.COOKED_PORKCHOP,3]},
 {give:[[I.EMERALD,5]],get:[I.DIAMOND,1]},
 {give:[[I.FORCE_SHARD,1]],get:[I.EMERALD,2]},
 {give:[[I.EMERALD,3]],get:[B.PISTON,1]},
 {give:[[I.EMERALD,2]],get:[I.GOLD_INGOT,1]}
];

/* ---------------- 纹理图集（程序化绘制） ---------------- */
const TS=32,ACOLS=8,AROWS=6,PX=2; // 每格32px，逻辑像素2px(16x16)
const atlasCanvas=document.createElement('canvas');
atlasCanvas.width=TS*ACOLS;atlasCanvas.height=TS*AROWS;
const atc=atlasCanvas.getContext('2d');
function tileO(i){return{x:(i%ACOLS)*TS,y:Math.floor(i/ACOLS)*TS};}
function noiseFill(o,cols){for(let y=0;y<16;y++)for(let x=0;x<16;x++){atc.fillStyle=cols[(Math.random()*cols.length)|0];atc.fillRect(o.x+x*PX,o.y+y*PX,PX,PX);}}
function blobAt(o,c,bx,by,s){atc.fillStyle=c;atc.fillRect(o.x+bx*PX,o.y+by*PX,(s||2)*PX,(s||2)*PX);}

(function paintAtlas(){
 const GRASS_C=['#5d9c3f','#55923a','#67a848','#4e8a34'];
 const DIRT_C=['#8b6244','#79553c','#96704e','#6f4e37'];
 const STONE_C=['#8f8f8f','#828282','#9a9a9a','#767676'];
 // 0 草顶
 noiseFill(tileO(0),GRASS_C);
 // 1 草侧
 let o=tileO(1);noiseFill(o,DIRT_C);
 for(let x=0;x<16;x++){let h=3+((Math.random()*2)|0);for(let y=0;y<h;y++)blobAt(o,GRASS_C[(Math.random()*4)|0],x,y,1);}
 // 2 泥土
 noiseFill(tileO(2),DIRT_C);
 // 3 石头
 noiseFill(tileO(3),STONE_C);
 // 4 沙子
 noiseFill(tileO(4),['#dbd3a0','#d1c894','#e2daa9','#cfc48d']);
 // 5 原木侧
 o=tileO(5);noiseFill(o,['#6b4f2e','#654a2b','#71552f']);
 for(let x=0;x<16;x+=3){for(let y=0;y<16;y++){if(Math.random()<0.85)blobAt(o,'#57402a',x,y,1);} }
 for(let x=1;x<16;x+=6){for(let y=0;y<16;y++){if(Math.random()<0.5)blobAt(o,'#7d5f38',x,y,1);} }
 // 6 原木顶
 o=tileO(6);noiseFill(o,['#6b4f2e']);
 const ringC=['#b08b57','#9a774a','#84643c','#b08b57'];
 for(let r=7;r>=0;r--){atc.fillStyle=ringC[r%4];atc.fillRect(o.x+(8-r-1)*PX,o.y+(8-r-1)*PX,(r*2+2)*PX,(r*2+2)*PX);}
 // 7 树叶
 o=tileO(7);noiseFill(o,['#3e7a25','#356b1f','#468a2c','#2f611b']);
 for(let k=0;k<10;k++)blobAt(o,'#1e400f',(Math.random()*15)|0,(Math.random()*15)|0,1);
 // 8 木板
 o=tileO(8);noiseFill(o,['#a8834f','#a07c49','#b08a54']);
 atc.fillStyle='#7c5c33';
 for(let y=3;y<16;y+=4)atc.fillRect(o.x,o.y+y*PX,TS,PX);
 atc.fillRect(o.x+8*PX,o.y,PX,4*PX);atc.fillRect(o.x+3*PX,o.y+8*PX,PX,4*PX);atc.fillRect(o.x+12*PX,o.y+12*PX,PX,4*PX);
 // 9 圆石
 o=tileO(9);atc.fillStyle='#4f4f4f';atc.fillRect(o.x,o.y,TS,TS);
 for(let cy=0;cy<4;cy++)for(let cx=0;cx<4;cx++){
   const g=110+((Math.random()*60)|0);
   atc.fillStyle='rgb('+g+','+g+','+g+')';
   atc.fillRect(o.x+cx*8*PX+1,o.y+cy*8*PX+1,6*PX,6*PX);
 }
 // 10 水
 o=tileO(10);noiseFill(o,['#3b62d9','#3459c4','#426ae2']);
 atc.fillStyle='#6f93ee';for(let y=2;y<16;y+=5)atc.fillRect(o.x+((Math.random()*6)|0)*PX,o.y+y*PX,(6+((Math.random()*6)|0))*PX,PX);
 // 11-13 矿石
 function ore(i,c){o=tileO(i);noiseFill(o,STONE_C);for(let k=0;k<4;k++)blobAt(o,c,2+((Math.random()*11)|0),2+((Math.random()*11)|0),2);}
 ore(11,'#2b2b2b');ore(12,'#d8af93');ore(13,'#4fe3df');
 // 14 基岩
 noiseFill(tileO(14),['#333333','#222222','#454545','#161616']);
 // 15 玻璃
 o=tileO(15);atc.fillStyle='rgba(200,230,240,0.55)';atc.fillRect(o.x,o.y,TS,TS);
 atc.fillStyle='#e8f6fa';
 atc.fillRect(o.x,o.y,TS,PX);atc.fillRect(o.x,o.y+TS-PX,TS,PX);atc.fillRect(o.x,o.y,PX,TS);atc.fillRect(o.x+TS-PX,o.y,PX,TS);
 atc.fillStyle='rgba(255,255,255,0.75)';atc.fillRect(o.x+3*PX,o.y+2*PX,PX,5*PX);atc.fillRect(o.x+4*PX,o.y+7*PX,PX,3*PX);
 // 16 火把侧 / 17 火把顶
 o=tileO(16);atc.fillStyle='#3a2a18';atc.fillRect(o.x+6*PX,o.y+5*PX,4*PX,11*PX);
 atc.fillStyle='#ffb52b';atc.fillRect(o.x+6*PX,o.y+3*PX,4*PX,2*PX);
 atc.fillStyle='#fff3a0';atc.fillRect(o.x+7*PX,o.y+3*PX,2*PX,PX);
 o=tileO(17);atc.fillStyle='#5a4326';atc.fillRect(o.x,o.y,TS,TS);
 atc.fillStyle='#ffb52b';atc.fillRect(o.x+6*PX,o.y+6*PX,4*PX,4*PX);
 atc.fillStyle='#fff3a0';atc.fillRect(o.x+7*PX,o.y+7*PX,2*PX,2*PX);
 // 18 黑曜石
 noiseFill(tileO(18),['#1a1026','#241533','#0d0812','#2c1a40']);
 // 19 TNT侧 / 20 TNT顶
 o=tileO(19);atc.fillStyle='#c53a2a';atc.fillRect(o.x,o.y,TS,TS);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){if(Math.random()<0.2)blobAt(o,Math.random()<0.5?'#b03022':'#d64a38',x,y,1);}
 atc.fillStyle='#e8e0d0';atc.fillRect(o.x,o.y+5*PX,TS,6*PX);
 atc.fillStyle='#222';atc.font='bold 9px monospace';atc.textAlign='center';atc.textBaseline='middle';
 atc.fillText('TNT',o.x+TS/2,o.y+5*PX+3*PX+1);atc.textAlign='left';
 atc.fillStyle='#f5ecdc';atc.fillRect(o.x,o.y,o.x+0,0);
 atc.fillStyle='#7a2a1e';atc.fillRect(o.x,o.y+11*PX,TS,PX);
 o=tileO(20);atc.fillStyle='#c53a2a';atc.fillRect(o.x,o.y,TS,TS);
 atc.fillStyle='#e8e0d0';atc.fillRect(o.x+2*PX,o.y+2*PX,12*PX,12*PX);
 atc.fillStyle='#222';atc.fillRect(o.x+5*PX,o.y+5*PX,6*PX,6*PX);
 // 21 萤石
 o=tileO(21);noiseFill(o,['#d9a844','#c79739','#e6bb55']);
 for(let k=0;k<14;k++)blobAt(o,Math.random()<0.5?'#ffe08a':'#b8862e',2+((Math.random()*12)|0),2+((Math.random()*12)|0),2);
 // 22 下界岩
 noiseFill(tileO(22),['#6e3533','#5c2a28','#7d403d','#4f2220']);
 for(let k=0;k<8;k++)blobAt(tileO(22),'#3d1816',2+((Math.random()*12)|0),2+((Math.random()*12)|0),2);
 // 23 下界石英矿
 o=tileO(23);noiseFill(o,['#6e3533','#5c2a28','#7d403d']);
 for(let k=0;k<4;k++)blobAt(o,'#efe6d8',2+((Math.random()*11)|0),2+((Math.random()*11)|0),2);
 // 24 岩浆
 o=tileO(24);noiseFill(o,['#e25822','#ff7f2a','#c9401a','#f2681e']);
 atc.fillStyle='#ffd23a';for(let y=2;y<16;y+=6)atc.fillRect(o.x+((Math.random()*6)|0)*PX,o.y+y*PX,(5+((Math.random()*6)|0))*PX,PX);
 // 25 传送门
 o=tileO(25);noiseFill(o,['#7b2fbe','#9b4dd6','#6a2aa8','#8d3fc8']);
 for(let k=0;k<10;k++)blobAt(o,'#c58af2',2+((Math.random()*12)|0),2+((Math.random()*12)|0),1);
 // 26 合成台顶 / 27 合成台侧
 o=tileO(26);noiseFill(o,['#a8834f','#a07c49','#b08a54']);
 atc.fillStyle='#5f4626';atc.fillRect(o.x+2*PX,o.y+2*PX,12*PX,12*PX);
 atc.fillStyle='#c9a066';atc.fillRect(o.x+3*PX,o.y+3*PX,10*PX,10*PX);
 atc.fillStyle='#5f4626';atc.fillRect(o.x+7*PX,o.y+3*PX,2*PX,10*PX);atc.fillRect(o.x+3*PX,o.y+7*PX,10*PX,2*PX);
 o=tileO(27);noiseFill(o,['#a8834f','#a07c49','#b08a54']);
 atc.fillStyle='#7c5c33';atc.fillRect(o.x,o.y+6*PX,TS,PX);
 atc.fillStyle='#8b6a3d';atc.fillRect(o.x+2*PX,o.y+8*PX,4*PX,5*PX);atc.fillRect(o.x+10*PX,o.y+8*PX,4*PX,5*PX);
 // 28 熔炉(正面四侧)
 o=tileO(28);atc.fillStyle='#4f4f4f';atc.fillRect(o.x,o.y,TS,TS);
 for(let cy=0;cy<4;cy++)for(let cx=0;cx<4;cx++){const g=100+((Math.random()*50)|0);atc.fillStyle='rgb('+g+','+g+','+g+')';atc.fillRect(o.x+cx*8*PX+1,o.y+cy*8*PX+1,6*PX,6*PX);}
 atc.fillStyle='#1c1c1c';atc.fillRect(o.x+3*PX,o.y+7*PX,10*PX,6*PX);
 atc.fillStyle='#ff8822';atc.fillRect(o.x+4*PX,o.y+10*PX,2*PX,2*PX);atc.fillRect(o.x+7*PX,o.y+11*PX,2*PX,PX);atc.fillRect(o.x+10*PX,o.y+10*PX,2*PX,2*PX);
 atc.fillStyle='#ffcc55';atc.fillRect(o.x+6*PX,o.y+9*PX,4*PX,PX);
 // 29 备用
 // 30 床顶(红白)
 o=tileO(30);atc.fillStyle='#b02020';atc.fillRect(o.x,o.y,TS,TS);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){if(Math.random()<0.15)blobAt(o,'#c93a3a',x,y,1);}
 atc.fillStyle='#f0ead8';atc.fillRect(o.x+1*PX,o.y+1*PX,14*PX,5*PX);
 atc.fillStyle='#d8d2c0';atc.fillRect(o.x+1*PX,o.y+6*PX,14*PX,PX);
 // 31 绿宝石矿
 o=tileO(31);noiseFill(o,STONE_C);
 for(let k=0;k<4;k++)blobAt(o,'#2ecc40',2+((Math.random()*11)|0),2+((Math.random()*11)|0),2);
 for(let k=0;k<4;k++)blobAt(o,'#7ef08a',2+((Math.random()*12)|0),2+((Math.random()*12)|0),1);
 // 32 羊毛
 noiseFill(tileO(32),['#e8e8e8','#dcdcdc','#f2f2f2','#d2d2d2']);
 for(let k=0;k<8;k++)blobAt(tileO(32),'#c8c8c8',2+((Math.random()*12)|0),2+((Math.random()*12)|0),2);
 // 33 宝箱侧 / 34 宝箱顶
 o=tileO(33);noiseFill(o,['#9a7330','#8d6929','#a87c37']);
 atc.fillStyle='#5c421c';atc.fillRect(o.x,o.y,TS,PX);atc.fillRect(o.x,o.y+15*PX,TS,PX);
 atc.fillRect(o.x,o.y+6*PX,TS,PX);
 atc.fillStyle='#c9c9c9';atc.fillRect(o.x+7*PX,o.y+5*PX,2*PX,4*PX);
 atc.fillStyle='#7a7a7a';atc.fillRect(o.x+7*PX,o.y+7*PX,2*PX,PX);
 o=tileO(34);noiseFill(o,['#9a7330','#8d6929','#a87c37']);
 atc.fillStyle='#5c421c';atc.fillRect(o.x,o.y,TS,PX);atc.fillRect(o.x,o.y+15*PX,TS,PX);
 atc.fillRect(o.x,o.y,PX,TS);atc.fillRect(o.x+15*PX,o.y,PX,TS);
 atc.fillStyle='#5c421c';atc.fillRect(o.x+7*PX,o.y,2*PX,TS);
 // 35 活塞侧 / 36 活塞顶(推出面)
 o=tileO(35);noiseFill(o,['#c9a166','#bf965d','#d0a870']);
 atc.fillStyle='#7c5c33';atc.fillRect(o.x,o.y+3*PX,TS,PX);atc.fillRect(o.x,o.y+12*PX,TS,PX);
 atc.fillStyle='#5a4326';atc.fillRect(o.x,o.y,TS,PX);atc.fillRect(o.x,o.y+15*PX,TS,PX);
 atc.fillRect(o.x,o.y,PX,TS);atc.fillRect(o.x+15*PX,o.y,PX,TS);
 o=tileO(36);noiseFill(o,['#c9a166','#bf965d','#d0a870']);
 atc.fillStyle='#8a8a8a';atc.fillRect(o.x+2*PX,o.y+2*PX,12*PX,12*PX);
 atc.fillStyle='#b8b8b8';atc.fillRect(o.x+3*PX,o.y+3*PX,10*PX,10*PX);
 atc.fillStyle='#6a6a6a';atc.fillRect(o.x+7*PX,o.y+2*PX,2*PX,12*PX);atc.fillRect(o.x+2*PX,o.y+7*PX,12*PX,2*PX);
 // 37 原力晶石矿
 o=tileO(37);noiseFill(o,STONE_C);
 for(let k=0;k<5;k++)blobAt(o,'#7af0e0',2+((Math.random()*11)|0),2+((Math.random()*11)|0),2);
 for(let k=0;k<6;k++)blobAt(o,'#c5fbf4',2+((Math.random()*12)|0),2+((Math.random()*12)|0),1);
 atc.fillStyle='#e8fffb';atc.fillRect(o.x+7*PX,o.y+6*PX,2*PX,3*PX);
 // 38 金矿石
 o=tileO(38);noiseFill(o,STONE_C);
 for(let k=0;k<5;k++)blobAt(o,'#f5d94a',2+((Math.random()*11)|0),2+((Math.random()*11)|0),2);
 for(let k=0;k<5;k++)blobAt(o,'#fce98c',2+((Math.random()*12)|0),2+((Math.random()*12)|0),1);
 // 39 耕地顶（带垄沟）
 o=tileO(39);noiseFill(o,['#6b4a2a','#5f3f24','#78552f','#55381f']);
 atc.fillStyle='#3d2a16';for(let x=1;x<16;x+=3)atc.fillRect(o.x+x*PX,o.y,1*PX,TS);
 atc.fillStyle='#8a6a3a';for(let x=3;x<16;x+=3)atc.fillRect(o.x+x*PX,o.y,1*PX,TS);
 // 40 小麦苗（短绿芽）
 o=tileO(40);atc.fillStyle='#8a6a3a';atc.fillRect(o.x,o.y,TS,TS);
 atc.fillStyle='#3e7a25';
 for(let x=3;x<=11;x+=4)atc.fillRect(o.x+x*PX,o.y+9*PX,PX,3*PX);
 atc.fillStyle='#4f9e2a';
 atc.fillRect(o.x+3*PX,o.y+8*PX,2*PX,3*PX);atc.fillRect(o.x+7*PX,o.y+6*PX,2*PX,5*PX);atc.fillRect(o.x+11*PX,o.y+8*PX,2*PX,3*PX);
 // 41 小麦（高绿麦秆）
 o=tileO(41);atc.fillStyle='#8a6a3a';atc.fillRect(o.x,o.y,TS,TS);
 atc.fillStyle='#5f9c2a';
 for(let x=3;x<=11;x+=4)atc.fillRect(o.x+x*PX,o.y+4*PX,PX,8*PX);
 atc.fillStyle='#6fB938';
 atc.fillRect(o.x+2*PX,o.y+3*PX,2*PX,9*PX);atc.fillRect(o.x+6*PX,o.y+1*PX,2*PX,11*PX);atc.fillRect(o.x+10*PX,o.y+3*PX,2*PX,9*PX);
 atc.fillStyle='#c9e64a';atc.fillRect(o.x+7*PX,o.y+1*PX,2*PX,2*PX);
 // 42 成熟小麦（金黄麦穗）
 o=tileO(42);atc.fillStyle='#8a6a3a';atc.fillRect(o.x,o.y,TS,TS);
 atc.fillStyle='#d9b84a';
 for(let x=2;x<=13;x+=3)atc.fillRect(o.x+x*PX,o.y+1*PX,PX,11*PX);
 atc.fillStyle='#f0d25a';
 for(let x=2;x<=13;x+=3)atc.fillRect(o.x+x*PX,o.y+1*PX,PX,2*PX);
 // 43 附魔台顶（紫金字）
 o=tileO(43);noiseFill(o,['#3a2a6a','#33255e','#432f7a']);
 atc.fillStyle='#7a5bd6';atc.fillRect(o.x+2*PX,o.y+2*PX,12*PX,12*PX);
 atc.fillStyle='#f0e6a0';atc.fillRect(o.x+4*PX,o.y+4*PX,2*PX,2*PX);atc.fillRect(o.x+10*PX,o.y+4*PX,2*PX,2*PX);
 atc.fillRect(o.x+4*PX,o.y+10*PX,2*PX,2*PX);atc.fillRect(o.x+10*PX,o.y+10*PX,2*PX,2*PX);
 atc.fillRect(o.x+7*PX,o.y+7*PX,2*PX,2*PX);
 // 44 附魔台侧（深紫书架感）
 o=tileO(44);noiseFill(o,['#2a1f4a','#251a42','#2f2355']);
 atc.fillStyle='#7a5bd6';atc.fillRect(o.x,o.y+4*PX,TS,2*PX);atc.fillRect(o.x,o.y,TS,2*PX);
 atc.fillStyle='#4a3777';atc.fillRect(o.x+2*PX,o.y+1*PX,3*PX,4*PX);atc.fillRect(o.x+11*PX,o.y+1*PX,3*PX,4*PX);
 atc.fillStyle='#e0d6ff';atc.fillRect(o.x+7*PX,o.y+2*PX,2*PX,PX);atc.fillRect(o.x+7*PX,o.y+7*PX,2*PX,PX);
})();
const atlasTex=new THREE.CanvasTexture(atlasCanvas);
atlasTex.magFilter=THREE.NearestFilter;atlasTex.minFilter=THREE.NearestFilter;atlasTex.generateMipmaps=false;

/* ---------------- three.js 场景 ---------------- */
const app=document.getElementById('app');
const renderer=new THREE.WebGLRenderer({antialias:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,IS_MOBILE?1:1.5));
renderer.setSize(window.innerWidth,window.innerHeight);
app.appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x87ceeb);
scene.fog=new THREE.Fog(0x87ceeb,30,120);
const camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.08,500);
camera.rotation.order='YXZ';
scene.add(camera);

const hemi=new THREE.HemisphereLight(0xffffff,0x666055,0.85);scene.add(hemi);
const sunLight=new THREE.DirectionalLight(0xfff3d0,0.9);scene.add(sunLight);scene.add(sunLight.target);

const WY=40,SEA=13,CHUNK=16;let VIEW=IS_MOBILE?3:4; // 世界高度/海平面/区块尺寸/视野半径 —— 手机3区块保性能，水平方向无限

const sunMesh=new THREE.Mesh(new THREE.PlaneGeometry(34,34),new THREE.MeshBasicMaterial({color:0xffdf6b,fog:false}));
const moonMesh=new THREE.Mesh(new THREE.PlaneGeometry(22,22),new THREE.MeshBasicMaterial({color:0xdfe6ff,fog:false}));
scene.add(sunMesh);scene.add(moonMesh);

const clouds=[];
(function(){
 const m=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.4,depthWrite:false});
 for(let i=0;i<12;i++){
  const w=12+Math.random()*18,d=8+Math.random()*12;
  const c=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);
  c.rotation.x=-Math.PI/2;c.rotation.z=Math.random()*Math.PI;
  c.position.set(Math.random()*300-150,37+Math.random()*3,Math.random()*300-150);
  clouds.push(c);scene.add(c);
 }
})();

window.addEventListener('resize',function(){
 camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(window.innerWidth,window.innerHeight);
});

/* ---------------- 世界数据：无限区块（按需生成） ---------------- */
const cdata={over:new Map(),nether:new Map()}; // "cx,cz" → Uint8Array(16×16×40)
let dim='over';
const mapCacheDirty=new Set();
function ckey(cx,cz){return cx+','+cz;}
function idx(x,y,z){return (x&15)+(z&15)*CHUNK+y*CHUNK*CHUNK;}
function h3(x,y,z){return hash2(x*12.9898+y*78.233,z*37.719+y*13.97);}
function colH(x,z){return Math.max(3,Math.min(WY-8,Math.floor(6+fbm(x,z)*18)));}
// 三维洞穴噪声：返回该体素是否应为洞穴空气
function caveNoise(x,y,z){const n=h3(x*0.95+7.1,y*1.7+3.3,z*0.95+2.9);return n>0.525&&n<0.575;}
function chunkData(cx,cz){
 const m=cdata[dim],k=ckey(cx,cz);
 let d=m.get(k);
 if(!d){d=new Uint8Array(CHUNK*CHUNK*WY);m.set(k,d);genChunkInto(d,cx,cz);}
 return d;
}
function getBlock(x,y,z){
 if(y<0)return B.BEDROCK;
 if(y>=WY)return B.AIR;
 x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);
 return chunkData(x>>4,z>>4)[idx(x,y,z)];
}
function isSolid(id){return id!==B.AIR&&id!==B.WATER&&id!==B.LAVA&&id!==B.TORCH&&id!==B.PORTAL&&id!==B.WHEAT_1&&id!==B.WHEAT_2&&id!==B.WHEAT_3;}
function setBlockRaw(x,y,z,id){
 if(y<0||y>=WY)return;
 const lx=x&15,lz=z&15;
 chunkData(x>>4,z>>4)[idx(x,y,z)]=id;
 markDirty(x,z);
 if(lx===0)markDirty(x-1,z);
 if(lx===15)markDirty(x+1,z);
 if(lz===0)markDirty(x,z-1);
 if(lz===15)markDirty(x,z+1);
 mapCacheDirty.add(ckey(x>>4,z>>4));
}

/* ---- 村庄位置（会话内固定，跨区块确定性生成） ---- */
const village=(function findVillage(){
 let best=null,bestScore=1e9;
 for(let t=0;t<70;t++){
  const cx=(Math.random()*2000-1000)|0,cz=(Math.random()*2000-1000)|0;
  let mn=99,mx=-99;
  for(let dx=-7;dx<=7;dx+=3)for(let dz=-7;dz<=7;dz+=3){
   const h=colH(cx+dx,cz+dz);
   if(h<mn)mn=h;if(h>mx)mx=h;
  }
  if(mx-mn<bestScore){bestScore=mx-mn;best={x:cx,z:cz,h:Math.round((mn+mx)/2)};}
  if(bestScore<=1)break;
 }
 return best;
})();

/* ---- 区块内容生成（确定性 → 区块间无缝） ---- */
function genChunkInto(d,cx,cz){
 const x0=cx*CHUNK,z0=cz*CHUNK;
 const put=function(x,y,z,id){if(y>=0&&y<WY&&x>=x0&&x<x0+CHUNK&&z>=z0&&z<z0+CHUNK)d[idx(x,y,z)]=id;};
 if(dim==='nether'){genNetherChunk(d,put,x0,z0);return;}
 for(let lx=0;lx<CHUNK;lx++)for(let lz=0;lz<CHUNK;lz++){
  const x=x0+lx,z=z0+lz,h=colH(x,z),sandy=h<=SEA+1;
  for(let y=0;y<=h;y++){
   let b;
   // 洞穴雕琢（保留深层与地表完整）
   if(y>5&&y<h-2&&caveNoise(x,y,z)){d[idx(x,y,z)]=B.AIR;continue;}
   if(y===0)b=B.BEDROCK;
   else if(y===h)b=sandy?B.SAND:B.GRASS;
   else if(y>h-3)b=sandy?B.SAND:B.DIRT;
   else{
    b=B.STONE;
    const r=h3(x,y,z);
    // 深层岩浆池：更大面积的黑曜石带（提高出心率）
    if(y<14&&hash2(Math.floor(x/3)*3.7,Math.floor(z/3)*8.9)>0.80){
     b=r>0.35?B.LAVA:B.OBSIDIAN;
    }
    else if(y<14&&r<0.025)b=B.OBSIDIAN; // 独立黑曜石脉（更密集）
    else if(r<0.005&&y<12)b=B.DIAMOND_ORE;
    else if(r<0.007&&y<14)b=B.EMERALD_ORE;
    else if(r<0.008&&y<14)b=B.FORCE_ORE;
    else if(r<0.016&&y<18)b=B.GOLD_ORE;
    else if(r<0.028&&y<26)b=B.IRON_ORE;
    else if(r<0.055)b=B.COAL_ORE;
   }
   d[idx(x,y,z)]=b;
  }
  for(let y=h+1;y<=SEA;y++)d[idx(x,y,z)]=B.WATER;
 }
 villageIntoChunk(put);
 treesIntoChunk(put,x0,z0);
 // 地下埋藏宝箱（按区块哈希决定）
 if(hash2(cx*3.3,cz*7.1)>0.965){
  const bx=x0+4+((hash2(cx,cz*1.7)*8)|0),bz=z0+4+((hash2(cz*1.9,cx)*8)|0);
  const by=6+((hash2(cx*1.3,cz*2.7)*10)|0);
  put(bx,by,bz,B.CHEST);put(bx,by+1,bz,B.AIR);
 }
}
function villageIntoChunk(put){
 const vx=village.x,vz=village.z,vh=village.h;
 for(let x=vx-14;x<=vx+14;x++)for(let z=vz-14;z<=vz+14;z++){
  for(let y=vh+1;y<WY;y++)put(x,y,z,B.AIR);
  for(let y=1;y<vh;y++)put(x,y,z,y<vh-3?B.STONE:B.DIRT);
  put(x,vh,z,B.GRASS);
 }
 function house(bx,bz){
  for(let fx=0;fx<5;fx++)for(let fz=0;fz<5;fz++){
   const x=bx+fx,z=bz+fz;
   put(x,vh,z,B.PLANKS);
   for(let y=vh+1;y<vh+5;y++)put(x,y,z,B.AIR);
   const edge=(fx===0||fx===4||fz===0||fz===4);
   if(edge&&vh+3<WY){
    const corner=(fx===0||fx===4)&&(fz===0||fz===4);
    for(let y=vh+1;y<=vh+3;y++)put(x,y,z,corner?B.LOG:B.PLANKS);
   }
  }
  put(bx+2,vh+1,bz,B.AIR);put(bx+2,vh+2,bz,B.AIR); // 门洞
  if(vh+4<WY)for(let fx=0;fx<5;fx++)for(let fz=0;fz<5;fz++)put(bx+fx,vh+4,bz+fz,B.PLANKS); // 屋顶
 }
 house(vx-9,vz-9);house(vx+4,vz-9);house(vx-9,vz+4);house(vx+4,vz+4);
 for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){ // 水井
  const edge=Math.abs(dx)===1||Math.abs(dz)===1;
  if(edge){put(vx+dx,vh,vz+dz,B.COBBLE);put(vx+dx,vh+1,vz+dz,B.AIR);}
  else{put(vx+dx,vh,vz+dz,B.WATER);put(vx+dx,vh-1,vz+dz,B.WATER);put(vx+dx,vh-2,vz+dz,B.COBBLE);}
 }
 // 屋内家具：合成台 / 熔炉 / 床 / 宝箱
 put(vx-6,vh+1,vz-6,B.CRAFT_TABLE);
 put(vx+6,vh+1,vz-6,B.FURNACE);
 put(vx-6,vh+1,vz+6,B.BED);
 put(vx+6,vh+1,vz+6,B.CHEST);
}
function treesIntoChunk(put,x0,z0){
 const vx=village.x,vz=village.z;
 const g0x=Math.floor((x0-8)/5)*5,g1x=x0+CHUNK+8;
 const g0z=Math.floor((z0-8)/5)*5,g1z=z0+CHUNK+8;
 for(let gx=g0x;gx<=g1x;gx+=5)for(let gz=g0z;gz<=g1z;gz+=5){
  if(hash2(gx*1.7+0.5,gz*2.3+0.5)>0.3)continue;
  const tx=gx+((hash2(gx,gz*3.3)*3)|0),tz=gz+((hash2(gx*3.3,gz)*3)|0);
  if(Math.abs(tx-vx)<16&&Math.abs(tz-vz)<16)continue;
  const sy=colH(tx,tz);
  if(sy<=SEA+1||sy>WY-9)continue; // 不长在沙滩/水下
  const th=4+((hash2(tx*1.1,tz*1.9)*2)|0);
  for(let i=1;i<=th;i++)put(tx,sy+i,tz,B.LOG);
  for(let ly=sy+th-1;ly<=sy+th+1&&ly<WY;ly++){
   const r=ly>=sy+th?1:2;
   for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){
    if(dx===0&&dz===0&&ly<=sy+th)continue;
    if(Math.abs(dx)===r&&Math.abs(dz)===r&&hash2(tx*7+dx*1.3,tz*5+dz*2.9+ly)<0.5)continue;
    put(tx+dx,ly,tz+dz,B.LEAVES);
   }
  }
 }
}
function genNetherChunk(d,put,x0,z0){
 for(let lx=0;lx<CHUNK;lx++)for(let lz=0;lz<CHUNK;lz++){
  const x=x0+lx,z=z0+lz;
  const floorH=Math.max(3,Math.min(20,Math.floor(4+fbm(x*1.7+501,z*1.7+77)*12)));
  const ceilH=Math.min(WY-3,Math.max(floorH+8,Math.floor(27+fbm(x*1.3+77,z*1.3+21)*8)));
  for(let y=0;y<WY;y++){
   let b=B.AIR;
   if(y===0||y===WY-1)b=B.BEDROCK;
   else if(y<=floorH){
    b=B.NETHERRACK;
    const r=h3(x,y,z);
    if(r<0.022&&y<floorH-1)b=B.QUARTZ_ORE;
    else if(y===floorH&&r>0.985)b=B.GLOWSTONE;
   }
   else if(y>=ceilH)b=B.NETHERRACK;
   else if(y<=9)b=B.LAVA;
   if(b!==B.AIR)d[idx(x,y,z)]=b;
  }
  if(hash2(x*1.3,z*1.7)>0.986){ // 悬空萤石簇
   const cy=Math.min(WY-3,Math.floor(27+fbm(x*1.3+77,z*1.3+21)*8)-1);
   d[idx(x,cy,z)]=B.GLOWSTONE;
   if(hash2(x,z*3.3)>0.5&&cy-1>9)d[idx(x,cy-1,z)]=B.GLOWSTONE;
  }
  if(hash2(x*3.1+9,z*2.7+4)>0.994){ // 石柱
   const ch=Math.floor(10+hash2(x,z)*14);
   for(let y=10;y<Math.min(WY-2,10+ch);y++)d[idx(x,y,z)]=B.NETHERRACK;
  }
 }
}

// 出生点：村庄附近草地
const spawn=new THREE.Vector3(village.x+0.5,WY-2,village.z+8.5);
function surfaceY(x,z){
 for(let y=WY-1;y>=0;y--){
  const id=getBlock(x,y,z);
  if(id!==B.AIR)return (id===B.WATER||id===B.LEAVES||id===B.LOG)?-1:y+1;
 }
 return -1;
}
(function findSpawn(){
 for(let r=0;r<40;r++)for(let a=0;a<12;a++){
  const x=Math.round(village.x+Math.cos(a/12*Math.PI*2)*r);
  const z=Math.round(village.z+Math.sin(a/12*Math.PI*2)*r);
  const sy=surfaceY(x,z);
  if(sy>SEA&&getBlock(x,sy-1,z)===B.GRASS){spawn.set(x+0.5,sy+0.2,z+0.5);return;}
 }
})();

/* ---------------- 传送门 / 维度切换 ---------------- */
const portalAnchors={over:[],nether:[]};
function otherDimName(){return dim==='over'?'nether':'over';}
function tryIgnitePortal(ax,ay,az){
 // 在点击点附近搜索合法的 2×3 黑曜石门框（内部全空气 + 四圈黑曜石），更宽松
 for(const axis of [0,1]){ // 0: 门沿x方向展开；1: 门沿z方向展开
  for(let oy=-2;oy<=0;oy++){
   const by=ay+oy;
   for(let o=-3;o<=0;o++){
    const bx=axis===0?ax+o:ax, bz=axis===0?az:az+o;
    let ok=true;
    for(let i=0;i<2&&ok;i++)for(let j=0;j<3&&ok;j++){
     const cx=axis===0?bx+i:bx, cz=axis===0?bz:bz+i;
     const c=getBlock(cx,by+j,cz);
     if(c!==B.AIR&&c!==B.PORTAL)ok=false;
    }
    if(ok)for(let i=0;i<2&&ok;i++){
     if(getBlock(axis===0?bx+i:bx,by-1,axis===0?bz:bz+i)!==B.OBSIDIAN)ok=false;
     if(getBlock(axis===0?bx+i:bx,by+3,axis===0?bz:bz+i)!==B.OBSIDIAN)ok=false;
    }
    if(ok)for(let j=0;j<3&&ok;j++){
     if(getBlock(axis===0?bx-1:bx,by+j,axis===0?bz:bz-1)!==B.OBSIDIAN)ok=false;
     if(getBlock(axis===0?bx+2:bx,by+j,axis===0?bz:bz+2)!==B.OBSIDIAN)ok=false;
    }
    if(ok){
     for(let i=0;i<2;i++)for(let j=0;j<3;j++){
      setBlockRaw(axis===0?bx+i:bx,by+j,axis===0?bz:bz+i,B.PORTAL);
     }
     portalAnchors[dim].push({x:bx,y:by,z:bz});
     sfxPortal();
     burst(bx+1,by+1.5,bz+0.5,0x9b4dd6,30,3,0.16,1,1);
     showMsg('下界传送门已点燃！');
     return true;
    }
   }
  }
 }
 return false;
}
function findPortalNear(t,x,z,r){
 let best=null,bd=1e9;
 for(const a of portalAnchors[t]){
  const d=Math.abs(a.x-x)+Math.abs(a.z-z);
  if(d<bd){bd=d;best=a;}
 }
 return bd<=r?best:null;
}
function buildPortal(x,z,t){
 let y;
 if(t==='nether'){
  y=-1;
  for(let yy=10;yy<26;yy++){
   if(isSolid(getBlock(x,yy-1,z))&&!isSolid(getBlock(x,yy,z))&&
      !isSolid(getBlock(x,yy+1,z))&&!isSolid(getBlock(x,yy+2,z))&&
      !isSolid(getBlock(x,yy+3,z))){y=yy;break;}
  }
  if(y<0)y=14;
 }else{
  y=Math.max(2,surfaceY(x,z));
  if(y<3)y=13;
 }
 const preDim=dim;
 dim=t; // setBlockRaw/getBlock 按当前维度写入
 // 门框（4宽×5高，内部2×3），沿x方向
 for(let i=-1;i<=2;i++)for(let j=-1;j<=3;j++){
  const edge=(i===-1||i===2||j===-1||j===3);
  setBlockRaw(x+i,y+j,z,edge?B.OBSIDIAN:B.PORTAL);
 }
 // 门内地板加固 + 门口平台
 for(let i=-1;i<=2;i++){
  if(!isSolid(getBlock(x+i,y-2,z)))setBlockRaw(x+i,y-2,z,t==='nether'?B.NETHERRACK:B.COBBLE);
  setBlockRaw(x+i,y-1,z,B.OBSIDIAN);
 }
 dim=preDim;
 const anchor={x:x,y:y,z:z};
 portalAnchors[t].push(anchor);
 return anchor;
}
function disposeAllChunks(){
 chunks.forEach(function(rec){
  rec.meshes.forEach(function(m){scene.remove(m);m.geometry.dispose();});
 });
 chunks.clear();dirtySet.clear();
}
function buildChunksAround(px,pz){
 const pcx=Math.floor(px)>>4,pcz=Math.floor(pz)>>4;
 for(let dx=-VIEW;dx<=VIEW;dx++)for(let dz=-VIEW;dz<=VIEW;dz++){
  const k=ckey(pcx+dx,pcz+dz);
  if(!chunks.has(k))rebuildChunk(k);
 }
 chunks.forEach(function(rec,k){
  const p=k.split(','),cx=+p[0],cz=+p[1];
  if(Math.abs(cx-pcx)>VIEW+1||Math.abs(cz-pcz)>VIEW+1){
   rec.meshes.forEach(function(m){scene.remove(m);m.geometry.dispose();});
   chunks.delete(k);
  }
 });
}
function setEnv(t){
 if(t==='nether'){
  scene.background.setHex(0x1b0505);scene.fog.color.setHex(0x300a0a);
  scene.fog.near=6;scene.fog.far=58;
  hemi.intensity=0.55;hemi.color.setHex(0xffb090);
  sunLight.intensity=0.1;
  sunMesh.visible=false;moonMesh.visible=false;
  clouds.forEach(function(c){c.visible=false;});
 }else{
  scene.background.setHex(0x87ceeb);scene.fog.color.setHex(0x87ceeb);
  hemi.color.setHex(0xffffff);sunLight.intensity=0.9;
  sunMesh.visible=true;moonMesh.visible=true;
  clouds.forEach(function(c){c.visible=true;});
 }
}
function travelTo(t){
 const from=player.pos.clone();
 clearAllMobs();clearArrows();clearTnts();clearDrops();
 disposeAllChunks();
 dim=t;
 setEnv(t);
 let a=findPortalNear(t,Math.round(from.x),Math.round(from.z),14);
 if(!a)a=buildPortal(Math.round(from.x),Math.round(from.z),t);
 player.pos.set(a.x+1,a.y+0.1,a.z+0.5);
 player.vx=player.vy=player.vz=0;
 buildChunksAround(player.pos.x,player.pos.z);
 portalT=0;portalCd=4;
 sfxPortal();
 burst(player.pos.x,player.pos.y+1,player.pos.z,0x9b4dd6,40,5,0.18,1,2);
 showMsg(t==='nether'?'🔥 欢迎来到下界！':'🏠 回到主世界');
}

/* ---------------- 区块网格构建 ---------------- */
const FACES=[
 {dir:[-1,0,0],corners:[[0,1,0],[0,0,0],[0,1,1],[0,0,1]]},
 {dir:[ 1,0,0],corners:[[1,1,1],[1,0,1],[1,1,0],[1,0,0]]},
 {dir:[0,-1,0],corners:[[1,0,1],[0,0,1],[1,0,0],[0,0,0]]},
 {dir:[0, 1,0],corners:[[0,1,1],[1,1,1],[0,1,0],[1,1,0]]},
 {dir:[0,0,-1],corners:[[1,0,0],[0,0,0],[1,1,0],[0,1,0]]},
 {dir:[0,0, 1],corners:[[0,0,1],[1,0,1],[0,1,1],[1,1,1]]}
];
const FUV=[[0,1],[0,0],[1,1],[1,0]];
const solidMat=new THREE.MeshLambertMaterial({map:atlasTex});
const waterMat=new THREE.MeshLambertMaterial({map:atlasTex,transparent:true,opacity:0.62,side:THREE.DoubleSide,depthWrite:false});
const glassMat=new THREE.MeshLambertMaterial({map:atlasTex,transparent:true,opacity:0.55,side:THREE.DoubleSide});
const emitMat=new THREE.MeshBasicMaterial({map:atlasTex});
const portalMat=new THREE.MeshBasicMaterial({map:atlasTex,transparent:true,opacity:0.82,side:THREE.DoubleSide,depthWrite:false});

const chunks=new Map();
const dirtySet=new Set();
function markDirty(x,z){
 dirtySet.add((x>>4)+','+(z>>4));
}
function catOf(b){const d=BLOCKS[b];return d&&d.cat?d.cat:'solid';}
const SEE_THROUGH=[B.AIR,B.WATER,B.LAVA,B.GLASS,B.TORCH,B.BED,B.PORTAL,B.WHEAT_1,B.WHEAT_2,B.WHEAT_3];
function faceShow(b,nb){
 const cat=catOf(b);
 if(b===nb)return false;
 if(cat==='solid'||cat==='emit'){
  if(nb===B.LEAVES)return b!==B.LEAVES;
  return SEE_THROUGH.indexOf(nb)>=0;
 }
 if(cat==='glass')return nb===B.AIR||nb===B.WATER||nb===B.LAVA||nb===B.TORCH||nb===B.BED||nb===B.PORTAL;
 if(cat==='water')return nb===B.AIR;
 if(cat==='portal')return nb===B.AIR||nb===B.TORCH||nb===B.BED;
 return false;
}
function pushFace(bk,x,y,z,f,tile,isWater){
 const base=bk.p.length/3;
 const inset=0.03;
 for(let ci=0;ci<4;ci++){
  const c=f.corners[ci];
  let cy=c[1];
  if(isWater&&cy===1)cy=0.86;
  bk.p.push(x+c[0],y+cy,z+c[2]);
  bk.n.push(f.dir[0],f.dir[1],f.dir[2]);
  const tx=tile%ACOLS,ty=Math.floor(tile/ACOLS);
  const lu=inset+FUV[ci][0]*(1-2*inset);
  const lv=inset+FUV[ci][1]*(1-2*inset);
  bk.u.push((tx+lu)/ACOLS,(AROWS-ty-1+lv)/AROWS);
 }
 bk.i.push(base,base+1,base+2,base+2,base+1,base+3);
}
function pushBox(bk,x,y,z,lo,hi,topT,botT,sideT){
 for(let fi=0;fi<6;fi++){
  const f=FACES[fi];
  const tile=f.dir[1]>0?topT:f.dir[1]<0?botT:sideT;
  pushFace(bk,x,y,z,{dir:f.dir,corners:f.corners.map(function(c){
   return[c[0]?hi[0]:lo[0],c[1]?hi[1]:lo[1],c[2]?hi[2]:lo[2]];
  })},tile,false);
 }
}
function mkBucket(){return{p:[],n:[],u:[],i:[]};}
const BUCKET_MATS={solid:[solidMat,0],emit:[emitMat,0],glass:[glassMat,1],portal:[portalMat,2],water:[waterMat,3]};
function rebuildChunk(key){
 const parts=key.split(',');
 const cx=+parts[0],cz=+parts[1];
 const old=chunks.get(key);
 if(old)old.meshes.forEach(function(m){scene.remove(m);m.geometry.dispose();});
 const bk={};
 for(const k in BUCKET_MATS)bk[k]=mkBucket();
 const cd=chunkData(cx,cz);
 for(let lx=0;lx<CHUNK;lx++)for(let lz=0;lz<CHUNK;lz++){
  const x=cx*CHUNK+lx,z=cz*CHUNK+lz;
  for(let y=0;y<WY;y++){
   const b=cd[idx(x,y,z)];
   if(!b)continue;
   const def=BLOCKS[b];
   const cat=catOf(b);
   if(cat==='torch'){pushBox(bk.solid,x,y,z,[0.44,0,0.44],[0.56,0.62,0.56],def.tiles[0],def.tiles[1],def.tiles[2]);continue;}
   if(cat==='bed'){pushBox(bk.solid,x,y,z,[0.02,0,0.02],[0.98,0.56,0.98],def.tiles[0],def.tiles[1],def.tiles[2]);continue;}
   if(cat==='crop'){
    const hgt=b===B.WHEAT_1?0.35:b===B.WHEAT_2?0.62:0.88;
    pushBox(bk.solid,x,y,z,[0.28,0,0.28],[0.72,hgt,0.72],def.tiles[0],def.tiles[1],def.tiles[2]);continue;
   }
   const dst=bk[cat];
   for(let fi=0;fi<6;fi++){
    const f=FACES[fi];
    const nb=getBlock(x+f.dir[0],y+f.dir[1],z+f.dir[2]);
    if(!faceShow(b,nb))continue;
    const tile=f.dir[1]>0?def.tiles[0]:f.dir[1]<0?def.tiles[1]:def.tiles[2];
    pushFace(dst,x,y,z,f,tile,cat==='water');
   }
  }
 }
 const rec={meshes:[]};
 for(const k in bk){
  const arr=bk[k];
  if(!arr.p.length)continue;
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(arr.p),3));
  g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(arr.n),3));
  g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(arr.u),2));
  g.setIndex(arr.i);
  const m=new THREE.Mesh(g,BUCKET_MATS[k][0]);
  m.renderOrder=BUCKET_MATS[k][1];
  scene.add(m);
  rec.meshes.push(m);
 }
 chunks.set(key,rec);
}
function processDirty(){
 if(!dirtySet.size)return;
 dirtySet.forEach(rebuildChunk);
 dirtySet.clear();
}
buildChunksAround(spawn.x,spawn.z);

/* ---------------- 体素射线检测 (DDA) ---------------- */
function raycastVoxel(o,d,maxDist){
 let x=Math.floor(o.x),y=Math.floor(o.y),z=Math.floor(o.z);
 const stepX=d.x>0?1:-1,stepY=d.y>0?1:-1,stepZ=d.z>0?1:-1;
 const adx=Math.abs(d.x),ady=Math.abs(d.y),adz=Math.abs(d.z);
 let tMaxX=adx>1e-9?((stepX>0?(x+1-o.x):(o.x-x))/adx):Infinity;
 let tMaxY=ady>1e-9?((stepY>0?(y+1-o.y):(o.y-y))/ady):Infinity;
 let tMaxZ=adz>1e-9?((stepZ>0?(z+1-o.z):(o.z-z))/adz):Infinity;
 const tDX=adx>1e-9?1/adx:Infinity,tDY=ady>1e-9?1/ady:Infinity,tDZ=adz>1e-9?1/adz:Infinity;
 let nx=0,ny=0,nz=0,t=0;
 while(t<=maxDist){
  if(tMaxX<tMaxY&&tMaxX<tMaxZ){x+=stepX;t=tMaxX;tMaxX+=tDX;nx=-stepX;ny=0;nz=0;}
  else if(tMaxY<tMaxZ){y+=stepY;t=tMaxY;tMaxY+=tDY;ny=-stepY;nx=0;nz=0;}
  else{z+=stepZ;t=tMaxZ;tMaxZ+=tDZ;nz=-stepZ;nx=0;ny=0;}
  if(t>maxDist)break;
  const b=getBlock(x,y,z);
  if(b!==B.AIR&&b!==B.WATER&&b!==B.LAVA&&b!==B.PORTAL)return{x:x,y:y,z:z,b:b,nx:nx,ny:ny,nz:nz,dist:t};
 }
 return null;
}

/* ---------------- 音效（WebAudio） ---------------- */
let AC=null;
function actx(){
 if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}
 if(AC&&AC.state==='suspended')AC.resume();
 return AC;
}
function tone(freq,dur,type,vol,slide){
 const c=actx();if(!c)return;
 const o=c.createOscillator(),g=c.createGain();
 o.type=type||'square';
 o.frequency.setValueAtTime(freq,c.currentTime);
 if(slide)o.frequency.linearRampToValueAtTime(Math.max(30,freq+slide),c.currentTime+dur);
 g.gain.setValueAtTime(vol||0.12,c.currentTime);
 g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
 o.connect(g);g.connect(c.destination);
 o.start();o.stop(c.currentTime+dur+0.05);
}
function noiseS(dur,vol,freq){
 const c=actx();if(!c)return;
 const n=(c.sampleRate*dur)|0;
 const buf=c.createBuffer(1,n,c.sampleRate);
 const d=buf.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
 const s=c.createBufferSource();s.buffer=buf;
 const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=freq||800;
 const g=c.createGain();g.gain.value=vol;
 s.connect(f);f.connect(g);g.connect(c.destination);s.start();
}
const sfxBreak=function(){noiseS(0.15,0.5,900);};
const sfxPlace=function(){tone(190,0.07,'triangle',0.15,0);};
const sfxHit=function(){tone(150,0.09,'square',0.18,-60);};
const sfxHurt=function(){tone(280,0.25,'sawtooth',0.2,-160);};
const sfxEat=function(){tone(320,0.06,'triangle',0.12,0);setTimeout(function(){tone(260,0.06,'triangle',0.12,0);},90);};
const sfxPop=function(){tone(520,0.08,'sine',0.14,240);};
const sfxBoom=function(){noiseS(0.8,0.9,220);};
const sfxCraft=function(){tone(440,0.1,'triangle',0.12,120);};
const sfxPortal=function(){tone(120,0.7,'sine',0.22,340);setTimeout(function(){tone(90,0.5,'sine',0.16,-40);},180);};
const sfxFuse=function(){noiseS(0.35,0.35,2400);};
const sfxSleep=function(){tone(392,0.35,'sine',0.14,0);setTimeout(function(){tone(523,0.5,'sine',0.14,0);},300);};
const sfxArrow=function(){noiseS(0.12,0.2,3200);};

/* ---------------- 粒子系统 ---------------- */
const bursts=[];
function burst(x,y,z,color,n,spread,size,life,grav){
 n=n||18;spread=spread||3;size=size||0.14;life=life||0.7;grav=grav===undefined?9:grav;
 const posArr=new Float32Array(n*3);
 const vel=[];
 for(let i=0;i<n;i++){
  posArr[i*3]=x;posArr[i*3+1]=y;posArr[i*3+2]=z;
  vel.push(new THREE.Vector3((Math.random()-0.5)*spread,(Math.random()-0.2)*spread,(Math.random()-0.5)*spread));
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.BufferAttribute(posArr,3));
 const mat=new THREE.PointsMaterial({color:color,size:size,transparent:true,opacity:1});
 const pts=new THREE.Points(geo,mat);
 scene.add(pts);
 bursts.push({pts:pts,vel:vel,t:0,life:life,grav:grav});
}
function updateParticles(dt){
 for(let i=bursts.length-1;i>=0;i--){
  const b=bursts[i];
  b.t+=dt;
  if(b.t>=b.life){scene.remove(b.pts);b.pts.geometry.dispose();b.pts.material.dispose();bursts.splice(i,1);continue;}
  const arr=b.pts.geometry.attributes.position.array;
  for(let j=0;j<b.vel.length;j++){
   const v=b.vel[j];
   v.y-=b.grav*dt;
   arr[j*3]+=v.x*dt;arr[j*3+1]+=v.y*dt;arr[j*3+2]+=v.z*dt;
  }
  b.pts.geometry.attributes.position.needsUpdate=true;
  b.pts.material.opacity=1-b.t/b.life;
 }
}

/* ---------------- 物品图标绘制 ---------------- */
function drawIcon(ctx,id,size){
 ctx.clearRect(0,0,size,size);
 ctx.imageSmoothingEnabled=false;
 const def=ITEMS[id];if(!def)return;
 if(def.kind==='block'){
  const t=BLOCKS[id].tiles[2];
  ctx.drawImage(atlasCanvas,(t%ACOLS)*TS,Math.floor(t/ACOLS)*TS,TS,TS,0,0,size,size);
  return;
 }
 ctx.save();ctx.translate(size/2,size/2);
 const u=size/100; // 单位
 function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x*u,y*u,w*u,h*u);}
 switch(id){
  case I.WOOD_SWORD: case I.STONE_SWORD: case I.IRON_SWORD: case I.DIAMOND_SWORD:{
   const bc=id===I.WOOD_SWORD?'#8b5a2b':id===I.STONE_SWORD?'#9d9d9d':id===I.IRON_SWORD?'#e0e0e0':'#4fe3df';
   ctx.rotate(-Math.PI/4);
   rect(-6,-46,12,64,bc);
   ctx.beginPath();ctx.fillStyle=bc;ctx.moveTo(-6*u,-46*u);ctx.lineTo(0,-56*u);ctx.lineTo(6*u,-46*u);ctx.closePath();ctx.fill();
   rect(-16,18,32,8,'#6b4a24');
   rect(-5,26,10,22,'#5a3d1e');
   break;}
  case I.WOOD_PICK: case I.STONE_PICK: case I.IRON_PICK: case I.DIAMOND_PICK:{
   const hc=id===I.WOOD_PICK?'#8b5a2b':id===I.STONE_PICK?'#9d9d9d':id===I.IRON_PICK?'#e0e0e0':'#4fe3df';
   rect(-5,-30,10,64,'#6b4a24');
   rect(-34,-38,68,10,hc);
   rect(-40,-28,10,14,hc);rect(30,-28,10,14,hc);
   break;}
  case I.STICK:
   ctx.rotate(-Math.PI/4);rect(-5,-36,10,72,'#6b4a24');break;
  case I.COAL:
   ctx.fillStyle='#2b2b2b';ctx.beginPath();ctx.arc(0,0,26*u,0,7);ctx.fill();
   rect(-10,-14,10,10,'#555');break;
  case I.IRON_INGOT:
   rect(-28,-14,56,26,'#e6e6e6');rect(-28,-14,56,8,'#ffffff');rect(-28,6,56,6,'#aaa');break;
  case I.DIAMOND:
   ctx.rotate(Math.PI/4);rect(-20,-20,40,40,'#4fe3df');rect(-20,-20,18,18,'#b9fbf8');break;
  case I.PORKCHOP:
   ctx.fillStyle='#f2a0a0';ctx.beginPath();ctx.ellipse(4,-4,26*u,20*u,0.4,0,7);ctx.fill();
   rect(-30,10,16,10,'#f5ecdc');break;
  case I.ROTTEN_FLESH:
   rect(-26,-18,52,38,'#7a5b2f');rect(-14,-10,12,10,'#6b8f3a');rect(6,2,12,10,'#8f6b3a');break;
  case I.GUNPOWDER:
   ctx.fillStyle='#8a8a8a';
   [[-18,8],[-4,-14],[12,4],[22,-12],[-8,-2],[4,18]].forEach(function(p){ctx.beginPath();ctx.arc(p[0]*u,p[1]*u,8*u,0,7);ctx.fill();});break;
  case I.APPLE:
   ctx.fillStyle='#d43a2f';ctx.beginPath();ctx.arc(0,6,22*u,0,7);ctx.fill();
   rect(-3,-24,6,14,'#6b4a24');rect(4,-22,12,6,'#3e7a25');break;
  case I.FLINT_STEEL:
   ctx.strokeStyle='#b8b8b8';ctx.lineWidth=9*u;ctx.beginPath();ctx.arc(-4,0,20*u,Math.PI*0.5,Math.PI*1.6);ctx.stroke();
   ctx.lineWidth=2*u;ctx.strokeStyle='#7c7c7c';ctx.beginPath();ctx.arc(-4,0,26*u,Math.PI*0.5,Math.PI*1.6);ctx.stroke();
   ctx.fillStyle='#3d3d3d';ctx.beginPath();ctx.moveTo(14*u,-16*u);ctx.lineTo(30*u,-6*u);ctx.lineTo(18*u,10*u);ctx.closePath();ctx.fill();break;
  case I.COOKED_PORKCHOP:
   ctx.fillStyle='#b5722f';ctx.beginPath();ctx.ellipse(4,-4,26*u,20*u,0.4,0,7);ctx.fill();
   ctx.fillStyle='#8f5518';ctx.beginPath();ctx.ellipse(8,0,16*u,12*u,0.4,0,7);ctx.fill();
   rect(-30,10,16,10,'#f5ecdc');break;
  case I.MUTTON:
   ctx.fillStyle='#d04a3a';ctx.beginPath();ctx.ellipse(2,-2,24*u,17*u,0.2,0,7);ctx.fill();
   ctx.fillStyle='#a83428';ctx.beginPath();ctx.ellipse(6,2,14*u,10*u,0.2,0,7);ctx.fill();
   rect(-30,8,14,8,'#f0ead8');rect(24,-4,10,8,'#f0ead8');break;
  case I.BONE:
   ctx.rotate(Math.PI/5);rect(-7,-30,14,60,'#f2eee0');
   ctx.fillStyle='#f2eee0';
   ctx.beginPath();ctx.arc(-8*u,-32*u,9*u,0,7);ctx.fill();ctx.beginPath();ctx.arc(8*u,-32*u,9*u,0,7);ctx.fill();
   ctx.beginPath();ctx.arc(-8*u,32*u,9*u,0,7);ctx.fill();ctx.beginPath();ctx.arc(8*u,32*u,9*u,0,7);ctx.fill();break;
  case I.EMERALD:
   ctx.rotate(Math.PI/4);rect(-20,-20,40,40,'#2ecc71');rect(-20,-20,18,18,'#8df0ac');rect(4,4,16,16,'#1a8a4a');break;
  case I.QUARTZ:
   ctx.rotate(Math.PI/4);rect(-19,-19,38,38,'#efe6d8');rect(-19,-19,16,16,'#fdf8ef');rect(5,5,14,14,'#cbb9a2');break;
  case I.GOLD_INGOT:
   rect(-28,-14,56,26,'#f5d94a');rect(-28,-14,56,8,'#fbe98c');rect(-28,6,56,6,'#d4af1e');break;
  case I.BOW:
   ctx.strokeStyle='#8b5a2b';ctx.lineWidth=7*u;
   ctx.beginPath();ctx.arc(-14*u,0,34*u,-Math.PI*0.45,Math.PI*0.45);ctx.stroke();
   ctx.strokeStyle='#e8e8e8';ctx.lineWidth=2*u;
   ctx.beginPath();
   ctx.moveTo(-14*u+34*u*Math.cos(-Math.PI*0.45),34*u*Math.sin(-Math.PI*0.45));
   ctx.lineTo(-14*u+34*u*Math.cos(Math.PI*0.45),34*u*Math.sin(Math.PI*0.45));
   ctx.stroke();break;
  case I.ARROW:
   ctx.rotate(-Math.PI/4);
   rect(-3,-34,6,58,'#b9a37e');
   ctx.fillStyle='#c9c9c9';ctx.beginPath();ctx.moveTo(-6*u,-34*u);ctx.lineTo(0,-46*u);ctx.lineTo(6*u,-34*u);ctx.closePath();ctx.fill();
   ctx.fillStyle='#e8e8e8';
   ctx.beginPath();ctx.moveTo(-3*u,24*u);ctx.lineTo(-12*u,34*u);ctx.lineTo(-2*u,32*u);ctx.closePath();ctx.fill();
   ctx.beginPath();ctx.moveTo(3*u,24*u);ctx.lineTo(12*u,34*u);ctx.lineTo(2*u,32*u);ctx.closePath();ctx.fill();
   break;
  case I.GOLDEN_APPLE:
   ctx.fillStyle='#f5c542';ctx.beginPath();ctx.arc(0,6,22*u,0,7);ctx.fill();
   ctx.fillStyle='#fbe98c';ctx.beginPath();ctx.arc(-6*u,2*u,10*u,0,7);ctx.fill();
   rect(-3,-24,6,14,'#6b4a24');rect(4,-22,12,6,'#3e7a25');break;
  case I.FORCE_SHARD:
   ctx.rotate(Math.PI/4);
   rect(-9,-24,18,48,'#7af0e0');rect(-9,-24,8,20,'#d5fdf7');rect(1,4,8,20,'#4ecfc0');
   ctx.fillStyle='#e8fffb';
   ctx.beginPath();ctx.moveTo(0,-34*u);ctx.lineTo(9*u,-24*u);ctx.lineTo(-9*u,-24*u);ctx.closePath();ctx.fill();
   ctx.beginPath();ctx.moveTo(0,34*u);ctx.lineTo(9*u,24*u);ctx.lineTo(-9*u,24*u);ctx.closePath();ctx.fill();break;
  case I.FORCE_APPLE:
   ctx.fillStyle='#3ecfc0';ctx.beginPath();ctx.arc(0,6,22*u,0,7);ctx.fill();
   ctx.fillStyle='#a5f7ee';ctx.beginPath();ctx.arc(-6*u,2*u,10*u,0,7);ctx.fill();
   rect(-3,-24,6,14,'#6b4a24');rect(4,-22,12,6,'#3e7a25');break;
  case I.SEEDS: // 小麦种子
   ctx.fillStyle='#8a6a3a';ctx.beginPath();ctx.ellipse(0,0,18*u,12*u,0,0,7);ctx.fill();
   ctx.fillStyle='#c9a166';ctx.beginPath();ctx.ellipse(2,-2,8*u,5*u,0.3,0,7);ctx.fill();
   rect(-8,14,16,6,'#6b4a2a');break;
  case I.WHEAT: // 小麦麦穗
   ctx.fillStyle='#d9b84a';rect(-4,-34,8,52,'#e0bf50');
   for(let i=0;i<3;i++){ctx.fillStyle='#d9b84a';ctx.fillRect((-1+i*4)*u,-34*u,3*u,10*u);}
   ctx.fillStyle='#f0d25a';rect(-5,-34,10,4,'#f0d25a');rect(-5,-24,10,3,'#f0d25a');rect(-5,-14,10,3,'#f0d25a');
   break;
  case I.BREAD: // 面包
   ctx.fillStyle='#d9a45a';ctx.fillRect(-10*u,-8*u,20*u,18*u);
   ctx.beginPath();ctx.moveTo(-10*u,10*u);ctx.lineTo(-6*u,4*u);ctx.lineTo(-2*u,8*u);ctx.lineTo(2*u,-2*u);ctx.lineTo(6*u,6*u);ctx.lineTo(9*u,-4*u);ctx.lineTo(10*u,10*u);ctx.closePath();ctx.fillStyle='#c98e3e';ctx.fill();
   rect(-8,16,16,6,'#a87030');break;
  case I.RAW_FISH: // 生鱼
   ctx.fillStyle='#8fb8a8';ctx.beginPath();ctx.ellipse(0,0,30*u,14*u,0,0,7);ctx.fill();
   ctx.fillStyle='#f0f5f2';ctx.beginPath();ctx.ellipse(-8,0,14*u,7*u,0,0,7);ctx.fill();
   ctx.fillStyle='#20242a';ctx.beginPath();ctx.arc(12,0,3*u,0,7);ctx.fill();
   ctx.fillStyle='#4a6b5a';ctx.beginPath();ctx.moveTo(-30*u,0);ctx.lineTo(-40*u,-10*u);ctx.lineTo(-40*u,10*u);ctx.closePath();ctx.fill();break;
  case I.COOKED_FISH: // 熟鱼
   ctx.fillStyle='#c9955a';ctx.beginPath();ctx.ellipse(0,0,30*u,14*u,0,0,7);ctx.fill();
   ctx.fillStyle='#e0b97a';ctx.beginPath();ctx.ellipse(-8,0,14*u,7*u,0,0,7);ctx.fill();
   ctx.fillStyle='#6a3a1a';ctx.beginPath();ctx.arc(12,0,3*u,0,7);ctx.fill();
   ctx.fillStyle='#8a5a30';ctx.beginPath();ctx.moveTo(-30*u,0);ctx.lineTo(-40*u,-10*u);ctx.lineTo(-40*u,10*u);ctx.closePath();ctx.fill();break;
  case I.COOKED_CHICKEN: // 熟鸡肉
   ctx.fillStyle='#c98a4a';ctx.beginPath();ctx.ellipse(0,0,24*u,14*u,0.2,0,7);ctx.fill();
   ctx.fillStyle='#e0b070';ctx.beginPath();ctx.ellipse(-4,0,12*u,8*u,0.2,0,7);ctx.fill();
   ctx.fillStyle='#e0a050';ctx.fillRect(-6*u,-8*u,8*u,6*u);break;
  case I.FISH_ROD: // 钓鱼竿
   ctx.strokeStyle='#8b5a2b';ctx.lineWidth=5*u;
   ctx.beginPath();ctx.moveTo(-14*u,30*u);ctx.quadraticCurveTo(-30*u,-10*u,-2*u,-38*u);ctx.lineTo(16*u,-30*u);ctx.stroke();
   ctx.strokeStyle='#e8e8e8';ctx.lineWidth=1.5*u;
   ctx.beginPath();ctx.moveTo(14*u,-32*u);ctx.lineTo(24*u,-38*u);ctx.stroke();
   break;
 }
 ctx.restore();
}
const iconCache={};
function iconCanvas(id){
 if(iconCache[id])return iconCache[id];
 const c=document.createElement('canvas');c.width=c.height=64;
 drawIcon(c.getContext('2d'),id,64);
 iconCache[id]=c;return c;
}

/* ---------------- 背包 / 快捷栏 ---------------- */
const hotbar=new Array(9).fill(null);
const backpack=[]; // 无限背包
let sel=0;
function countOf(id){
 let n=0;
 for(const s of hotbar)if(s&&s.id===id)n+=s.count;
 for(const s of backpack)if(s&&s.id===id)n+=s.count;
 return n;
}
function addItem(id,n){
 const stackable=ITEMS[id].kind!=='sword'&&ITEMS[id].kind!=='pick';
 if(stackable)for(const s of hotbar){if(s&&s.id===id&&s.count<64){const add=Math.min(n,64-s.count);s.count+=add;n-=add;if(n<=0){updateHotbarUI();return true;}}}
 for(let i=0;i<9&&n>0;i++){if(!hotbar[i]){hotbar[i]={id:id,count:stackable?n:1};n-=stackable?n:1;if(n<=0){updateHotbarUI();refreshHeld();return true;}}}
 // 快捷栏满了 → 放入背包
 if(n>0&&stackable)for(const s of backpack){if(s&&s.id===id&&s.count<64){const add=Math.min(n,64-s.count);s.count+=add;n-=add;if(n<=0){updateHotbarUI();return true;}}}
 while(n>0){backpack.push({id:id,count:stackable?Math.min(n,64):1});n-=stackable?Math.min(n,64):1;}
 updateHotbarUI();refreshHeld();
 return true;
}
function removeItems(id,n){
 for(let i=0;i<9&&n>0;i++){
  const s=hotbar[i];
  if(s&&s.id===id){const take=Math.min(n,s.count);s.count-=take;n-=take;if(s.count<=0)hotbar[i]=null;}
 }
 for(let i=0;i<backpack.length&&n>0;i++){
  const s=backpack[i];
  if(s&&s.id===id){const take=Math.min(n,s.count);s.count-=take;n-=take;if(s.count<=0){backpack.splice(i,1);i--;}}
 }
 updateHotbarUI();refreshHeld();
}
const hotbarEl=document.getElementById('hotbar');
const slotCanvases=[];

/* ---- 触屏/鼠标统一的"点选拿起/放下 + 长按拆分"模型（替代拖拽） ---- */
let carry=null,carryFrom=null; // carry:{id,count}
let carryEl=null;
function ensureCarryEl(){
 if(carryEl)return;
 carryEl=document.createElement('div');
 carryEl.style.cssText='position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);'
  +'width:54px;height:54px;background:rgba(20,20,20,.85);border:2px solid #ffd83d;border-radius:7px;'
  +'z-index:40;display:none;pointer-events:none;text-align:center;';
 const cv=document.createElement('canvas');cv.width=cv.height=64;cv.style.width=42+'px';cv.style.height=42+'px';
 const cnt=document.createElement('span');cnt.className='cnt';cnt.style.position='absolute';cnt.style.right='2px';cnt.style.bottom='0';
 carryEl.style.position='fixed';
 carryEl.appendChild(cv);carryEl.appendChild(cnt);
 document.body.appendChild(carryEl);
}
function updateCarryUI(){
 ensureCarryEl();
 const cv=carryEl.querySelector('canvas'),cnt=carryEl.querySelector('.cnt');
 const ctx=cv.getContext('2d');ctx.clearRect(0,0,64,64);
 if(carry){drawIcon(ctx,carry.id,64);cnt.textContent=carry.count>1?carry.count:'';carryEl.style.display='block';}
 else{carryEl.style.display='none';cnt.textContent='';}
}
function slotGet(panel,idx){return panel==='bp'?(backpack[idx]||null):(hotbar[idx]||null);}
function slotSet(panel,idx,item){
 if(panel==='bp'){if(item)backpack[idx]=item;else if(idx<backpack.length)backpack[idx]=null;}
 else hotbar[idx]=item||null;
}
function carryPick(panel,idx){
 const it=slotGet(panel,idx);
 if(!it||carry)return;
 carry=it;carryFrom={panel:panel,idx:idx};
 slotSet(panel,idx,null);
 refreshBackpackUI();updateHotbarUI();updateCarryUI();
}
function carryPlace(panel,idx){
 if(!carry)return;
 const old=slotGet(panel,idx);
 slotSet(panel,idx,carry);
 carry=old;
 if(!carry)carryFrom=null;
 refreshBackpackUI();updateHotbarUI();updateCarryUI();
}
function carrySplit(panel,idx){
 if(carry)return;
 const it=slotGet(panel,idx);
 if(!it)return;
 if(it.count<=1){carryPick(panel,idx);return;}
 const half=Math.floor(it.count/2);
 carry={id:it.id,count:half};carryFrom={panel:panel,idx:idx};
 it.count-=half;
 refreshBackpackUI();updateHotbarUI();updateCarryUI();
}
function restoreCarry(){
 if(carry){
  if(carryFrom){
   const p=carryFrom.panel,idx=carryFrom.idx;
   if(p==='bp'&&idx<backpack.length){slotSet(p,idx,carry);carry=null;}
   else if(p==='hb'){slotSet(p,idx,carry);carry=null;}
  }
  if(carry){addItem(carry.id,carry.count);carry=null;}
 }
 carryFrom=null;updateCarryUI();updateHotbarUI();
}
/* 统一的点按手势：短按onTap、长按(~430ms)onLong */
function bindGesture(el,onTap,onLong){
 let held=null,suppress=false;
 const start=function(){if(suppress)return;held=setTimeout(function(){held=null;suppress=true;if(onLong)onLong();},430);};
 const clear=function(){if(held){clearTimeout(held);held=null;}};
 el.addEventListener('pointerdown',start);
 el.addEventListener('pointerup',clear);
 el.addEventListener('pointercancel',clear);
 el.addEventListener('pointerleave',clear);
 el.addEventListener('click',function(){
  if(suppress){suppress=false;return;}
  clear();
  if(onTap)onTap();
 });
 el.addEventListener('contextmenu',function(e){e.preventDefault();});
}
function onHotbarTap(i){
 if(!started)return;
 if(backpackOpen){
  if(carry)carryPlace('hb',i);
  else carryPick('hb',i);
 }else{
  sel=i;updateHotbarUI();refreshHeld();
 }
}
(function(){
 for(let i=0;i<9;i++){
  const d=document.createElement('div');d.className='slot'+(i===0?' sel':'');d.draggable=false;
  const key=document.createElement('span');key.className='key';key.textContent=i+1;
  const cv=document.createElement('canvas');cv.width=cv.height=64;
  const cnt=document.createElement('span');cnt.className='cnt';
  d.appendChild(key);d.appendChild(cv);d.appendChild(cnt);
  bindGesture(d,function(){onHotbarTap(i);},function(){if(backpackOpen)carrySplit('hb',i);});
  hotbarEl.appendChild(d);slotCanvases.push({div:d,cv:cv,cvCtx:cv.getContext('2d'),cnt:cnt});
 }
})();
function updateHotbarUI(){
 for(let i=0;i<9;i++){
  const sc=slotCanvases[i],s=hotbar[i];
  sc.div.classList.toggle('sel',i===sel);
  sc.cvCtx.clearRect(0,0,64,64);
  if(s){drawIcon(sc.cvCtx,s.id,64);sc.cnt.textContent=s.count>1?s.count:'';}
  else sc.cnt.textContent='';
 }
 refreshCraftUI();
}

/* ---------------- 合成(网格) / 熔炉 / 交易 UI ---------------- */
const craftPanel=document.getElementById('craftPanel');
const craftTitleEl=document.getElementById('craftTitle');
const craftGridEl=document.getElementById('craftGrid');
const craftOutEl=document.getElementById('craftOut');
const recipesEl=document.getElementById('recipes');
const furnacePanel=document.getElementById('furnacePanel');
const tradePanel=document.getElementById('tradePanel');
let craftOpen=false,craftMode=2,invSel=-1;
const gridCells=new Array(9).fill(null);
let furnaceOpen=false,furnKey=null;
let tradeOpen=false;
let backpackOpen=false;

function anyPanelOpen(){return craftOpen||furnaceOpen||tradeOpen||mapOpen||backpackOpen;}
function panelClosedCommon(){if(started&&!dead&&!anyPanelOpen())lockPointer();}

/* ---- 通用格子绘制 ---- */
function paintBigSlot(rec,id,cnt,sel){
 rec.el.classList.toggle('sel',!!sel);
 rec.ctx.clearRect(0,0,64,64);
 if(id!=null)drawIcon(rec.ctx,id,64);
 rec.cnt.textContent=cnt>1?cnt:'';
}
function mkBigSlot(el){
 const cv=document.createElement('canvas');cv.width=cv.height=64;
 const cnt=document.createElement('span');cnt.className='cnt';
 el.appendChild(cv);el.appendChild(cnt);
 return{el:el,ctx:cv.getContext('2d'),cnt:cnt};
}

/* ---- 背包行（合成/熔炉面板共用） ---- */
function mkInvRow(el){
 const slots=[];
 for(let i=0;i<9;i++){
  const d=document.createElement('div');d.className='slot';
  const cv=document.createElement('canvas');cv.width=cv.height=64;
  const cnt=document.createElement('span');cnt.className='cnt';
  d.appendChild(cv);d.appendChild(cnt);
  d.addEventListener('click',function(){invSel=(invSel===i)?-1:i;refreshInvRows();refreshFurnaceUI();});
  el.appendChild(d);
  slots.push({d:d,ctx:cv.getContext('2d'),cnt:cnt});
 }
 return{update:function(){
  for(let i=0;i<9;i++){
   const s=hotbar[i],sc=slots[i];
   sc.d.classList.toggle('src',invSel===i);
   sc.ctx.clearRect(0,0,64,64);
   if(s){drawIcon(sc.ctx,s.id,64);sc.cnt.textContent=s.count>1?s.count:'';}
   else sc.cnt.textContent='';
  }
 }};
}
const invRowA=mkInvRow(document.getElementById('invRow'));
const invRowB=mkInvRow(document.getElementById('invRow2'));
function refreshInvRows(){if(invRowA)invRowA.update();if(invRowB)invRowB.update();}

/* ---- 合成网格 ---- */
const craftCellEls=[];
for(let i=0;i<9;i++){
 const el=document.createElement('div');el.className='bigSlot';
 craftGridEl.appendChild(el);
 const rec=mkBigSlot(el);
 el.addEventListener('click',function(){onCellClick(i);});
 craftCellEls.push(rec);
}
const craftOutRec=mkBigSlot(craftOutEl);
craftOutEl.addEventListener('click',craftTake);
function cellActive(i){return craftMode===3||[0,1,3,4].indexOf(i)>=0;}
function consumeSel(){
 const s=hotbar[invSel];
 if(s){s.count--;if(s.count<=0){hotbar[invSel]=null;invSel=-1;}}
 updateHotbarUI();refreshInvRows();
}
function giveBackCell(i){
 const c=gridCells[i];
 if(c){addItem(c.id,c.count);gridCells[i]=null;}
}
function onCellClick(i){
 if(!cellActive(i))return;
 const c=gridCells[i];
 if(invSel>=0&&hotbar[invSel]&&!c){
  gridCells[i]={id:hotbar[invSel].id,count:1};
  consumeSel();
 }else if(c)giveBackCell(i);
 refreshCraftGrid();
}
function currentResult(){
 const W=craftMode;
 const map=craftMode===3?function(r,c){return r*3+c;}:function(r,c){return r===0?c:c+2;};
 const ids=[];
 let minR=9,maxR=-1,minC=9,maxC=-1;
 for(let r=0;r<W;r++)for(let c=0;c<W;c++){
  const cell=gridCells[map(r,c)];
  ids[r*W+c]=cell?cell.id:0;
  if(cell){if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}
 }
 if(maxR<0)return null;
 const h=maxR-minR+1,w=maxC-minC+1;
 for(const rc of CRAFT_SHAPED){
  const sh=rc.shape;
  if(sh.length!==h||sh[0].length!==w)continue;
  let ok=true;
  for(let r2=0;r2<h&&ok;r2++)for(let c2=0;c2<w&&ok;c2++){
   if((sh[r2][c2]||0)!==ids[(minR+r2)*W+(minC+c2)])ok=false;
  }
  if(ok)return rc;
 }
 const cnt={};
 for(let k=0;k<W*W;k++)if(ids[k])cnt[ids[k]]=(cnt[ids[k]]||0)+1;
 for(const rc of CRAFT_SHAPELESS){
  let ok=true;
  for(const pair of rc.ing)if((cnt[pair[0]]||0)<pair[1]){ok=false;break;}
  if(ok)for(const k in cnt){
   if(!rc.ing.some(function(p){return p[0]===+k;})){ok=false;break;}
  }
  if(ok)return rc;
 }
 return null;
}
function craftTake(){
 const r=currentResult();
 if(!r)return;
 if(r.ing){
  for(const pair of r.ing){
   let need=pair[1];
   for(let i=0;i<9&&need>0;i++){
    const c=gridCells[i];
    if(c&&c.id===pair[0]){const take=Math.min(need,c.count);c.count-=take;need-=take;if(c.count<=0)gridCells[i]=null;}
   }
  }
 }else{
  for(let i=0;i<9;i++){
   const c=gridCells[i];
   if(c){c.count--;if(c.count<=0)gridCells[i]=null;}
  }
 }
 addItem(r.out[0],r.out[1]);
 sfxCraft();showMsg('合成了 '+ITEMS[r.out[0]].name+(r.out[1]>1?' ×'+r.out[1]:''));
 refreshCraftGrid();
}
function refreshCraftGrid(){
 for(let i=0;i<9;i++){
  craftCellEls[i].el.style.display=cellActive(i)?'flex':'none';
  paintBigSlot(craftCellEls[i],gridCells[i]?gridCells[i].id:null,gridCells[i]?gridCells[i].count:0,false);
 }
 const r=currentResult();
 paintBigSlot(craftOutRec,r?r.out[0]:null,0,r?true:false);
 craftOutRec.cnt.textContent=r&&r.out[1]>1?'×'+r.out[1]:'';
 refreshInvRows();
}
function openCraft(mode){
 craftMode=mode;craftOpen=true;
 document.exitPointerLock();
 craftTitleEl.textContent=mode===3?'⛏ 合成台 (3×3)':'🎒 随身合成 (2×2)';
 craftGridEl.classList.toggle('w2',mode===2);
 craftPanel.classList.remove('hidden');
 refreshCraftGrid();refreshCraftUI();
}
function closeCraft(){
 for(let i=0;i<9;i++)giveBackCell(i);
 invSel=-1;craftOpen=false;
 craftPanel.classList.add('hidden');
 panelClosedCommon();
}
function nearCraftTable(){
 const px=Math.floor(player.pos.x),py=Math.floor(player.pos.y),pz=Math.floor(player.pos.z);
 for(let dx=-3;dx<=3;dx++)for(let dy=-2;dy<=2;dy++)for(let dz=-3;dz<=3;dz++)
  if(getBlock(px+dx,py+dy,pz+dz)===B.CRAFT_TABLE)return true;
 return false;
}
function toggleCraft(){craftOpen?closeCraft():openCraft(nearCraftTable()?3:2);}

/* ---- 配方参考列表（带快捷合成按钮） ---- */
function refRecipes(){return CRAFT_SHAPED.concat(CRAFT_SHAPELESS);}
function materialsOf(r){
 if(r.ing)return r.ing;
 const m={};
 r.shape.forEach(function(row){row.forEach(function(id){if(id){m[id]=(m[id]||0)+1;}});});
 return Object.keys(m).map(function(k){return[+k,m[k]];});
}
function recipeFits(r,mode){
 if(!r.shape)return true;
 return r.shape.length<=mode&&r.shape[0].length<=mode;
}
const refRows=[];
refRecipes().forEach(function(r){
 const row=document.createElement('div');row.className='recipe';
 const out=document.createElement('div');out.className='out';
 const oc=document.createElement('canvas');oc.width=oc.height=64;
 drawIcon(oc.getContext('2d'),r.out[0],64);
 const oname=document.createElement('span');
 const needTable=r.shape&&(r.shape.length>2||r.shape[0].length>2);
 oname.textContent=ITEMS[r.out[0]].name+' ×'+r.out[1]+(needTable?' ★':'');
 out.appendChild(oc);out.appendChild(oname);
 const ins=document.createElement('div');ins.className='ins';
 const spans=[];
 materialsOf(r).forEach(function(pair){
  const sp=document.createElement('span');
  sp.textContent=ITEMS[pair[0]].name+' ×'+pair[1]+'　';
  ins.appendChild(sp);spans.push({sp:sp,id:pair[0],n:pair[1]});
 });
 const btn=document.createElement('button');btn.textContent='合成';
 btn.addEventListener('click',function(){
  for(const pair of materialsOf(r))if(countOf(pair[0])<pair[1]){showMsg('材料不够');return;}
  for(const pair of materialsOf(r))removeItems(pair[0],pair[1]);
  if(!addItem(r.out[0],r.out[1])){showMsg('背包已满！');return;}
  sfxCraft();showMsg('合成了 '+ITEMS[r.out[0]].name+' ×'+r.out[1]);
  refreshCraftUI();
 });
 row.appendChild(out);row.appendChild(ins);row.appendChild(btn);
 recipesEl.appendChild(row);
 refRows.push({spans:spans,btn:btn,r:r});
});
function refreshCraftUI(){
 refRows.forEach(function(row){
  let ok=true;
  row.spans.forEach(function(s){
   const have=countOf(s.id)>=s.n;
   s.sp.className=have?'have':'lack';
   ok=ok&&have;
  });
  row.btn.disabled=!ok; // 快捷按钮只看材料够不够；网格摆放仍受 2×2/3×3 限制
 });
}

/* ---- 熔炉 ---- */
const furnaces=new Map();
function fkeyOf(x,y,z){return dim+','+x+','+y+','+z;}
function getFurnace(k){
 let f=furnaces.get(k);
 if(!f){f={inId:null,inN:0,fuelId:null,fuelN:0,outId:null,outN:0,burn:0,prog:0};furnaces.set(k,f);}
 return f;
}
function tickFurnaces(dt){
 furnaces.forEach(function(f){
  if(f.burn>0)f.burn-=dt;
  const res=f.inId!=null?SMELT[f.inId]:undefined;
  const canSmelt=res!==undefined&&f.inN>0&&(!f.outId||(f.outId===res&&f.outN<64));
  if(f.burn<=0&&canSmelt&&f.fuelId!=null&&f.fuelN>0&&FUEL[f.fuelId]){
   f.burn+=FUEL[f.fuelId];f.fuelN--;
   if(f.fuelN<=0)f.fuelId=null;
  }
  if(f.burn>0&&canSmelt){
   f.prog+=dt;
   if(f.prog>=2.5){f.prog=0;f.inN--;if(f.inN<=0)f.inId=null;f.outId=res;f.outN++;}
  }else f.prog=Math.max(0,f.prog-dt*2);
 });
}
const fInRec=mkBigSlot(document.getElementById('fIn'));
const fOutRec=mkBigSlot(document.getElementById('fOut'));
const fFuelEl=document.getElementById('fFlame');
const fProgEl=document.getElementById('fProg');
const fMidEl=document.getElementById('fMid');
fInRec.el.addEventListener('click',function(){
 const f=getFurnace(furnKey);
 if(invSel>=0&&hotbar[invSel]){
  const id=hotbar[invSel].id;
  if(SMELT[id]===undefined){showMsg('这个无法熔炼');return;}
  if(f.inId&&f.inId!==id){showMsg('先取出原来的原料');return;}
  f.inId=id;f.inN++;consumeSel();
 }else if(f.inN>0){addItem(f.inId,f.inN);f.inId=null;f.inN=0;}
 refreshFurnaceUI();
});
fMidEl.addEventListener('click',function(){
 const f=getFurnace(furnKey);
 if(invSel>=0&&hotbar[invSel]){
  const id=hotbar[invSel].id;
  if(!FUEL[id]){showMsg('它不能当燃料（煤/原木/木板）');return;}
  if(f.fuelId&&f.fuelId!==id){showMsg('先取出原来的燃料');return;}
  f.fuelId=id;f.fuelN++;consumeSel();
 }else if(f.fuelN>0){addItem(f.fuelId,f.fuelN);f.fuelId=null;f.fuelN=0;}
 refreshFurnaceUI();
});
fOutRec.el.addEventListener('click',function(){
 const f=getFurnace(furnKey);
 if(f.outN>0){addItem(f.outId,f.outN);f.outId=null;f.outN=0;}
 refreshFurnaceUI();
});
function refreshFurnaceUI(){
 if(!furnaceOpen||!furnKey)return;
 const f=getFurnace(furnKey);
 paintBigSlot(fInRec,f.inN>0?f.inId:null,f.inN,false);
 paintBigSlot(fOutRec,f.outN>0?f.outId:null,f.outN,false);
 fFuelEl.classList.toggle('on',f.burn>0);
 fFuelEl.style.opacity=f.fuelN>0||f.burn>0?'1':'0.35';
 fProgEl.style.width=Math.min(100,f.prog/2.5*100)+'%';
 refreshInvRows();
}
function openFurnace(hit){
 furnKey=fkeyOf(hit.x,hit.y,hit.z);
 getFurnace(furnKey);
 furnaceOpen=true;
 document.exitPointerLock();
 furnacePanel.classList.remove('hidden');
 refreshFurnaceUI();
}
function closeFurnace(){
 furnaceOpen=false;furnKey=null;
 furnacePanel.classList.add('hidden');
 panelClosedCommon();
}

/* ---- 村民交易 ---- */
const tradeRows=[];
TRADES.forEach(function(t){
 const row=document.createElement('div');row.className='recipe';
 const give=document.createElement('div');give.className='give';
 t.give.forEach(function(pair){
  const cv=document.createElement('canvas');cv.width=cv.height=64;
  drawIcon(cv.getContext('2d'),pair[0],64);
  const sp=document.createElement('span');
  sp.textContent=ITEMS[pair[0]].name+' ×'+pair[1];
  give.appendChild(cv);give.appendChild(sp);
 });
 const arrow=document.createElement('span');arrow.className='arrow';arrow.textContent='⇄';
 const getEl=document.createElement('div');getEl.className='get';
 const cv2=document.createElement('canvas');cv2.width=cv2.height=64;
 drawIcon(cv2.getContext('2d'),t.get[0],64);
 const sp2=document.createElement('span');sp2.textContent=ITEMS[t.get[0]].name+' ×'+t.get[1];
 getEl.appendChild(cv2);getEl.appendChild(sp2);
 const btn=document.createElement('button');btn.textContent='交易';
 btn.addEventListener('click',function(){
  for(const pair of t.give)if(countOf(pair[0])<pair[1]){showMsg('材料不够');return;}
  for(const pair of t.give)removeItems(pair[0],pair[1]);
  if(!addItem(t.get[0],t.get[1])){showMsg('背包已满！');return;}
  sfxPop();showMsg('交易成功：'+ITEMS[t.get[0]].name+' ×'+t.get[1]);
  refreshTradeUI();
 });
 row.appendChild(give);row.appendChild(arrow);row.appendChild(getEl);row.appendChild(btn);
 document.getElementById('tradeList').appendChild(row);
 tradeRows.push({t:t,btn:btn});
});
function refreshTradeUI(){
 document.getElementById('emCnt').textContent='（你的绿宝石：'+countOf(I.EMERALD)+'）';
 tradeRows.forEach(function(r){
  let ok=true;
  for(const pair of r.t.give)if(countOf(pair[0])<pair[1])ok=false;
  r.btn.disabled=!ok;
 });
}
function openTrade(){
 tradeOpen=true;
 document.exitPointerLock();
 tradePanel.classList.remove('hidden');
 refreshTradeUI();
}
function closeTrade(){
 tradeOpen=false;
 tradePanel.classList.add('hidden');
 panelClosedCommon();
}

/* ---- M 键地图（地形 + 生物标记） ---- */
const mapPanel=document.getElementById('mapPanel');
const mapCv=document.getElementById('mapCv');
const mapCtx=mapCv.getContext('2d');
let mapOpen=false,mapRenderT=0;
const MAP_COLORS={};
MAP_COLORS[B.GRASS]='#58a63e';MAP_COLORS[B.DIRT]='#8b6244';MAP_COLORS[B.STONE]='#8f8f8f';
MAP_COLORS[B.SAND]='#dbd3a0';MAP_COLORS[B.LOG]='#5c4024';MAP_COLORS[B.LEAVES]='#356b1f';
MAP_COLORS[B.WATER]='#3b62d9';MAP_COLORS[B.COAL_ORE]='#565656';MAP_COLORS[B.IRON_ORE]='#c9a184';
MAP_COLORS[B.DIAMOND_ORE]='#4fe3df';MAP_COLORS[B.BEDROCK]='#222222';MAP_COLORS[B.PLANKS]='#a8834f';
MAP_COLORS[B.COBBLE]='#7a7a7a';MAP_COLORS[B.GLASS]='#cfe8f0';MAP_COLORS[B.TORCH]='#ffcc55';
MAP_COLORS[B.OBSIDIAN]='#241533';MAP_COLORS[B.TNT]='#d04030';MAP_COLORS[B.GLOWSTONE]='#ffd966';
MAP_COLORS[B.NETHERRACK]='#6e3533';MAP_COLORS[B.QUARTZ_ORE]='#efe6d8';MAP_COLORS[B.LAVA]='#ff6a00';
MAP_COLORS[B.PORTAL]='#9b4dd6';MAP_COLORS[B.CRAFT_TABLE]='#a8834f';MAP_COLORS[B.FURNACE]='#8a8a8a';
MAP_COLORS[B.BED]='#c02020';MAP_COLORS[B.EMERALD_ORE]='#2ecc40';MAP_COLORS[B.WOOL]='#e8e8e8';
MAP_COLORS[B.CHEST]='#c9a23a';MAP_COLORS[B.PISTON]='#c9773a';MAP_COLORS[B.FORCE_ORE]='#7af0e0';
MAP_COLORS[B.GOLD_ORE]='#f5d94a';
const MOB_MAP_COLORS={pig:'#f0a0a0',sheep:'#efefef',villager:'#c9a077',zombie:'#4f9e4f',skeleton:'#e8e8e8',creeper:'#3f8f3f',pigman:'#efc0c0',cow:'#a05a36',chicken:'#e3e3e3'};
const mapChunkCache=new Map();
function mapChunkImg(cx,cz){
 const k=ckey(cx,cz);
 if(mapCacheDirty.has(k)){mapChunkCache.delete(k);mapCacheDirty.delete(k);}
 let c=mapChunkCache.get(k);
 if(c)return c;
 c=document.createElement('canvas');c.width=c.height=16;
 const g=c.getContext('2d');
 const d=cdata[dim].get(k);
 if(d){
  for(let lz=0;lz<16;lz++)for(let lx=0;lx<16;lx++){
   let col='#111';
   for(let y=WY-1;y>=0;y--){
    const id=d[lx+lz*16+y*256];
    if(id!==B.AIR&&id!==B.TORCH){col=MAP_COLORS[id]||'#999';break;}
   }
   g.fillStyle=col;g.fillRect(lx,lz,1,1);
  }
 }else{
  g.fillStyle='#0d1410';g.fillRect(0,0,16,16); // 未探索
 }
 mapChunkCache.set(k,c);
 return c;
}
function renderMap(){
 const W=mapCv.width,W2=W/2,ppb=3;
 const px=player.pos.x,pz=player.pos.z;
 mapCtx.fillStyle='#0a0f0c';
 mapCtx.fillRect(0,0,W,W);
 const half=W/2/ppb;
 const cx0=Math.floor((px-half)/16),cx1=Math.floor((px+half)/16);
 const cz0=Math.floor((pz-half)/16),cz1=Math.floor((pz+half)/16);
 for(let cx=cx0;cx<=cx1;cx++)for(let cz=cz0;cz<=cz1;cz++){
  mapCtx.drawImage(mapChunkImg(cx,cz),(cx*16-px)*ppb+W2,(cz*16-pz)*ppb+W2,16*ppb,16*ppb);
 }
 mapCtx.fillStyle='#b06ef2';
 for(const a of portalAnchors[dim]){
  mapCtx.fillRect((a.x-px)*ppb+W2-4,(a.z-pz)*ppb+W2-4,8,8);
 }
 if(dim==='over'){
  mapCtx.font='16px serif';mapCtx.textAlign='center';mapCtx.textBaseline='middle';
  mapCtx.fillText('🏠',(village.x-px)*ppb+W2,(village.z-pz)*ppb+W2);
 }
 for(const m of mobs){
  mapCtx.fillStyle=MOB_MAP_COLORS[m.type]||'#fff';
  mapCtx.beginPath();
  mapCtx.arc((m.pos.x-px)*ppb+W2,(m.pos.z-pz)*ppb+W2,4,0,7);
  mapCtx.fill();
 }
 mapCtx.fillStyle='#ffd83d';
 for(const d of drops){
  mapCtx.fillRect((d.x-px)*ppb+W2-1.5,(d.z-pz)*ppb+W2-1.5,3,3);
 }
 const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw);
 mapCtx.save();
 mapCtx.translate(W2,W2);
 mapCtx.rotate(Math.atan2(fz,fx));
 mapCtx.fillStyle='#ffffff';
 mapCtx.beginPath();mapCtx.moveTo(10,0);mapCtx.lineTo(-6,6);mapCtx.lineTo(-6,-6);mapCtx.closePath();mapCtx.fill();
 mapCtx.restore();
 document.getElementById('mapDim').textContent=dim==='over'?'（主世界 · 深色=未探索）':'（下界）';
}
function toggleMap(){
 mapOpen=!mapOpen;
 mapPanel.classList.toggle('hidden',!mapOpen);
 if(mapOpen){document.exitPointerLock();renderMap();}
 else panelClosedCommon();
}
(function buildMapLegend(){
 const el=document.getElementById('mapLegend');
 const items=[['#ffffff','你'],['#c9a077','村民'],['#f0a0a0','猪'],['#efefef','羊'],['#4f9e4f','僵尸'],
  ['#e8e8e8','骷髅'],['#3f8f3f','苦力怕'],['#efc0c0','猪灵(下界)'],['#b06ef2','传送门'],
  ['#ffd83d','掉落物'],['#58a63e','草地'],['#3b62d9','水'],['#ff6a00','岩浆'],['#0d1410','未探索']];
 items.forEach(function(it){
  const sp=document.createElement('span');sp.className='mi';
  const dot=document.createElement('i');dot.className='dot';dot.style.background=it[0];
  const t=document.createElement('span');t.textContent=it[1];
  sp.appendChild(dot);sp.appendChild(t);el.appendChild(sp);
 });
})();
updateHotbarUI();

/* ---------------- 背包UI ---------------- */
const backpackPanel=document.getElementById('backpackPanel');
const bpGridEl=document.getElementById('bpGrid');
const bpCountEl=document.getElementById('bpCount');
const bpSlots=[];

function refreshBackpackUI(){
 bpGridEl.innerHTML='';
 bpSlots.length=0;
 for(let i=0;i<backpack.length;i++){
  const s=backpack[i];
  if(!s)continue;
  const d=document.createElement('div');d.className='bpSlot';d.draggable=false;
  const cv=document.createElement('canvas');cv.width=cv.height=64;
  const cnt=document.createElement('span');cnt.className='cnt';
  d.appendChild(cv);d.appendChild(cnt);
  const ctx=cv.getContext('2d');
  drawIcon(ctx,s.id,64);
  cnt.textContent=s.count>1?s.count:'';
  // 点选拿起/放下；长按拆分（替代拖拽）
  bindGesture(d,
   function(){if(carry)carryPlace('bp',i);else carryPick('bp',i);},
   function(){carrySplit('bp',i);});
  bpGridEl.appendChild(d);
  bpSlots.push({d:d,cv:cv,ctx:ctx,cnt:cnt,index:i});
 }
 bpCountEl.textContent=`${backpack.length} 格物品`;
}
// 背包/快捷栏物品移动已统一为"点选拿起/放下 + 长按拆分"（见 bindGesture）,不再使用 HTML5 拖拽
function closeBackpack(){
 backpackOpen=false;
 backpackPanel.classList.add('hidden');
 restoreCarry();
 panelClosedCommon();
}
function sortBackpack(){
 // 同类堆叠合并（非可堆叠的武器/镐单独保留）
 for(let i=backpack.length-1;i>=0;i--){
  const s=backpack[i];
  if(!s||s.count<=0){backpack.splice(i,1);continue;}
  const stackable=ITEMS[s.id]&&ITEMS[s.id].kind!=='sword'&&ITEMS[s.id].kind!=='pick';
  if(!stackable)continue;
  for(let j=0;j<i;j++){
   const t=backpack[j];
   if(t&&t.id===s.id&&t.count<64){
    const add=Math.min(s.count,64-t.count);t.count+=add;s.count-=add;
    if(s.count<=0){backpack.splice(i,1);break;}
   }
  }
 }
 // 前移非空格子，保持顺序
 const packed=backpack.filter(function(s){return !!s;});
 backpack.length=0;Array.prototype.push.apply(backpack,packed);
 refreshBackpackUI();
 showMsg('背包已整理');
}
document.getElementById('bpSort').addEventListener('click',function(){sortBackpack();});
function toggleBackpack(){
 if(craftOpen)closeCraft();
 if(furnaceOpen)closeFurnace();
 if(tradeOpen)closeTrade();
 if(mapOpen)toggleMap();
 backpackOpen=!backpackOpen;
 backpackPanel.classList.toggle('hidden',!backpackOpen);
 if(backpackOpen){
  document.exitPointerLock();
  refreshBackpackUI();
 }else{
  closeBackpack();
 }
}
document.getElementById('bpClose').addEventListener('click',function(){closeBackpack();});

/* ---------------- 玩家 ---------------- */
const player={
 pos:spawn.clone(),
 vx:0,vy:0,vz:0,
 yaw:Math.PI*0.25,pitch:-0.1,
 half:0.3,height:1.8,
 onGround:false,
 hp:20,
 lastHurt:-99,
 regenT:0,atkCd:0,placeCd:0,
 landVy:0,hitWall:false
};
let started=false,dead=false,locked=false;
let shakeT=0;
let portalT=0,portalCd=0,lavaT=0,forceT=0,teleCd=0;

function entityCollides(pos,half,height){
 for(let bx=Math.floor(pos.x-half);bx<=Math.floor(pos.x+half);bx++)
 for(let by=Math.floor(pos.y);by<=Math.floor(pos.y+height-0.01);by++)
 for(let bz=Math.floor(pos.z-half);bz<=Math.floor(pos.z+half);bz++)
  if(isSolid(getBlock(bx,by,bz)))return true;
 return false;
}
function tryMove(e,dx,dy,dz){
 const steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz))/0.2)||1;
 const sx=dx/steps,sy=dy/steps,sz=dz/steps;
 e.hitWall=false;
 for(let i=0;i<steps;i++){
  e.pos.x+=sx;
  if(entityCollides(e.pos,e.half,e.height)){e.pos.x-=sx;e.hitWall=true;}
  e.pos.z+=sz;
  if(entityCollides(e.pos,e.half,e.height)){e.pos.z-=sz;e.hitWall=true;}
  e.pos.y+=sy;
  if(entityCollides(e.pos,e.half,e.height)){
   e.pos.y-=sy;
   if(sy<0){e.onGround=true;e.landVy=e.vy;}
   e.vy=0;
  }else if(sy!==0)e.onGround=false;
 }
}
function damagePlayer(n){
 if(dead||!started)return;
 player.hp=Math.max(0,player.hp-n);
 player.lastHurt=gameTime;
 renderHearts();
 vigEl.style.opacity=0.85;
 setTimeout(function(){vigEl.style.opacity=0;},160);
 sfxHurt();
 shakeT=0.35;
 if(player.hp<=0)doDeath();
}
function doDeath(){
 dead=true;
 document.exitPointerLock();
 document.getElementById('deathScr').classList.remove('hidden');
 burst(player.pos.x,player.pos.y+1,player.pos.z,0xcc2222,30,4,0.16,0.9);
}
function respawn(){
 if(dim!=='over'){
  clearAllMobs();clearArrows();clearTnts();clearDrops();
  disposeAllChunks();
  dim='over';
  setEnv('over');
  portalCd=3;portalT=0;
 }
 player.pos.copy(spawn);player.vx=player.vy=player.vz=0;
 buildChunksAround(spawn.x,spawn.z);
 player.hp=20;renderHearts();
 dead=false;
 document.getElementById('deathScr').classList.add('hidden');
 lockPointer();
 mobs.slice().forEach(function(m){if(m.type!=='pig'&&m.type!=='sheep'&&m.type!=='villager'&&m.type!=='cow'&&m.type!=='chicken')m.remove();});
}

/* ---------------- 输入 ---------------- */
const keys={};
let mouseL=false,mouseR=false;
document.addEventListener('keydown',function(e){
 keys[e.code]=true;
 if(e.code==='Space')e.preventDefault();
 if(!started)return;
 if(e.code==='KeyE'){
  if(mapOpen)toggleMap();
  else if(tradeOpen)closeTrade();
  else if(furnaceOpen)closeFurnace();
  else toggleCraft();
 }
 if(e.code==='KeyM')toggleMap();
 if(e.code==='KeyB'){if(backpackOpen)closeBackpack();else toggleBackpack();}
 if(e.code==='KeyR')teleportUp();
 if(e.code==='Escape'&&anyPanelOpen()){
  if(craftOpen)closeCraft();
  if(furnaceOpen)closeFurnace();
  if(tradeOpen)closeTrade();
  if(mapOpen)toggleMap();
  if(backpackOpen)closeBackpack();
 }
 if(/^Digit[1-9]$/.test(e.code)){sel=+e.code.slice(5)-1;updateHotbarUI();refreshHeld();}
});
document.addEventListener('keyup',function(e){keys[e.code]=false;});
window.addEventListener('blur',function(){for(const k in keys)keys[k]=false;mouseL=false;mouseR=false;touchMove.x=0;touchMove.y=0;});
document.addEventListener('contextmenu',function(e){e.preventDefault();});
document.addEventListener('mousedown',function(e){
 if(IS_MOBILE)return;
 if(!started||!locked||dead||anyPanelOpen())return;
 if(e.button===0){mouseL=true;swing();}
 if(e.button===2){
  const vh=pickMob(3.5);
  if(vh&&vh.m.type==='villager'){openTrade();return;}
  mouseR=true;useItem();
 }
});
document.addEventListener('mouseup',function(e){
 if(e.button===0)mouseL=false;
 if(e.button===2){mouseR=false;placeRepeat=0;}
});
document.addEventListener('wheel',function(e){
 if(!started||!locked)return;
 sel=(sel+(e.deltaY>0?1:-1)+9)%9;
 updateHotbarUI();refreshHeld();
},{passive:true});
document.addEventListener('mousemove',function(e){
 if(!locked)return;
 player.yaw-=e.movementX*0.0024;
 player.pitch=clamp(player.pitch-e.movementY*0.0024,-1.55,1.55);
});
function lockPointer(){if(IS_MOBILE)return;renderer.domElement.requestPointerLock();}
document.addEventListener('pointerlockchange',function(){
 locked=document.pointerLockElement===renderer.domElement;
 if(!locked&&started&&!dead&&!anyPanelOpen())document.getElementById('pauseScr').classList.remove('hidden');
 if(locked)document.getElementById('pauseScr').classList.add('hidden');
});
document.getElementById('resumeBtn').addEventListener('click',function(){
 document.getElementById('pauseScr').classList.add('hidden');
 lockPointer();
});
renderer.domElement.addEventListener('click',function(){
 if(!IS_MOBILE&&started&&!dead&&!anyPanelOpen()&&!locked)lockPointer();
});

/* ---------------- 移动端触控（摇杆 + 视角拖动 + 按钮） ---------------- */
const touchMove={x:0,y:0};
function inputActive(){return IS_MOBILE||locked;}
if(IS_MOBILE){
 document.body.classList.add('mobile');
 (function setupTouch(){
  // 虚拟摇杆
  const pad=document.getElementById('joyPad');
  const knob=document.getElementById('joyKnob');
  const R=44;
  let jid=null,jcx=0,jcy=0;
  function joyMove(cx,cy){
   let dx=cx-jcx,dy=cy-jcy;
   const d=Math.hypot(dx,dy);
   if(d>R){dx=dx/d*R;dy=dy/d*R;}
   knob.style.transform='translate('+dx+'px,'+dy+'px)';
   touchMove.x=dx/R;touchMove.y=dy/R;
  }
  pad.addEventListener('touchstart',function(e){
   e.preventDefault();
   const t=e.changedTouches[0];
   jid=t.identifier;
   const r=pad.getBoundingClientRect();
   jcx=r.left+r.width/2;jcy=r.top+r.height/2;
   joyMove(t.clientX,t.clientY);
  },{passive:false});
  pad.addEventListener('touchmove',function(e){
   e.preventDefault();
   for(const t of e.changedTouches)if(t.identifier===jid)joyMove(t.clientX,t.clientY);
  },{passive:false});
  const joyEnd=function(e){
   e.preventDefault();
   for(const t of e.changedTouches)if(t.identifier===jid){
    jid=null;touchMove.x=0;touchMove.y=0;
    knob.style.transform='translate(0px,0px)';
   }
  };
  pad.addEventListener('touchend',joyEnd,{passive:false});
  pad.addEventListener('touchcancel',joyEnd,{passive:false});
  // 视角：单指拖动画面旋转
  const cv=renderer.domElement;
  let lid=null,lx=0,ly=0;
  cv.addEventListener('touchstart',function(e){
   e.preventDefault();
   if(lid===null){const t=e.changedTouches[0];lid=t.identifier;lx=t.clientX;ly=t.clientY;}
  },{passive:false});
  cv.addEventListener('touchmove',function(e){
   e.preventDefault();
   for(const t of e.changedTouches)if(t.identifier===lid){
    player.yaw-=(t.clientX-lx)*0.006;
    player.pitch=clamp(player.pitch-(t.clientY-ly)*0.006,-1.55,1.55);
    lx=t.clientX;ly=t.clientY;
   }
  },{passive:false});
  const lookEnd=function(e){for(const t of e.changedTouches)if(t.identifier===lid)lid=null;};
  cv.addEventListener('touchend',lookEnd);
  cv.addEventListener('touchcancel',lookEnd);
  // 动作按钮
  function bindBtn(id,down,up){
   const el=document.getElementById(id);
   el.addEventListener('touchstart',function(e){e.preventDefault();down();},{passive:false});
   el.addEventListener('touchend',function(e){e.preventDefault();if(up)up();},{passive:false});
   el.addEventListener('touchcancel',function(e){e.preventDefault();if(up)up();},{passive:false});
  }
  bindBtn('btnMine',function(){mouseL=true;swing();},function(){mouseL=false;});
  bindBtn('btnUse',function(){
   const vh=pickMob(3.5);
   if(vh&&vh.m.type==='villager'){openTrade();return;}
   mouseR=true;placeRepeat=0;
  },function(){mouseR=false;placeRepeat=0;});
  bindBtn('btnJump',function(){keys.Space=true;},function(){keys.Space=false;});
  bindBtn('btnCraft',function(){if(mapOpen)toggleMap();else if(tradeOpen)closeTrade();else if(furnaceOpen)closeFurnace();else toggleCraft();},null);
  bindBtn('btnBackpack',function(){if(backpackOpen)closeBackpack();else toggleBackpack();},null);
  bindBtn('btnMap',function(){toggleMap();},null);
  bindBtn('btnTele',function(){teleportUp();},null);
  bindBtn('btnPause',function(){document.getElementById('pauseScr').classList.remove('hidden');},null);
 })();
}

/* ---------------- 高亮框 / 手持物品 ---------------- */
const highlight=new THREE.LineSegments(
 new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002,1.002,1.002)),
 new THREE.LineBasicMaterial({color:0x111111})
);
highlight.visible=false;scene.add(highlight);

const heldGroup=new THREE.Group();
camera.add(heldGroup);
heldGroup.position.set(0.42,-0.42,-0.7);
let heldId=-999,swingT=0;
const tileTexCache={};
function tileTexture(tile){
 if(tileTexCache[tile])return tileTexCache[tile];
 const c=document.createElement('canvas');c.width=c.height=TS;
 c.getContext('2d').drawImage(atlasCanvas,(tile%ACOLS)*TS,Math.floor(tile/ACOLS)*TS,TS,TS,0,0,TS,TS);
 const t=new THREE.CanvasTexture(c);
 t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;
 tileTexCache[tile]=t;return t;
}
function refreshHeld(){
 const s=hotbar[sel];
 const id=s?s.id:-1;
 if(id===heldId)return;
 heldId=id;
 while(heldGroup.children.length)heldGroup.remove(heldGroup.children[0]);
 if(id<0){
  const arm=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.4,0.12),new THREE.MeshLambertMaterial({color:0xe0ac69}));
  arm.rotation.set(0.4,0,0.2);
  heldGroup.add(arm);
 }else if(ITEMS[id].kind==='block'){
  const cube=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.3),new THREE.MeshLambertMaterial({map:tileTexture(BLOCKS[id].tiles[2])}));
  cube.rotation.y=Math.PI/5;
  heldGroup.add(cube);
 }else{
  const tex=new THREE.CanvasTexture(iconCanvas(id));
  tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.45,0.45),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}));
  pl.rotation.set(-0.2,Math.PI+0.4,0.15);
  heldGroup.add(pl);
 }
}
refreshHeld();
function swing(){swingT=1;}

/* ---------------- 挖掘 / 放置 / 进食 / 攻击 ---------------- */
let mineState=null;
let placeRepeat=0;
function camDir(){return camera.getWorldDirection(new THREE.Vector3());}
function dmgOf(slot){const base=slot?((ITEMS[slot.id].dmg)||1):1;const sharp=slot&&slot.ench&&slot.ench.sharp?1.5*slot.ench.sharp:0;return (base+sharp)*(forceT>0?2:1);}
function isPick(slot){return slot&&ITEMS[slot.id].kind==='pick';}
function pickMob(maxDist){
 const dir=camDir(),org=camera.position;
 let best=null;
 for(const m of mobs){
  const c=m.pos.clone();c.y+=m.height/2;
  const toC=c.sub(org);
  const t=toC.dot(dir);
  if(t<0.3||t>maxDist)continue;
  const perp=toC.sub(dir.clone().multiplyScalar(t)).length();
  if(perp<m.radius&&(!best||t<best.t))best={m:m,t:t};
 }
 return best;
}
/* 触屏准星磁吸：放宽命中角度，就近吸附最近的怪 */
function pickMobMagnetic(maxDist){
 const dir=camDir(),org=camera.position;
 let best=null;
 for(const m of mobs){
  const c=m.pos.clone();c.y+=m.height/2;
  const toC=c.sub(org);
  const t=toC.dot(dir);
  if(t<0.3||t>maxDist)continue;
  const perp=toC.sub(dir.clone().multiplyScalar(t)).length();
  if(perp<m.radius*2.6&&(!best||t<best.t))best={m:m,t:t};
 }
 return best;
}
/* 触屏磁吸：准星没命中时，在小锥角内采样几条射线，取最近的非空气方块 */
function magneticBlock(maxDist){
 const base=camDir(),org=camera.position;
 let best=raycastVoxel(org,base,maxDist);
 const right=new THREE.Vector3().crossVectors(base,camera.up).normalize();
 const upC=new THREE.Vector3().crossVectors(right,base).normalize();
 const step=0.06;
 for(let sy=-1;sy<=1;sy++)for(let sx=-1;sx<=1;sx++){
  if(sx===0&&sy===0)continue;
  const d=base.clone().addScaledVector(right,sx*step).addScaledVector(upC,sy*step).normalize();
  const h=raycastVoxel(org,d,maxDist);
  if(h&&(!best||h.dist<best.dist))best=h;
 }
 return best;
}
/* ---- 宝箱战利品 ---- */
const openedChests=new Set();
const CHEST_LOOT=[
 [I.COAL,2,4],[I.IRON_INGOT,1,3],[I.EMERALD,1,2],[I.APPLE,2,3],[I.COOKED_PORKCHOP,1,2],
 [I.GUNPOWDER,1,3],[I.GOLD_INGOT,1,2],[I.ARROW,3,6],[I.DIAMOND,1,1]
];
function openChest(hit){
 const key=dim+','+hit.x+','+hit.y+','+hit.z;
 if(openedChests.has(key)){showMsg('宝箱是空的……');return;}
 openedChests.add(key);
 const count=2+((Math.random()*3)|0);
 const got=[];
 for(let k=0;k<count;k++){
  const e=CHEST_LOOT[(Math.random()*CHEST_LOOT.length)|0];
  if(e[0]===I.DIAMOND&&Math.random()<0.7)continue;
  const n=e[1]+((Math.random()*(e[2]-e[1]+1))|0);
  spawnDrop(hit.x+0.5,hit.y+0.7,hit.z+0.5,e[0],n);
  got.push(ITEMS[e[0]].name+'×'+n);
 }
 burst(hit.x+0.5,hit.y+0.9,hit.z+0.5,0xffd83d,22,3,0.12,0.7);
 sfxCraft();sfxPop();
 showMsg('🎁 宝箱！获得：'+(got.length?got.join('、'):'灰尘……'),true);
}
/* ---- 伤害数字 ---- */
function showDamage(n){
 const el=document.createElement('div');
 el.textContent='-'+n;
 el.style.cssText='position:fixed;left:50%;top:44%;transform:translate(-50%,-50%) translate(0,0);'
  +'color:#ff5544;font:bold 20px monospace;text-shadow:0 0 4px #000,1px 1px 0 #300;'
  +'pointer-events:none;z-index:8;opacity:1;transition:transform .6s ease-out,opacity .6s';
 document.body.appendChild(el);
 requestAnimationFrame(function(){
  el.style.transform='translate(-50%,-50%) translate('+(Math.random()*40-20)+'px,-70px)';
  el.style.opacity='0';
 });
 setTimeout(function(){el.remove();},650);
}
/* ---- R 键复位：挖太深回不去时，一键回到地表 ---- */
function teleportUp(){
 if(!started||dead)return;
 if(teleCd>0){showMsg('复位冷却中 '+Math.ceil(teleCd)+' 秒');return;}
 const tx=Math.floor(player.pos.x),tz=Math.floor(player.pos.z);
 let ty=-1;
 if(dim==='nether'){
  for(let y=24;y>9;y--){
   if(getBlock(tx,y-1,tz)!==B.BEDROCK&&isSolid(getBlock(tx,y-1,tz))&&
      getBlock(tx,y,tz)===B.AIR&&getBlock(tx,y+1,tz)===B.AIR){ty=y;break;}
  }
  if(ty<0){
   const anchors=portalAnchors.nether;
   if(anchors.length){const a=anchors[anchors.length-1];player.pos.set(a.x+1,a.y+0.1,a.z+0.5);}
   else{player.pos.set(tx+0.5,14,tz+0.5);setBlockRaw(tx,13,tz,B.NETHERRACK);}
  }
 }else{
  ty=surfaceY(tx,tz);
  if(ty<1||ty>WY-2)ty=colH(tx,tz)+1;
  if(ty<1||ty>WY-2){player.pos.copy(spawn);showMsg('复位：回到出生点');}
  else player.pos.set(tx+0.5,ty+0.1,tz+0.5);
 }
 if(ty>=0||dim==='nether')showMsg('⬆ 复位：已回到地表');
 player.vx=player.vy=player.vz=0;
 buildChunksAround(player.pos.x,player.pos.z);
 burst(player.pos.x,player.pos.y+1,player.pos.z,0x7ec850,24,3,0.14,0.8);
 sfxPop();
 teleCd=3;
}
function trySleep(){
 if(dim!=='over'){showMsg('下界无法入睡……');return;}
 if(!isNightNow()){showMsg('只能在夜晚睡觉');return;}
 dayT=0.02;
 spawn.set(player.pos.x,surfaceY(Math.floor(player.pos.x),Math.floor(player.pos.z))+0.2,player.pos.z);
 if(spawn.y<=0)spawn.copy(player.pos);
 player.hp=Math.min(20,player.hp+2);renderHearts();
 sfxSleep();showMsg('你睡了一觉，天亮了～ 出生点已设置');
}
/* ---- 活塞：右键向点击面方向推动方块链（最多8个） ---- */
function pushPiston(hit){
 const dx=hit.nx,dy=hit.ny,dz=hit.nz;
 let bx=hit.x+dx,by=hit.y+dy,bz=hit.z+dz;
 const chain=[];
 let ok=true;
 for(let i=0;i<8;i++){
  const id=getBlock(bx,by,bz);
  if(id===B.AIR||id===B.WATER||id===B.LAVA)break;
  if(id===B.BEDROCK||id===B.OBSIDIAN||id===B.PORTAL||id===B.PISTON){ok=false;break;}
  chain.push([bx,by,bz,id]);
  bx+=dx;by+=dy;bz+=dz;
 }
 if(!ok){tone(90,0.15,'square',0.15,-30);showMsg('推不动……');return;}
 if(chain.length===0){showMsg('活塞前面没有方块');return;}
 const tgt=getBlock(bx,by,bz);
 if(tgt!==B.AIR&&tgt!==B.WATER&&tgt!==B.LAVA){showMsg('前面被堵住了');return;}
 for(let i=chain.length-1;i>=0;i--){
  const c=chain[i];
  setBlockRaw(c[0]+dx,c[1]+dy,c[2]+dz,c[3]);
  setBlockRaw(c[0],c[1],c[2],B.AIR);
 }
 sfxPlace();
 burst(hit.x+0.5+dx,hit.y+0.5+dy,hit.z+0.5+dz,0xcccccc,10,2,0.1,0.5);
 showMsg('活塞推动！');
}
function shootBow(){
 if(player.placeCd>0)return;
 if(countOf(I.ARROW)<1){showMsg('没有箭了！');return;}
 player.placeCd=0.5;
 removeItems(I.ARROW,1);
 const dir=camDir();
 shootArrow(camera.position.clone().addScaledVector(dir,0.4),dir,true);
 swing();
}
function useItem(){
 const hit=raycastVoxel(camera.position,camDir(),5);
 if(hit){
  if(hit.b===B.CRAFT_TABLE){openCraft(3);return;}
  if(hit.b===B.FURNACE){openFurnace(hit);return;}
  if(hit.b===B.BED){trySleep();return;}
  if(hit.b===B.CHEST){openChest(hit);return;}
  if(hit.b===B.PISTON){pushPiston(hit);return;}
  if(hit.b===B.ENCHANT_TABLE){openEnchant();return;}
  const held=hotbar[sel];
  if(hit.b===B.TNT&&held&&held.id===I.FLINT_STEEL){igniteTNT(hit);return;}
  if(held&&held.id===I.FLINT_STEEL){
   const ax=hit.x+hit.nx,ay=hit.y+hit.ny,az=hit.z+hit.nz;
   if(getBlock(ax,ay,az)===B.AIR){
    if(!tryIgnitePortal(ax,ay,az))showMsg('打火石嗒的一声……（对着黑曜石门框内部点火）');
   }
   return;
  }
 }
 const s=hotbar[sel];
 if(!s)return;
 const def=ITEMS[s.id];
 if(def.kind==='bow'){shootBow();return;}
 if(def.kind==='rod'){tryFish();return;}
 if(s.id===I.SEEDS){tryPlant();return;}
 if(def.kind==='food'){
  if(player.hp>=20&&s.id!==I.FORCE_APPLE){showMsg('生命值已满');return;}
  player.hp=Math.min(20,player.hp+def.heal);
  if(s.id===I.FORCE_APPLE){forceT=90;showMsg('⚡ 原力加持！攻击伤害翻倍 90 秒');}
  renderHearts();sfxEat();
  s.count--;if(s.count<=0)hotbar[sel]=null;
  updateHotbarUI();refreshHeld();
 }else if(def.kind==='block'){
  placeBlock();
 }
}
function placeBlock(){
 const hit=raycastVoxel(camera.position,camDir(),5);
 if(!hit)return;
 const px=hit.x+hit.nx,py=hit.y+hit.ny,pz=hit.z+hit.nz;
 if(py<0||py>=WY)return;
 const cur=getBlock(px,py,pz);
 if(cur!==B.AIR&&cur!==B.WATER)return;
 // 不能放在自己/怪物身上
 const box={x:px,y:py,z:pz};
 function overlaps(e){
  return px+1>e.pos.x-e.half&&px<e.pos.x+e.half&&py+1>e.pos.y&&py<e.pos.y+e.height&&pz+1>e.pos.z-e.half&&pz<e.pos.z+e.half;
 }
 if(overlaps(player))return;
 for(const m of mobs)if(overlaps(m))return;
 const s=hotbar[sel];
 if((s.id===B.TORCH||s.id===B.BED)&&!isSolid(getBlock(px,py-1,pz))){showMsg('需要放在固体方块上面');return;}
 setBlockRaw(px,py,pz,s.id);
 s.count--;if(s.count<=0)hotbar[sel]=null;
 updateHotbarUI();refreshHeld();
 sfxPlace();swing();
}
function breakBlock(hit){
 const def=BLOCKS[hit.b];
 if(def.minPow&&!isPick(hotbar[sel])){
  showMsg(def.name+' 需要更强的镐！');return;
 }
 setBlockRaw(hit.x,hit.y,hit.z,B.AIR);
 burst(hit.x+0.5,hit.y+0.5,hit.z+0.5,def.pcolor,16,3,0.13,0.6);
 sfxBreak();
 if(hit.b===B.FURNACE){
  const f=furnaces.get(fkeyOf(hit.x,hit.y,hit.z));
  if(f){
   if(f.inN>0)addItem(f.inId,f.inN);
   if(f.fuelN>0)addItem(f.fuelId,f.fuelN);
   if(f.outN>0)addItem(f.outId,f.outN);
   furnaces.delete(fkeyOf(hit.x,hit.y,hit.z));
  }
 }
 let drop=def.drop;
 if(hit.b===B.LEAVES&&Math.random()<0.08)drop={id:I.APPLE,n:1};
 if(hit.b===B.WHEAT_3){ // 收割成熟小麦：掉小麦+种子
  spawnDrop(hit.x+0.5,hit.y+0.3,hit.z+0.5,I.WHEAT,1);
  spawnDrop(hit.x+0.5,hit.y+0.5,hit.z+0.5,I.SEEDS,1+((Math.random()*2)|0));
  drop=null;
 }
 if(drop)spawnDrop(hit.x+0.5,hit.y+0.3,hit.z+0.5,drop.id,drop.n);
}

/* ---------------- 农业（种植/生长） ---------------- */
function tryPlant(){
 const hit=raycastVoxel(camera.position,camDir(),5);
 if(!hit)return;
 const px=hit.x+hit.nx,py=hit.y+hit.ny,pz=hit.z+hit.nz;
 if(py<0||py>=WY)return;
 const below=getBlock(hit.x,hit.y,hit.z);
 const above=getBlock(px,py,pz);
 if(above!==B.AIR||(below!==B.DIRT&&below!==B.GRASS&&below!==B.FARMLAND)){
  showMsg('请对着泥土 / 草地 / 耕地播种');return;
 }
 setBlockRaw(hit.x,hit.y,hit.z,B.FARMLAND);
 setBlockRaw(px,py,pz,B.WHEAT_1);
 const s=hotbar[sel];
 if(s)s.count--;if(s&&s.count<=0)hotbar[sel]=null;
 updateHotbarUI();refreshHeld();
 sfxPlace();swing();
 showMsg('🌱 种下了小麦种子');
}
let cropTickAcc=0;
function tickCrops(dt){
 cropTickAcc+=dt;
 if(cropTickAcc<1.1)return;
 cropTickAcc=0;
 const dist=(cx,cz)=>Math.abs(cx*CHUNK-player.pos.x)+Math.abs(cz*CHUNK-player.pos.z);
 cdata[dim].forEach(function(d,k){
  const parts=k.split(','),cx=+parts[0],cz=+parts[1];
  if(dist(cx,cz)>52)return;
  for(let i=0;i<d.length;i++){
   const b=d[i];
   let ny;
   if(b===B.WHEAT_1)ny=B.WHEAT_2;
   else if(b===B.WHEAT_2)ny=B.WHEAT_3;
   else continue;
   if(Math.random()<0.12){d[i]=ny;markDirty(cx*CHUNK+((i&15)),(i>>4)&15===0?0:0);}
  }
 });
}
// 简化表达式：上方函数里 markDirty 参数传错会越界，改用下方精确写法对象避免误标
function tickCrops2(dt){
 cropTickAcc+=dt;if(cropTickAcc<1.0)return;cropTickAcc=0;
 const cx0=(Math.floor(player.pos.x)>>4),cz0=(Math.floor(player.pos.z)>>4);
 for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++){
  const cx=cx0+dx,cz=cz0+dz,k=ckey(cx,cz);
  const d=cdata[dim].get(k);if(!d)continue;
  for(let lz=0;lz<CHUNK;lz++)for(let lx=0;lx<CHUNK;lx++){
   for(let y=0;y<WY;y++){
    const b=d[idx(lx,y,lz)];
    let ny=0;
    if(b===B.WHEAT_1)ny=B.WHEAT_2;
    else if(b===B.WHEAT_2)ny=B.WHEAT_3;
    else continue;
    if(Math.random()<0.12){d[idx(lx,y,lz)]=ny;markDirty(cx*CHUNK+lx,cz*CHUNK+lz);}
   }
  }
 }
}
function tickCrops(dt){tickCrops2(dt);}

/* ---------------- 钓鱼 ---------------- */
const fishing={active:false,caught:false,t:0,phase:0,x:0,y:0,z:0};
let bobberMesh=null;
function getBobber(){
 if(!bobberMesh){
  const mat=new THREE.MeshLambertMaterial({color:0xe87c3a});
  bobberMesh=new THREE.Mesh(new THREE.SphereGeometry(0.09,8,8),mat);
  scene.add(bobberMesh);bobberMesh.visible=false;
 }
 return bobberMesh;
}
function tryFish(){
 if(fishing.active){
  if(fishing.caught){addItem(I.RAW_FISH,1);fishing.caught=false;showMsg('🐟 钓到一条鱼！');}
  else showMsg('没钓到，再试试');
  fishing.active=false;getBobber().visible=false;
  swing();return;
 }
 const hit=raycastVoxel(camera.position,camDir(),10);
 if(!hit||hit.b!==B.WATER){showMsg('请对准水面甩出鱼竿');return;}
 const sx=hit.x+0.5,sz=hit.z+0.5;
 let sy=hit.y;
 while(getBlock(Math.floor(sx),sy,Math.floor(sz))===B.WATER&&sy<WY-1)sy++;
 fishing.active=true;fishing.phase=0;fishing.t=0;fishing.caught=false;
 fishing.x=sx;fishing.z=sz;fishing.y=sy-1+0.45;
 const b=getBobber();b.position.set(sx,sy-1+0.45,sz);b.visible=true;
 showMsg('🎣 垂钓中…等待上钩');
 swing();
}
function updateFishing(dt){
 if(!fishing.active)return;
 fishing.t+=dt;
 if(fishing.phase===0&&fishing.t>2.5+Math.random()*2.5){
  fishing.phase=1;fishing.caught=true;
  showMsg('🔔 上钩了！再按右键收起');
 }
}

/* ---------------- 附魔台 ---------------- */
let enchantOpen=false;
const enchPanelEl=document.getElementById('enchantPanel');
function heldEnchSlot(){return hotbar[sel];}
function openEnchant(){
 enchantOpen=true;document.exitPointerLock();
 enchPanelEl.classList.remove('hidden');
 refreshEnchantUI();
}
function closeEnchant(){enchantOpen=false;enchPanelEl.classList.add('hidden');panelClosedCommon();}
function refreshEnchantUI(){
 const slot=heldEnchSlot();
 const toolEl=document.getElementById('encTool');
 const optEl=document.getElementById('encOpts');
 toolEl.innerHTML='';
 if(slot&&(ITEMS[slot.id].kind==='pick'||ITEMS[slot.id].kind==='sword')){
  const cv=document.createElement('canvas');cv.width=cv.height=64;
  const c=document.createElement('span');c.style.font='bold 12px monospace';c.style.marginLeft='8px';c.style.color='#fff';
  c.textContent=ITEMS[slot.id].name+(slot.ench&&(slot.ench.eff||slot.ench.sharp)?(slot.ench.eff?' [效率'+slot.ench.eff+'] ':'')+(slot.ench.sharp?' [锋利'+slot.ench.sharp+'] ':''):'');
  drawIcon(cv.getContext('2d'),slot.id,64);
  toolEl.appendChild(cv);toolEl.appendChild(c);
  toolEl.style.display='flex';
 }else{
  toolEl.textContent='请手持剑或镐 ⚔⛏';
  toolEl.style.display='block';
 }
 optEl.innerHTML='';
 const isSword=slot&&ITEMS[slot.id].kind==='sword';
 const isPick2=slot&&ITEMS[slot.id].kind==='pick';
 function mkBtn(label,cost,on,can){
  const b=document.createElement('button');b.style.cssText='margin:4px;padding:8px 14px;cursor:pointer;background:#6d8f4f;border:2px solid #4a6434;color:#fff;border-radius:3px';
  b.textContent=label+'（'+cost+' 绿宝石）';
  if(!can){b.style.opacity='0.4';b.style.cursor='not-allowed';}
  b.addEventListener('click',function(){if(can)on();});
  optEl.appendChild(b);
 }
 mkBtn('⚔ 锋利 +1',2,function(){doEnchant('sharp');},isSword);
 mkBtn('⛏ 效率 +1',2,function(){doEnchant('eff');},isPick2);
}
function doEnchant(kind){
 const slot=heldEnchSlot();
 if(!slot||!(ITEMS[slot.id].kind==='pick'||ITEMS[slot.id].kind==='sword')){showMsg('请先手持剑或镐');return;}
 if(kind==='sharp'&&ITEMS[slot.id].kind!=='sword'){showMsg('只有剑可以附锋利');return;}
 if(kind==='eff'&&ITEMS[slot.id].kind!=='pick'){showMsg('只有镐可以附效率');return;}
 const key=kind==='eff'?'eff':'sharp';
 const cur=slot.ench&&slot.ench[key]||0;
 if(cur>=3){showMsg('该附魔已满级（3级）');return;}
 if(countOf(I.EMERALD)<2){showMsg('需要 2 颗绿宝石');return;}
 removeItems(I.EMERALD,2);
 if(!slot.ench)slot.ench={};
 slot.ench[key]=cur+1;
 sfxPlace();
 refreshEnchantUI();refreshHeld();updateHotbarUI();
 showMsg('✨ 附魔成功！'+(key==='eff'?'效率 '+slot.ench.eff:'锋利 '+slot.ench.sharp));
}
function toggleEnchant(){enchantOpen?closeEnchant():openEnchant();}

function explode(x,y,z,r){
 sfxBoom();
 shakeT=0.8;
 burst(x,y,z,0x555555,50,9,0.22,1.2,6);
 burst(x,y,z,0xff8830,30,7,0.2,0.8,4);
 for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)for(let dz=-r;dz<=r;dz++){
  const dist=Math.sqrt(dx*dx+dy*dy+dz*dz);
  if(dist>r*(0.75+Math.random()*0.35))continue;
  const bx=x+dx,by=y+dy,bz=z+dz;
  const id=getBlock(bx,by,bz);
  if(id===B.AIR||id===B.WATER||id===B.BEDROCK||id===B.OBSIDIAN||id===B.PORTAL)continue;
  if(id===B.TNT){setBlockRaw(bx,by,bz,B.AIR);spawnTNT(bx+0.5,by,bz+0.5,0.3+Math.random()*0.5);continue;}
  setBlockRaw(bx,by,bz,B.AIR);
 }
 const pd=player.pos.clone().add(new THREE.Vector3(0,0.9,0)).sub(new THREE.Vector3(x,y,z)).length();
 if(pd<r+2.5){
  damagePlayer(Math.round(16*(1-pd/(r+2.5))));
  const kb=player.pos.clone().sub(new THREE.Vector3(x,y,z)).normalize().multiplyScalar(9);
  player.vx+=kb.x;player.vy+=4;player.vz+=kb.z;
 }
 for(const m of mobs){
  const md=m.pos.distanceTo(new THREE.Vector3(x,y,z));
  if(md<r+2)m.damage(Math.round(16*(1-md/(r+2))),m.pos.clone().sub(new THREE.Vector3(x,y,z)).normalize());
 }
}

/* ---------------- TNT / 箭矢 实体 ---------------- */
const tnts=[];
function spawnTNT(x,y,z,fuse){
 const mat=new THREE.MeshLambertMaterial({color:0xd04030});
 const m=new THREE.Mesh(new THREE.BoxGeometry(0.98,0.98,0.98),mat);
 m.position.set(x,y+0.49,z);scene.add(m);
 tnts.push({x:x,y:y,z:z,m:m,mat:mat,t:fuse});
}
function igniteTNT(hit){
 setBlockRaw(hit.x,hit.y,hit.z,B.AIR);
 spawnTNT(hit.x+0.5,hit.y,hit.z+0.5,2);
 sfxFuse();showMsg('💣 TNT 已点燃，快跑！');
}
function updateTnts(dt){
 for(let i=tnts.length-1;i>=0;i--){
  const t=tnts[i];
  t.t-=dt;
  const flash=Math.sin(t.t*18)>0;
  t.mat.emissive.setHex(flash?0xffffff:0x000000);
  const sc=1+Math.max(0,0.5-t.t)*0.6;
  t.m.scale.set(sc,sc,sc);
  if(t.t<=0){
   scene.remove(t.m);t.m.geometry.dispose();t.mat.dispose();
   tnts.splice(i,1);
   explode(Math.floor(t.x),Math.floor(t.y),Math.floor(t.z),4);
  }
 }
}
function clearTnts(){tnts.forEach(function(t){scene.remove(t.m);t.m.geometry.dispose();t.mat.dispose();});tnts.length=0;}

const arrows=[];
function shootArrow(from,dir,byPlayer){
 const geo=new THREE.BoxGeometry(0.07,0.07,0.55);
 const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:0xb9a37e}));
 m.position.copy(from);scene.add(m);
 arrows.push({p:from.clone(),v:dir.clone().multiplyScalar(19),m:m,life:4,by:byPlayer?'player':'mob'});
 sfxArrow();
}
const _al=new THREE.Vector3();
function updateArrows(dt){
 for(let i=arrows.length-1;i>=0;i--){
  const a=arrows[i];
  a.life-=dt;
  a.v.y-=8*dt;
  a.p.addScaledVector(a.v,dt);
  a.m.position.copy(a.p);
  a.m.lookAt(_al.copy(a.p).add(a.v));
  let dead=a.life<=0;
  if(!dead&&isSolid(getBlock(a.p.x,a.p.y,a.p.z))){burst(a.p.x,a.p.y,a.p.z,0xb9a37e,4,1,0.08,0.3);dead=true;}
  if(!dead&&a.by==='player'){
   for(const mo of mobs){
    const cx=mo.pos.x-a.p.x,cy=(mo.pos.y+mo.height*0.5)-a.p.y,cz=mo.pos.z-a.p.z;
    const rr=mo.radius+0.25;
    if(cx*cx+cy*cy+cz*cz<rr*rr){
     mo.damage(forceT>0?12:6,a.v.clone().setY(0).normalize());
     showDamage(forceT>0?12:6);
     dead=true;break;
    }
   }
  }
  if(!dead&&a.by==='mob'){
   const px=player.pos.x-a.p.x,py=player.pos.y+0.9-a.p.y,pz=player.pos.z-a.p.z;
   if(px*px+py*py+pz*pz<0.42){
    damagePlayer(3);
    const kb=a.v.clone().setY(0).normalize().multiplyScalar(5);
    player.vx+=kb.x;player.vz+=kb.z;player.vy+=2;
    dead=true;
   }
  }
  if(dead){scene.remove(a.m);a.m.geometry.dispose();a.m.material.dispose();arrows.splice(i,1);}
 }
}
function clearArrows(){arrows.forEach(function(a){scene.remove(a.m);a.m.geometry.dispose();a.m.material.dispose();});arrows.length=0;}

/* ---------------- 掉落物实体（磁吸拾取） ---------------- */
const drops=[];
const dropMatCache={};
function dropMat(id){
 if(!dropMatCache[id]){
  let mat;
  if(ITEMS[id]&&ITEMS[id].kind==='block')mat=new THREE.MeshLambertMaterial({map:tileTexture(BLOCKS[id].tiles[2])});
  else{
   const tex=new THREE.CanvasTexture(iconCanvas(id));
   tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
   mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide});
  }
  dropMatCache[id]=mat;
 }
 return dropMatCache[id];
}
function spawnDrop(x,y,z,id,n){
 let m;
 if(ITEMS[id].kind==='block')m=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.3),dropMat(id));
 else m=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.42),dropMat(id));
 m.position.set(x,y,z);scene.add(m);
 drops.push({id:id,n:n,m:m,x:x,y:y,z:z,
  vx:(Math.random()-0.5)*2.2,vy:2.6+Math.random()*1.2,vz:(Math.random()-0.5)*2.2,age:0});
}
function updateDrops(dt){
 for(let i=drops.length-1;i>=0;i--){
  const d=drops[i];
  d.age+=dt;
  if(d.age>90){scene.remove(d.m);d.m.geometry.dispose();drops.splice(i,1);continue;}
  d.vy-=18*dt;
  d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;
  if(d.vy<0&&isSolid(getBlock(d.x,d.y-0.12,d.z))){
   d.y=Math.floor(d.y-0.12)+1.12;
   d.vy=0;d.vx*=0.55;d.vz*=0.55;
  }
  const px=player.pos.x-d.x,py=player.pos.y+0.8-d.y,pz=player.pos.z-d.z;
  const dist=Math.sqrt(px*px+py*py+pz*pz);
  if(started&&!dead&&dist<2.4){
   const pull=Math.min(1,7*dt/Math.max(dist,0.3));
   d.x+=px*pull;d.y+=py*pull;d.z+=pz*pull;
   if(dist<0.8){
    if(addItem(d.id,d.n)){
     sfxPop();
     showMsg('+ '+ITEMS[d.id].name+(d.n>1?' ×'+d.n:''));
     scene.remove(d.m);d.m.geometry.dispose();drops.splice(i,1);
    }
    continue;
   }
  }
  d.m.position.set(d.x,d.y+Math.sin(d.age*3)*0.05,d.z);
  d.m.rotation.y=d.age*2.2;
 }
}
function clearDrops(){drops.forEach(function(d){scene.remove(d.m);d.m.geometry.dispose();});drops.length=0;}

/* ---------------- 怪物 ---------------- */
const mobs=[];
function mkBox(w,h,d,color,x,y,z){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:color}));
 m.position.set(x,y,z);return m;
}
class Mob{
 constructor(type,x,y,z){
  this.type=type;
  this.group=new THREE.Group();
  this.legs=[];
  this.mats=[];
  this.wanderT=0;this.wanderDir=Math.random()*Math.PI*2;
  this.attackCd=0;this.fuse=-1;this.burnAcc=0;this.flameAcc=0;
  this.flashT=0;this.kx=0;this.kz=0;this.animPhase=0;
  const self=this;
  function add(m){self.group.add(m);self.mats.push(m.material);return m;}
  if(type==='pig'){
   this.hp=10;this.speed=1.2;this.radius=0.8;this.half=0.35;this.height=0.85;
   const body=add(mkBox(0.6,0.45,0.95,0xeda3a3,0,0.53,0));
   add(mkBox(0.45,0.45,0.45,0xf0abab,0,0.62,0.62));
   add(mkBox(0.22,0.14,0.08,0xd97b7b,0,0.55,0.87));
   [[-0.18,0.32],[0.18,0.32],[-0.18,-0.32],[0.18,-0.32]].forEach(function(p,i){
    const leg=add(mkBox(0.18,0.32,0.18,0xdd9090,p[0],0.17,p[1]));
    leg.geometry.translate(0,-0.16,0);leg.position.y=0.33;
    self.legs.push({m:leg,s:i%2?1:-1});
   });
  }else if(type==='zombie'){
   this.hp=20;this.speed=1.9;this.radius=0.7;this.half=0.3;this.height=1.9;
   const skin=0x4f9e4f,cloth=0x3b6ea5;
   add(mkBox(0.5,0.7,0.26,cloth,0,1.05,0));           // 身体
   add(mkBox(0.48,0.48,0.48,skin,0,1.64,0));          // 头
   const la=add(mkBox(0.2,0.66,0.2,skin,-0.34,1.32,0));la.geometry.translate(0,-0.26,0);la.rotation.x=-Math.PI/2;
   const ra=add(mkBox(0.2,0.66,0.2,skin,0.34,1.32,0));ra.geometry.translate(0,-0.26,0);ra.rotation.x=-Math.PI/2;
   [[-0.13],[0.13]].forEach(function(p,i){
    const leg=add(mkBox(0.22,0.7,0.22,0x2a4a73,p[0],0.7,0));
    leg.geometry.translate(0,-0.35,0);
    self.legs.push({m:leg,s:i?1:-1});
   });
  }else if(type==='sheep'){
   this.hp=8;this.speed=1.0;this.radius=0.8;this.half=0.4;this.height=1.15;
   add(mkBox(0.75,0.65,1.05,0xe6e6e6,0,0.78,0));
   add(mkBox(0.42,0.42,0.4,0xd9cbb8,0,0.98,0.66));
   [[-0.2,0.35],[0.2,0.35],[-0.2,-0.35],[0.2,-0.35]].forEach(function(p,i){
    const leg=add(mkBox(0.16,0.45,0.16,0xcfcfcf,p[0],0.24,p[1]));
    leg.geometry.translate(0,-0.22,0);
    self.legs.push({m:leg,s:i%2?1:-1});
   });
  }else if(type==='cow'){
   this.hp=15;this.speed=1.1;this.radius=0.85;this.half=0.4;this.height=1.25;
   this.wanderDir=Math.random()*Math.PI*2;
   add(mkBox(0.72,0.6,1.15,0xa05a36,0,0.72,0));
   add(mkBox(0.34,0.42,0.4,0xa05a36,0,1.1,0.62));   // 头
   add(mkBox(0.22,0.28,0.18,0xf4e0ca,0,1.1,0.82));  // 口鼻
   add(mkBox(0.1,0.08,0.05,0xd9c9a8,0,1.3,-0.2));   // 角
   [[-0.2,0.34],[0.2,0.34],[-0.2,-0.34],[0.2,-0.34]].forEach(function(p,i){
    const leg=add(mkBox(0.18,0.5,0.18,0x8a4a2a,p[0],0.38,p[1]));
    leg.geometry.translate(0,-0.25,0);
    self.legs.push({m:leg,s:i%2?1:-1});
   });
  }else if(type==='chicken'){
   this.hp=4;this.speed=1.5;this.radius=0.55;this.half=0.25;this.height=0.7;
   this.wanderDir=Math.random()*Math.PI*2;
   add(mkBox(0.4,0.42,0.5,0xe3e3e3,0,0.42,0));
   add(mkBox(0.22,0.28,0.26,0xe3e3e3,0,0.5,0.42));
   add(mkBox(0.08,0.12,0.08,0xe0a020,0,0.5,0.55));  // 嘴
   add(mkBox(0.12,0.14,0.1,0xd94040,0,0.35,-0.28)); // 冠
   [[-0.13],[0.13],[0,-0.05]].forEach(function(p,i){
    const leg=add(mkBox(0.07,0.18,0.07,0xe0a020,p[0],0.18,p[1]||0));
    leg.geometry.translate(0,-0.09,0);
    self.legs.push({m:leg,s:i%2?1:-1});
   });
  }else if(type==='skeleton'){
   this.hp=16;this.speed=1.7;this.radius=0.7;this.half=0.3;this.height=1.9;
   add(mkBox(0.4,0.72,0.22,0xbfbfbf,0,1.05,0));
   add(mkBox(0.46,0.46,0.46,0xd8d8d8,0,1.64,0));
   const sla=add(mkBox(0.13,0.6,0.13,0xd8d8d8,-0.28,1.3,0));sla.geometry.translate(0,-0.24,0);sla.rotation.x=-Math.PI/2.2;
   const sra=add(mkBox(0.13,0.6,0.13,0xd8d8d8,0.28,1.3,0));sra.geometry.translate(0,-0.24,0);sra.rotation.x=-Math.PI/2.2;
   add(mkBox(0.05,0.5,0.1,0x6b4a24,0.3,1.26,0.5));
   [[-0.11],[0.11]].forEach(function(p,i){
    const leg=add(mkBox(0.14,0.7,0.14,0xcfcfcf,p[0],0.7,0));
    leg.geometry.translate(0,-0.35,0);
    self.legs.push({m:leg,s:i?1:-1});
   });
  }else if(type==='pigman'){
   this.hp=22;this.speed=2.0;this.radius=0.7;this.half=0.3;this.height=1.9;
   const skin=0xefa3a3;
   add(mkBox(0.5,0.7,0.26,0x3f6d8f,0,1.05,0));
   add(mkBox(0.48,0.48,0.48,skin,0,1.64,0));
   const pla=add(mkBox(0.2,0.66,0.2,skin,-0.34,1.32,0));pla.geometry.translate(0,-0.26,0);pla.rotation.x=-Math.PI/2;
   const pra=add(mkBox(0.2,0.66,0.2,skin,0.34,1.32,0));pra.geometry.translate(0,-0.26,0);pra.rotation.x=-Math.PI/2;
   [[-0.13],[0.13]].forEach(function(p,i){
    const leg=add(mkBox(0.22,0.7,0.22,0x4a3f7a,p[0],0.7,0));
    leg.geometry.translate(0,-0.35,0);
    self.legs.push({m:leg,s:i?1:-1});
   });
  }else if(type==='villager'){
   this.hp=20;this.speed=1.0;this.radius=0.7;this.half=0.3;this.height=1.9;
   add(mkBox(0.52,0.9,0.34,0x7a5b35,0,0.98,0));
   add(mkBox(0.44,0.5,0.44,0xc9a077,0,1.68,0));
   add(mkBox(0.1,0.18,0.1,0xb98d63,0,1.62,0.26));
   add(mkBox(0.56,0.16,0.2,0x6b4a2b,0,1.18,0.2));
   [[-0.12],[0.12]].forEach(function(p,i){
    const leg=add(mkBox(0.18,0.55,0.18,0x4a3826,p[0],0.55,0));
    leg.geometry.translate(0,-0.27,0);
    self.legs.push({m:leg,s:i?1:-1});
   });
  }else{ // creeper
   this.hp=20;this.speed=2.6;this.radius=0.65;this.half=0.28;this.height=1.7;
   add(mkBox(0.44,0.85,0.3,0x4fae4f,0,0.78,0));
   add(mkBox(0.5,0.5,0.5,0x59bb59,0,1.45,0));
   [[-0.14,0.14],[0.14,0.14],[-0.14,-0.14],[0.14,-0.14]].forEach(function(p,i){
    const leg=add(mkBox(0.2,0.36,0.2,0x439a43,p[0],0.36,p[1]));
    leg.geometry.translate(0,-0.18,0);
    self.legs.push({m:leg,s:i%2?1:-1});
   });
  }
  this.pos=new THREE.Vector3(x,y,z);
  this.vy=0;this.onGround=false;this.landVy=0;this.hitWall=false;
  scene.add(this.group);
 }
 flash(hex){
  const self=this;
  this.mats.forEach(function(m){if(m.emissive)m.emissive.setHex(hex);});
  this.flashT=0.12;
 }
 damage(n,kdir){
  this.hp-=n;
  this.flash(0xaa0000);
  sfxHit();
  if(kdir){this.kx+=kdir.x*6;this.kz+=kdir.z*6;}
  if(this.type==='pig'||this.type==='sheep'||this.type==='villager'||this.type==='cow'||this.type==='chicken'){
   this.wanderDir=Math.atan2(this.pos.x-player.pos.x,this.pos.z-player.pos.z);
   this.wanderT=2;
  }
  if(this.hp<=0)this.die();
 }
 die(){
  burst(this.pos.x,this.pos.y+this.height/2,this.pos.z,0xcc4444,20,3.5,0.15,0.7);
  let drop=null,n=1;
  if(this.type==='pig'){drop=I.PORKCHOP;n=1+((Math.random()*2)|0);}
  else if(this.type==='zombie'){drop=I.ROTTEN_FLESH;n=((Math.random()*2)|0)+1;}
  else if(this.type==='sheep'){
   drop=B.WOOL;n=1+((Math.random()*2)|0);
   if(Math.random()<0.9)addItem(I.MUTTON,1);
  }
  else if(this.type==='cow'){
   drop=I.RAW_BEEF;n=1+((Math.random()*2)|0);
   if(Math.random()<0.8)spawnDrop(this.pos.x+0.3,this.pos.y+0.6,this.pos.z,I.LEATHER,1);
  }
  else if(this.type==='chicken'){
   drop=I.RAW_CHICKEN;n=1;
   if(Math.random()<0.9)spawnDrop(this.pos.x+0.3,this.pos.y+0.5,this.pos.z,I.FEATHER,Math.random()<0.3?2:1);
  }
  else if(this.type==='skeleton'){drop=I.BONE;n=1+((Math.random()*2)|0);}
  else if(this.type==='pigman'){
   drop=I.GOLD_INGOT;n=1+((Math.random()*2)|0); // 必掉 1-2 金锭
   if(Math.random()<0.3)spawnDrop(this.pos.x+0.3,this.pos.y+0.6,this.pos.z,I.ROTTEN_FLESH,1);
  }
  else if(this.type==='villager'){drop=null;n=0;}
  else{drop=I.GUNPOWDER;n=1+((Math.random()*2)|0);}
  if(drop)spawnDrop(this.pos.x,this.pos.y+this.height*0.5,this.pos.z,drop,n);
  if(this.type==='sheep'&&Math.random()<0.9)spawnDrop(this.pos.x+0.3,this.pos.y+0.5,this.pos.z,I.MUTTON,1);
  sfxPop();
  this.remove();
 }
 remove(){
  scene.remove(this.group);
  const i=mobs.indexOf(this);
  if(i>=0)mobs.splice(i,1);
 }
 exposedToSky(){
  const x=Math.floor(this.pos.x),z=Math.floor(this.pos.z);
  for(let y=Math.ceil(this.pos.y+this.height);y<WY;y++)if(isSolid(getBlock(x,y,z)))return false;
  return true;
 }
 update(dt,isNight){
  this.attackCd-=dt;
  if(this.flashT>0){this.flashT-=dt;if(this.flashT<=0)this.mats.forEach(function(m){if(m.emissive)m.emissive.setHex(0);});}
  // AI
  const dp=this.pos.distanceTo(player.pos);
  let mvx=0,mvz=0,moving=false;
  const hostile=this.type==='zombie'||this.type==='creeper'||this.type==='pigman'||this.type==='skeleton';
  if(hostile&&dp<18&&dp>0.1&&!dead){
   const dx=(player.pos.x-this.pos.x)/dp,dz=(player.pos.z-this.pos.z)/dp;
   if(this.type==='skeleton'){
    moving=dp>7;
    mvx=dx*this.speed*(moving?1:0);mvz=dz*this.speed*(moving?1:0);
    if(this.attackCd<=0){
     this.attackCd=2.1;
     const from=this.pos.clone();from.y+=1.6;
     const aim=new THREE.Vector3(player.pos.x-this.pos.x,player.pos.y+1.2-(this.pos.y+1.6),player.pos.z-this.pos.z);
     const dist=aim.length();
     aim.normalize();aim.y+=dist*0.018;aim.normalize();
     shootArrow(from,aim);
    }
   }else{
    mvx=dx*this.speed;mvz=dz*this.speed;moving=true;
    if((this.type==='zombie'||this.type==='pigman')&&dp<1.6&&this.attackCd<=0){
     this.attackCd=1.2;
     damagePlayer(this.type==='pigman'?4:3);
     const kb=new THREE.Vector3(dx,0,dz).multiplyScalar(6);
     player.vx+=kb.x;player.vz+=kb.z;player.vy+=2.5;
    }
    if(this.type==='creeper'){
     if(dp<3){this.fuse=this.fuse<0?0:this.fuse+dt;moving=dp>1.2;}
     else if(this.fuse>=0&&dp>5)this.fuse=-1;
     if(this.fuse>=0){
      this.mats.forEach(function(m){if(m.emissive)m.emissive.setHex(Math.sin(this.fuse*25)>0?0xffffff:0);},this);
      if(this.fuse>=1.4){
       explode(Math.round(this.pos.x),Math.round(this.pos.y+0.8),Math.round(this.pos.z),3);
       this.remove();return;
      }
     }
    }
   }
  }else{
   this.wanderT-=dt;
   if(this.wanderT<=0){this.wanderT=2+Math.random()*3;this.wanderDir=Math.random()*Math.PI*2;this.wanderPause=Math.random()<0.4;}
   if(this.type==='villager'&&dim==='over'){
    const dvx=village.x-this.pos.x,dvz=village.z-this.pos.z;
    if(dvx*dvx+dvz*dvz>400){this.wanderDir=Math.atan2(dvx,dvz);this.wanderPause=false;this.wanderT=2;}
   }
   if(!this.wanderPause){
    mvx=Math.sin(this.wanderDir)*this.speed*0.6;
    mvz=Math.cos(this.wanderDir)*this.speed*0.6;
    moving=true;
   }
  }
  // 岩浆灼烧
  if(getBlock(this.pos.x,this.pos.y+0.3,this.pos.z)===B.LAVA){
   this.lavaAcc=(this.lavaAcc||0)+dt;
   if(this.lavaAcc>0.5){this.lavaAcc=0;this.damage(3,null);}
  }
  // 僵尸/骷髅白天燃烧
  if((this.type==='zombie'||this.type==='skeleton')&&!isNight&&this.exposedToSky()&&dim==='over'){
   this.burnAcc+=dt;this.flameAcc+=dt;
   if(this.flameAcc>0.18){this.flameAcc=0;burst(this.pos.x,this.pos.y+1.4+Math.random()*0.5,this.pos.z,0xff7722,3,1,0.12,0.4,-2);}
   if(this.burnAcc>=1){this.burnAcc=0;this.damage(2,null);}
  }
  // 物理
  this.vy-=(isMobInWater(this)?8:24)*dt;
  if(isMobInWater(this))this.vy=Math.max(this.vy,-2);
  this.kx*=Math.pow(0.05,dt);this.kz*=Math.pow(0.05,dt);
  tryMove(this,mvx*dt+this.kx*dt,0,mvz*dt+this.kz*dt);
  if(this.hitWall&&this.onGround)this.vy=8;
  tryMove(this,0,this.vy*dt,0);
  // 动画
  this.animPhase+=(moving?dt*7:0);
  for(const l of this.legs)l.m.rotation.x=Math.sin(this.animPhase)*0.55*l.s*(moving?1:0);
  this.group.position.copy(this.pos);
  const face=Math.atan2(mvx,mvz);
  if(moving)this.group.rotation.y=face;
  // 掉出世界
  if(this.pos.y<-10)this.remove();
 }
}
function isMobInWater(m){return getBlock(m.pos.x,m.pos.y+0.3,m.pos.z)===B.WATER;}
function countType(t){let n=0;for(const m of mobs)if(m.type===t)n++;return n;}
function clearAllMobs(){mobs.slice().forEach(function(m){m.remove();});}
function ringSpawn(type){
 const ang=Math.random()*Math.PI*2,d=18+Math.random()*14;
 const sx=Math.round(player.pos.x+Math.cos(ang)*d);
 const sz=Math.round(player.pos.z+Math.sin(ang)*d);
 const sy=surfaceY(sx,sz);
 if(sy<1)return;
 const ground=getBlock(sx,sy-1,sz);
 if(ground!==B.GRASS&&ground!==B.SAND&&ground!==B.STONE&&ground!==B.DIRT&&ground!==B.PLANKS&&ground!==B.NETHERRACK)return;
 mobs.push(new Mob(type,sx+0.5,sy,sz+0.5));
}
function trySpawn(){
 if(!started)return;
 if(dim==='nether'){
  if(mobs.length>=9)return;
  const ang=Math.random()*Math.PI*2,d=14+Math.random()*12;
  const sx=Math.round(player.pos.x+Math.cos(ang)*d);
  const sz=Math.round(player.pos.z+Math.sin(ang)*d);
  for(let y=24;y>9;y--){
   if(isSolid(getBlock(sx,y-1,sz))&&getBlock(sx,y,sz)===B.AIR&&getBlock(sx,y+1,sz)===B.AIR){
    if(getBlock(sx,y-1,sz)===B.BEDROCK)break;
    mobs.push(new Mob('pigman',sx+0.5,y,sz+0.5));
    return;
   }
  }
  return;
 }
 if(mobs.length>=14)return;
 if(isNightNow()){
  const r=Math.random();
  ringSpawn(r<0.4?'zombie':r<0.7?'skeleton':'creeper');
  return;
 }
 // 白天：补充村民 / 猪 / 羊
 if(Math.random()<0.35&&countType('villager')<5){
  const sx=Math.round(village.x+Math.random()*16-8);
  const sz=Math.round(village.z+Math.random()*16-8);
  const sy=surfaceY(sx,sz);
  if(sy>SEA&&getBlock(sx,sy-1,sz)===B.GRASS)mobs.push(new Mob('villager',sx+0.5,sy,sz+0.5));
  return;
 }
 if(countType('pig')<4)ringSpawn('pig');
 else if(countType('sheep')<3)ringSpawn('sheep');
 else if(countType('cow')<3)ringSpawn('cow');
 else if(countType('chicken')<5)ringSpawn('chicken');
}

/* ---------------- 昼夜循环 ---------------- */
const DAY_LEN=300;
let dayT=0.05,gameTime=0;
let dlCur=1;
function isNightNow(){return dlCur<0.25;}
const colDay=new THREE.Color(0x87ceeb),colNight=new THREE.Color(0x070a1a),colTmp=new THREE.Color();
function updateDay(dt){
 dayT=(dayT+dt/DAY_LEN)%1;
 if(dim==='nether'){
  dlCur=0.5;
  scene.background.setHex(0x1b0505);scene.fog.color.setHex(0x300a0a);
  scene.fog.near=6;scene.fog.far=58;
  hemi.intensity=0.55;sunLight.intensity=0.1;
  return;
 }
 const ang=dayT*Math.PI*2;
 const sunY=Math.sin(ang),sunX=Math.cos(ang);
 dlCur=smoothstep(-0.12,0.25,sunY);
 colTmp.copy(colNight).lerp(colDay,dlCur);
 scene.background.copy(colTmp);
 scene.fog.color.copy(colTmp);
 scene.fog.near=20+dlCur*14;
 scene.fog.far=52+dlCur*34;
 hemi.intensity=0.22+dlCur*0.6;
 sunLight.intensity=0.15+dlCur*0.8;
 const sd=new THREE.Vector3(sunX,sunY,-0.35).normalize();
 sunLight.position.copy(sd).multiplyScalar(80).add(camera.position);
 sunLight.target.position.copy(camera.position);
 sunMesh.position.copy(camera.position).addScaledVector(sd,380);sunMesh.lookAt(camera.position);
 moonMesh.position.copy(camera.position).addScaledVector(sd,-380);moonMesh.lookAt(camera.position);
 sunMesh.visible=sunY>-0.15;moonMesh.visible=sunY<0.15;
 for(const c of clouds){
  c.position.x+=dt*1.1;
  if(c.position.x>player.pos.x+150)c.position.x=player.pos.x-150;
  if(c.position.z>player.pos.z+150)c.position.z=player.pos.z-150;
  if(c.position.z<player.pos.z-150)c.position.z=player.pos.z+150;
 }
}

/* ---------------- HUD ---------------- */
const heartsEl=document.getElementById('hearts');
function renderHearts(){
 let html='';
 for(let i=0;i<10;i++)html+='<span class="'+(i<Math.ceil(player.hp/2)?'hf':'he')+'">♥</span>';
 heartsEl.innerHTML=html;
}
renderHearts();
const msgEl=document.getElementById('msg');
let msgTimer=null;
function showMsg(t,long){
 msgEl.textContent=t;
 msgEl.style.opacity=1;
 clearTimeout(msgTimer);
 msgTimer=setTimeout(function(){msgEl.style.opacity=0;},long?4500:2200);
}
const vigEl=document.getElementById('vig');
const waterOvEl=document.getElementById('waterOv');
const infoEl=document.getElementById('info');
const mineWrapEl=document.getElementById('mineProgWrap');
const mineProgEl=document.getElementById('mineProg');

/* ---------------- 主循环 ---------------- */
const clock=new THREE.Clock();
let spawnTimer=2,tipStep=0;
let fpsC=0,fpsT=0,fpsV=0;
const tips=[
 '世界是无限的！朝一个方向一直走，地形会不断生成（M 打开地图）',
 '挖太深回不来了？按 R 复位，一键回到地表！',
 '配方表里材料够的可以直接点【合成】按钮，快捷方便',
 '主世界地下有金矿石（熔炉炼金锭）；下界猪灵必掉金锭，多刷几只就能做金苹果',
 '地下深处有岩浆池和黑曜石；发光的青色矿石=原力晶石（做活塞/原力苹果）',
 '合成弓+箭远程打怪；活塞右键可以推动方块；宝箱右键开出惊喜',
 '挖到黑曜石(需钻石镐)+打火石=下界传送门，下界有猪灵、金锭和石英'
];
function updatePlayer(dt){
 const feetId=getBlock(player.pos.x,player.pos.y+0.2,player.pos.z);
 const bodyId=getBlock(player.pos.x,player.pos.y+0.9,player.pos.z);
 const headId=getBlock(player.pos.x,player.pos.y+1.62,player.pos.z);
 const feetIn=feetId===B.WATER,bodyIn=bodyId===B.WATER,headIn=headId===B.WATER;
 const inLava=feetId===B.LAVA||bodyId===B.LAVA||headId===B.LAVA;
 if(headId===B.LAVA){waterOvEl.style.background='rgba(255,70,0,.55)';waterOvEl.style.opacity=1;}
 else{waterOvEl.style.background='rgba(24,68,170,.38)';waterOvEl.style.opacity=headIn?0.4:0;}
 if(inLava){lavaT+=dt;if(lavaT>0.6){lavaT=0;damagePlayer(4);}}else lavaT=0;
 // 移动方向
 let fx=0,fz=0;
 if(IS_MOBILE){fx=touchMove.x;fz=-touchMove.y;}
 else{
  if(keys.KeyW)fz+=1;if(keys.KeyS)fz-=1;
  if(keys.KeyA)fx-=1;if(keys.KeyD)fx+=1;
  const len=Math.hypot(fx,fz)||1;
  fx/=len;fz/=len;
 }
 const sin=Math.sin(player.yaw),cos=Math.cos(player.yaw);
 const speed=(bodyIn?3:(keys.ControlLeft?5.8:4.3));
 const wX=(fz*-sin+fx*cos)*speed;
 const wZ=(fz*-cos-fx*sin)*speed;
 const accel=player.onGround?12:(bodyIn?6:2.5);
 player.vx+=(wX-player.vx)*Math.min(1,accel*dt);
 player.vz+=(wZ-player.vz)*Math.min(1,accel*dt);
 // 重力/游泳（水与岩浆）
 if(bodyIn||feetIn||inLava){
  player.vy-=7*dt;
  player.vy=Math.max(player.vy,-2.6);
  if(keys.Space)player.vy=3.2;
 }else{
  player.vy-=24*dt;
  player.vy=Math.max(player.vy,-48);
  if(keys.Space&&player.onGround){player.vy=8.2;player.onGround=false;}
 }
 tryMove(player,player.vx*dt,player.vy*dt,player.vz*dt);
 if(player.landVy<-12.5){
  damagePlayer(Math.round((-player.landVy-12.5)*0.8));
 }
 player.landVy=0;
 // 相机（世界无限大，无水平边界限制）
 if(player.pos.y<-15){damagePlayer(50);player.pos.copy(spawn);player.vy=0;}
 // 传送门（冷却只在实际离开门后计时，防止来回弹）
 if(getBlock(player.pos.x,player.pos.y+0.5,player.pos.z)===B.PORTAL||getBlock(player.pos.x,player.pos.y+1.5,player.pos.z)===B.PORTAL){
  if(portalCd<=0){
   portalT+=dt;
   if(portalT>0.9)travelTo(otherDimName());
  }
 }else{portalT=0;portalCd-=dt;}
 // 相机
 camera.position.set(player.pos.x,player.pos.y+1.62,player.pos.z);
 if(shakeT>0){
  shakeT-=dt;
  camera.position.x+=(Math.random()-0.5)*shakeT*0.5;
  camera.position.y+=(Math.random()-0.5)*shakeT*0.5;
 }
 camera.rotation.y=player.yaw;
 camera.rotation.x=player.pitch;
 // 自然回血
 if(player.hp<20&&player.hp>0&&gameTime-player.lastHurt>6){
  player.regenT+=dt;
  if(player.regenT>3){player.regenT=0;player.hp++;renderHearts();}
 }
}
function updateInteraction(dt){
 player.atkCd-=dt;
 player.placeCd-=dt;
 // 移动端准星磁吸：中心没命中时在周围小锥角内就近吸附（辅助挖矿）
 let hit=raycastVoxel(camera.position,camDir(),5);
 if(IS_MOBILE&&mouseL&&!hit)hit=magneticBlock(5);
 if(hit){
  highlight.visible=true;
  highlight.position.set(hit.x+0.5,hit.y+0.5,hit.z+0.5);
 }else highlight.visible=false;
 if(mouseL&&inputActive()&&!dead&&!anyPanelOpen()){
  const mh=(IS_MOBILE?pickMobMagnetic(3.6):pickMob(3.6));
  if(mh&&(!hit||mh.t<hit.dist)){
   mineState=null;mineWrapEl.style.display='none';
   if(player.atkCd<=0){
    player.atkCd=0.4;swing();
    const dir=mh.m.pos.clone().sub(player.pos);dir.y=0;dir.normalize();
    const dmg=dmgOf(hotbar[sel]);
    mh.m.damage(dmg,dir);
    showDamage(dmg);
   }
  }else if(hit&&BLOCKS[hit.b].hard<Infinity){
   const def=BLOCKS[hit.b];
   const key=hit.x+','+hit.y+','+hit.z;
   if(!mineState||mineState.key!==key)mineState={key:key,progress:0,warned:false};
   const toolOk=!def.minPow||(isPick(hotbar[sel])&&ITEMS[hotbar[sel].id].power>=def.minPow);
   if(!toolOk){
    if(!mineState.warned){showMsg(def.name+' 需要更强的镐！');mineState.warned=true;}
    mineState.progress=0;
    mineWrapEl.style.display='none';
   }else{
    const mult=isPick(hotbar[sel])&&def.pick?ITEMS[hotbar[sel].id].power:1;
    const effMult=hotbar[sel]&&hotbar[sel].ench&&hotbar[sel].ench.eff?1+0.8*hotbar[sel].ench.eff:1;
    mineState.progress+=dt*mult*effMult;
    if(swingT<=0)swing();
    mineWrapEl.style.display='block';
    mineProgEl.style.width=Math.min(100,mineState.progress/def.hard*100)+'%';
    if(mineState.progress>=def.hard){breakBlock(hit);mineState=null;mineWrapEl.style.display='none';}
   }
  }else{
   mineState=null;mineWrapEl.style.display='none';
  }
 }else{
  mineState=null;mineWrapEl.style.display='none';
 }
 // 右键长按连续放置
 if(mouseR&&inputActive()&&!dead&&!anyPanelOpen()){
  placeRepeat-=dt;
  if(placeRepeat<=0){placeRepeat=0.25;useItem();}
 }
}
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),0.05);
 gameTime+=dt;
 if(started&&!dead){
  updatePlayer(dt);
  updateInteraction(dt);
  buildChunksAround(player.pos.x,player.pos.z);
 }
 if(started){
  spawnTimer-=dt;
  if(spawnTimer<=0){spawnTimer=4;trySpawn();}
  for(let i=mobs.length-1;i>=0;i--){
   const m=mobs[i];
   if(m.pos.distanceTo(player.pos)>60)m.remove();
   else m.update(dt,isNightNow());
  }
 }
 updateDay(dt);
 updateParticles(dt);
 processDirty();
 tickFurnaces(dt);
 updateArrows(dt);
 updateTnts(dt);
 updateDrops(dt);
 if(furnaceOpen)refreshFurnaceUI();
 if(forceT>0)forceT-=dt;
 if(teleCd>0)teleCd-=dt;
 if(mapOpen){mapRenderT+=dt;if(mapRenderT>0.4){mapRenderT=0;renderMap();}}
 fpsC++;fpsT+=dt;
 if(fpsT>=0.5){fpsV=Math.round(fpsC/fpsT);fpsC=0;fpsT=0;}
 // 手持动画
 swingT=Math.max(0,swingT-dt*4);
 heldGroup.rotation.x=-Math.sin(swingT*Math.PI)*1.1;
 heldGroup.rotation.z=-swingT*0.4;
 heldGroup.position.z=-0.7-swingT*0.12;
 // 信息面板
 if(started){
  infoEl.innerHTML='坐标: '+player.pos.x.toFixed(0)+' / '+player.pos.y.toFixed(0)+' / '+player.pos.z.toFixed(0)
   +'<br>维度: '+(dim==='over'?'主世界':'下界')
   +'<br>时间: '+(dim==='nether'?'永恒昏暗':(isNightNow()?'黑夜':'白天'))
   +'<br>生物: '+mobs.length+'　FPS: '+fpsV
   +(forceT>0?'<br>⚡ 原力: '+Math.ceil(forceT)+'s':'');
 }
 renderer.render(scene,camera);
}
animate();

/* ---------------- 启动 ---------------- */
document.getElementById('startBtn').addEventListener('click',function(){
 document.getElementById('startScr').classList.add('hidden');
 document.getElementById('hud').classList.remove('hidden');
 started=true;
 lockPointer();
 // 初始背包：木棍 + 小麦种子（用于农业开局）
 addItem(I.STICK,4);
 addItem(I.SEEDS,6);
 // 初始动物：猪 / 羊 / 牛 / 鸡
 const kinds=['pig','sheep','cow','chicken'];
 for(let i=0;i<6;i++){
  const sx=Math.round(spawn.x+Math.random()*16-8),sz=Math.round(spawn.z+Math.random()*16-8);
  const sy=surfaceY(sx,sz);
  if(sy>1)mobs.push(new Mob(kinds[i%4],sx+0.5,sy,sz+0.5));
 }
 // 初始村民（村庄附近）
 for(let i=0;i<5;i++){
  const sx=Math.round(village.x+Math.random()*14-7);
  const sz=Math.round(village.z+Math.random()*14-7);
  const sy=surfaceY(sx,sz);
  if(sy>SEA&&getBlock(sx,sy-1,sz)===B.GRASS)mobs.push(new Mob('villager',sx+0.5,sy,sz+0.5));
 }
 tips.forEach(function(t,i){setTimeout(function(){if(started)showMsg(t,true);},1500+i*5000);});
});
document.getElementById('respawnBtn').addEventListener('click',respawn);
document.getElementById('craftClose').addEventListener('click',closeCraft);
document.getElementById('furnClose').addEventListener('click',closeFurnace);
document.getElementById('tradeClose').addEventListener('click',closeTrade);
document.getElementById('mapClose').addEventListener('click',toggleMap);
