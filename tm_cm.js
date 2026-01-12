var aLayers = {};

var userImageList = [];
var otherBgList = {};
var type2FuncList = {};
// var groupList = [];
var fontList = {
  Prototype: "",
  Pagella: "",
  times: ""
};

var layerToDrag;
var dragOffsetX;
var dragOffsetY;
var keyFocusLayer;

var blockList = [
  // Templates
    {putUnder: "templates", text: "Green Card", src:"templates__green_normal"},
    {putUnder: "templates", text: "Green Small Bottom", src:"templates__green_small_bottom"},
    {putUnder: "templates", text: "Green Big Bottom", src:"templates__green_big_bottom"},
    {putUnder: "templates", text: "Blue Card", src:"templates__blue_normal"},
    {putUnder: "templates", text: "Blue Big Bottom", src:"template__blue_big_bottom"},
    {putUnder: "templates", text: "Blue Big Top", src:"templates__blue_big_top"},
    {putUnder: "templates", text: "Red Card", src:"templates__red_normal"},
    {putUnder: "templates", text: "Red Small Bottom", src:"templates__red_small_bottom"},
    {putUnder: "templates", text: "Prelude", src:"templates__prelude"},
    {putUnder: "templates", text: "Corporation", src:"templates__corporation"},

  // Global parameters
  {putUnder: "globalparameters", text: "", src:"globalparameters__oxygen"},
  {putUnder: "globalparameters", text: "", src:"globalparameters__temperature"},
  {putUnder: "globalparameters", text: "", src:"globalparameters__venus"},

  // Misc
  {putUnder: "misc", text: "", src:"misc__megacredit", otherbg:"mc_otherbg"},
  {putUnder: "misc", text: "mc_otherbg", src:"misc__other_player_background", hidden:true},
  {putUnder: "misc", text: "", src:"misc__arrow"},
  {putUnder: "misc", text: "Asterisk", src:"misc__asterisc"},
  {putUnder: "misc", text: "Slash", src:"misc__bar"},
  {putUnder: "misc", text: "", src:"misc__chairman"},
  {putUnder: "misc", text: "", src:"misc__colon"},
  {putUnder: "misc", text: "", src:"misc__delegate"},
  {putUnder: "misc", text: "", src:"misc__influence"},
  {putUnder: "misc", text: "", src:"misc__party_leader"},
  {putUnder: "misc", text: "Tag Holder", src:"misc__corp_tag_holder"},
  {putUnder: "misc", text: "Effect (bg)", src:"misc__effect"},
  {putUnder: "misc", text: "", src:"misc__asset"},
  {putUnder: "misc", text: "Colony Tile", src:"misc__colonytile"},
  {putUnder: "misc", text: "", src:"misc__population"},

  // Parties
  {putUnder: "parties", text: "", src:"parties__bureacrats"},
  {putUnder: "parties", text: "", src:"parties__centrists"},
  {putUnder: "parties", text: "", src:"parties__empower"},
  {putUnder: "parties", text: "", src:"parties__greens"},
  {putUnder: "parties", text: "", src:"parties__kelvinists"},
  {putUnder: "parties", text: "", src:"parties__mars_first"},
  {putUnder: "parties", text: "", src:"parties__populists"},
  {putUnder: "parties", text: "", src:"parties__reds"},
  {putUnder: "parties", text: "", src:"parties__scientists"},
  {putUnder: "parties", text: "", src:"parties__spome"},
  {putUnder: "parties", text: "", src:"parties__transhumanists"},
  {putUnder: "parties", text: "", src:"parties__unity"},

  // Production boxes
  {putUnder: "productionboxes", text: "prod_nxn", src:"productionboxes__nxn", hidden: true},
  // {putUnder: "productionboxes", text: "prod_otherbg", src:"other_player_background", hidden:true},

  // Requisites
  {putUnder: "requisites", text: "Max Requirement", src:"requisites__max_big"},
  {putUnder: "requisites", text: "Min Requirement (big)", src:"requisites__min_big"},
  {putUnder: "requisites", text: "Min Requirement", src:"requisites__min_medium"},
  {putUnder: "requisites", text: "Min Requirement (small)", src:"requisites__min_small"},
  {putUnder: "requisites", text: "No Requirement", src:"requisites__normal"},
  // Resources
  {putUnder: "resources", text: "", src:"resources__animal", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__biohazard", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__card", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__data", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__dust", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__fighter", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__floater", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__heat", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__microbe", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "res_otherbg", src:"resources__other_player_background", hidden:true},
  {putUnder: "resources", text: "", src:"resources__plant", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__power", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__radiation", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__science", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__steel", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__titanium", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__TR", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__wild", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__asteroid", otherbg:"res_otherbg"},
  {putUnder: "resources", text: "", src:"resources__ore", otherbg:"res_otherbg"},

  // Tags
  {putUnder: "tags", text: "", src:"tags__animal", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__building", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__city", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__earth", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__event", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__galactic", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__infrastructure", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__jovian", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__mars", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__microbe", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__moon", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "tag_otherbg", src:"tags__other_player_background", hidden:true},
  {putUnder: "tags", text: "", src:"tags__planetary", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__plant", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__power", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__radioactive", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__science", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__space", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__venus", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__wild", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__multitag", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__tourism", otherbg:"tag_otherbg"},
  {putUnder: "tags", text: "", src:"tags__mercury", otherbg:"tag_otherbg"},

  // Tiles
  {putUnder: "tiles", text: "City", src:"tiles__city", otherbg:"otherbg"},
  {putUnder: "tiles", text: "Colony", src:"tiles__colony"},
  {putUnder: "tiles", text: "Empty", src:"tiles__empty", otherbg:"otherbg"},
  {putUnder: "tiles", text: "Greenery no O2", src:"tiles__greenery_no_O2", otherbg:"otherbg"},
  {putUnder: "tiles", text: "Greenery", src:"tiles__greenery", otherbg:"otherbg"},
  {putUnder: "tiles", text: "Ocean", src:"tiles__ocean", otherbg:"otherbg"},
  {putUnder: "tiles", text: "Off-World City", src:"tiles__off-world_city", otherbg:"otherbg"},
  {putUnder: "tiles", text: "Special", src:"tiles__special", otherbg:"otherbg"},
  {putUnder: "tiles", text: "Trade", src:"tiles__trade"},
  {putUnder: "tiles", text: "Otherbg", src:"tiles__other_player_background", hidden:true},

  // VPs
  {putUnder: "VPs", text: "VP 1/", src:"VPs__1_for"},
  {putUnder: "VPs", text: "1 VP", src:"VPs__1"},
  {putUnder: "VPs", text: "VP 2/", src:"VPs__2_for"},
  {putUnder: "VPs", text: "2 VP", src:"VPs__2"},
  {putUnder: "VPs", text: "3 VP", src:"VPs__3"},
  {putUnder: "VPs", text: "4 VP", src:"VPs__4"},
  {putUnder: "VPs", text: "5 VP", src:"VPs__5"},
  {putUnder: "VPs", text: "VP background", src:"VPs__blank"},
  {putUnder: "VPs", text: "-VP", src:"VPs__negative"},
  {putUnder: "VPs", text: "/ VP", src:"VPs__n_for"}

  
];

var blockDefaults = {
  tags: [
    {label:"First Tag", x:639, y:67, width:110, height:110},
    {label:"Second Tag", x:524, y:67, width:110, height:110},
    {label:"Third Tag", x:410, y:67, width:110, height:110},
    {label:"Small Tag", x:330, y:536, width:82, height:82},
    {label:"First (Prel)", x:937, y:67, width:110, height:110},
    {label:"Second (Prel)", x:822, y:67, width:110, height:110},
    {label:"Third (Prel)", x:708, y:67, width:110, height:110},
    {label:"First (Corp)", x:937, y:90, width:110, height:110},
    {label:"Second (Corp)", x:822, y:90, width:110, height:110}
  ],
  templates: [
    {label:"Vertical Card", x:0, y:0, width:826, height:1126},
    {label:"Horizontal Card", x:0, y:0, width:1126, height:826}
  ],
  text: [
    {label:"Card Cost", x:118, y:147, height:66, color:"#000000", font:"Prototype", style:"normal", weight:"normal", justify:"center"},
    {label:"Card Name", x:413, y:214, height:46, color:"#000000", font:"Prototype", style:"normal", weight:"normal", justify:"center"},
    {label:"Description", x:413, y:643, height:22, lineSpace:4, color:"#000000", font:"Pagella", style:"normal", weight:"normal", justify:"center"},
    {label:"Flavor Text", x:413, y:1005, height:22, lineSpace:4, color:"#000000", font:"Pagella", style:"italic", weight:"bold", justify:"center"},
    {label:"FAN MADE", x:413, y:611, height:24, color:"#24770d", font:"Prototype", style:"normal", weight:"normal", justify:"center"},
    {label:"PRELUDE", data:"P R E L U D E", x:563, y:99, height:22, color:"#000000", font:"Prototype", style:"normal", weight:"normal", justify:"center"},
    {label:"CORPORATION", data:"C O R P O R A T I O N", x:563, y:109, height:24, color:"#000000", font:"Prototype", style:"normal", weight:"normal", justify:"center"},
    {label:"EFFECT", data:"E F F E C T", x:800, y:333, height:22, color:"#000000", font:"Prototype", style:"normal", weight:"normal", justify:"center"}
  ],
  resources: [
    {label:"Standard", x:413, y:643, width:92, height:92},
    {label:"Card", x:413, y:643, width:88, height:122},
    {label:"TR", x:413, y:643, width:151, height:112}
  ],
  VPs: [
    {label:"Standard", x:542, y:836, width:223, height:223},
    {label:"Negative", x:652, y:836, width:223, height:223}
  ],
  tiles: [
    {label:"Standard tile", height:142}
  ],
  requisites: [
    {label:"Max", x:180, y:92, width:200, height:60},
    {label:"Min Large", x:180, y:92, width:176, height:60},
    {label:"Min Medium", x:180, y:92, width:147, height:60},
    {label:"Min Small", x:180, y:92, width:130, height:60},
    {label:"No Req", x:180, y:92, width:21, height:60}
  ],
  globalparameters: [
    {label:"Oxygen", x:413, y:643, width:118, height:118},
    {label:"Temp", x:413, y:643, width:35, height:118},
    {label:"Venus", x:413, y:643, width:125, height:71}
  ],
  misc: [
    {label:"MC", x:413, y:643, width:92, height:92},
    {label:"Arrow", x:413, y:429, width:116, height:55},
    {label:"Asterisk", x:413, y:643, width:55, height:55},
    {label:"Slash", x:413, y:643, width:55, height:146},
    {label:"Colon", x:413, y:643, width:11, height:55},
    {label:"Delegate", x:413, y:643, width:77, height:99},
    {label:"Effect (bg)", x:631, y:307, width:346, height:36},
    {label:"Influence", x:413, y:643, width:117, height:122},
    {label:"Tag Holder 0", x:969, y:103, width:257, height:89},
    {label:"Tag Holder 1", x:898, y:103, width:257, height:89},
    {label:"Tag Holder 2", x:794, y:103, width:257, height:89}
  ],
  parties: [
    {label:"Party", x:413, y:643, width:169, height:122}
  ],
  production: [
    {label:"1x height", height:143},
    {label:"2x height", height:235},
    {label:"1x width", width:143},
    {label:"1.5x width", width:188},
    {label:"2x width", width:235},
    {label:"2.5x width", width:279},
    {label:"3x width", width:325}
  ]
};

var megaTemplates = {
  green_normal: {
      layers: [
        {type: "base", color: "#ffffff", height: 1126, width: 826, params: "color"},
        {type:"block", src:"templates__green_normal", x:0,y:0,width:826,height:1126,params:"allimages"},
        {type:"text",data:"Cost",x:118,y:147,width:826,height:66,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
        {type:"block", src:"requisites__normal", x:179,y:97,width:22,height:59,params:"allimages allpreset"},
        {type:"text",data:"CARD NAME",x:413,y:214,width:826,height:46,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
        {type:"text",data:"FAN MADE",x:413,y:612,width:826,height:24,color:"#24770d",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
        {type:"text",data:"Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines",x:110,y:770,width:826,height:22,color:"#000000",font:"Pagella",style:"normal",weight:"normal",lineSpace:4,justify:"left",params:"allimages color alltext allpreset"},
        {type:"text",data:"Flavor text!",x:413,y:1005,width:826,height:22,color:"#000000",font:"Pagella",style:"italic",weight:"bold",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"}
      ]
  },
  green_big_bottom: {
    layers: [
      {type: "base", color: "#ffffff", height: 1126, width: 826, params: "color"},
      {type:"block", src:"templates__green_big_bottom", x:0,y:0,width:826,height:1126,params:"allimages"},
      {type:"text",data:"Cost",x:118,y:147,width:826,height:66,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"block", src:"requisites__normal", x:179,y:97,width:22,height:59,params:"allimages allpreset"},
      {type:"text",data:"CARD NAME",x:413,y:214,width:826,height:46,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"FAN MADE",x:413,y:562,width:826,height:24,color:"#24770d",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines",x:110,y:770,width:826,height:22,color:"#000000",font:"Pagella",style:"normal",weight:"normal",lineSpace:4,justify:"left",params:"allimages color alltext allpreset"},
      {type:"text",data:"Flavor text!",x:413,y:1005,width:826,height:22,color:"#000000",font:"Pagella",style:"italic",weight:"bold",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"}
    ]
  },
  green_small_bottom: {
    layers: [
      {type: "base", color: "#ffffff", height: 1126, width: 826, params: "color"},
      {type:"block", src:"green_small_bottom", x:0,y:0,width:826,height:1126,params:"allimages"},
      {type:"text",data:"Cost",x:118,y:147,width:826,height:66,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"block", src:"requisites__normal", x:179,y:97,width:22,height:59,params:"allimages allpreset"},
      {type:"text",data:"CARD NAME",x:413,y:214,width:826,height:46,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"FAN MADE",x:413,y:664,width:826,height:24,color:"#24770d",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines",x:110,y:770,width:826,height:22,color:"#000000",font:"Pagella",style:"normal",weight:"normal",lineSpace:4,justify:"left",params:"allimages color alltext allpreset"},
      {type:"text",data:"Flavor text!",x:413,y:1005,width:826,height:22,color:"#000000",font:"Pagella",style:"italic",weight:"bold",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"}
    ]
  },
  blue_normal: {
    layers: [
      {type: "base", color: "#ffffff", height: 1126, width: 826, params: "color"},
      {type:"block", src:"templates__blue_normal", x:0,y:0,width:826,height:1126,params:"allimages"},
      {type:"text",data:"Cost",x:118,y:147,width:826,height:66,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"block", src:"requisites__normal", x:179,y:97,width:22,height:59,params:"allimages allpreset"},
      {type:"text",data:"CARD NAME",x:413,y:214,width:826,height:46,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"FAN MADE",x:413,y:798,width:826,height:24,color:"#0c5e84",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines",x:100,y:860,width:826,height:22,color:"#000000",font:"Pagella",style:"normal",weight:"normal",lineSpace:4,justify:"left",params:"allimages color alltext allpreset"},
      {type:"text",data:"Flavor text!",x:413,y:1005,width:826,height:22,color:"#000000",font:"Pagella",style:"italic",weight:"bold",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"block", src:"arrow", x:355,y:265,width:116,height:55,params:"allimages allpreset"},
      {type:"text",data:"Effect or Action text!",x:413,y:360,width:826,height:22,color:"#000000",font:"Pagella",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"}
    ]
  },
  blue_big_bottom: {
    layers: [
      {type: "base", color: "#ffffff", height: 1126, width: 826, params: "color"},
      {type:"block", src:"templates__blue_big_bottom", x:0,y:0,width:826,height:1126,params:"allimages"},
      {type:"text",data:"Cost",x:118,y:147,width:826,height:66,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"block", src:"requisites__normal", x:179,y:97,width:22,height:59,params:"allimages allpreset"},
      {type:"text",data:"CARD NAME",x:413,y:214,width:826,height:46,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"FAN MADE",x:413,y:753,width:702,height:24,color:"#0c5e84",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines",x:100,y:860,width:826,height:22,color:"#000000",font:"Pagella",style:"normal",weight:"normal",lineSpace:4,justify:"left",params:"allimages color alltext allpreset"},
      {type:"text",data:"Flavor text!",x:413,y:1005,width:826,height:22,color:"#000000",font:"Pagella",style:"italic",weight:"bold",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"block", src:"arrow", x:355,y:265,width:116,height:55,params:"allimages allpreset"},
      {type:"text",data:"Effect or Action text!",x:413,y:360,width:826,height:22,color:"#000000",font:"Pagella",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"}
    ]
  },
  blue_big_top: {
    layers: [
      {type: "base", color: "#ffffff", height: 1126, width: 826, params: "color"},
      {type:"block", src:"templates__blue_big_top", x:0,y:0,width:826,height:1126,params:"allimages"},
      {type:"text",data:"Cost",x:118,y:147,width:826,height:66,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"block", src:"requisites__normal", x:179,y:97,width:22,height:59,params:"allimages allpreset"},
      {type:"text",data:"CARD NAME",x:413,y:214,width:826,height:46,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"FAN MADE",x:413,y:849,width:702,height:24,color:"#0c5e84",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines",x:100,y:891,width:826,height:22,color:"#000000",font:"Pagella",style:"normal",weight:"normal",lineSpace:4,justify:"left",params:"allimages color alltext allpreset"},
      {type:"text",data:"Flavor text!",x:413,y:1005,width:826,height:22,color:"#000000",font:"Pagella",style:"italic",weight:"bold",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"block", src:"arrow", x:355,y:265,width:116,height:55,params:"allimages allpreset"},
      {type:"text",data:"Effect or Action text!",x:413,y:360,width:826,height:22,color:"#000000",font:"Pagella",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"}
    ]
  },
  red_normal: {
    layers: [
      {type: "base", color: "#ffffff", height: 1126, width: 826, params: "color"},
      {type:"block", src:"templates__red_normal", x:0,y:0,width:826,height:1126,params:"allimages"},
      {type:"text",data:"Cost",x:118,y:147,width:826,height:66,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"block", src:"requisites__normal", x:179,y:97,width:22,height:59,params:"allimages allpreset"},
      {type:"text",data:"CARD NAME",x:413,y:214,width:826,height:46,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"FAN MADE",x:413,y:685,width:826,height:24,color:"#c36a17",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines",x:100,y:810,width:826,height:22,color:"#000000",font:"Pagella",style:"normal",weight:"normal",lineSpace:4,justify:"left",params:"allimages color alltext allpreset"},
      {type:"text",data:"Flavor text!",x:413,y:1005,width:826,height:22,color:"#000000",font:"Pagella",style:"italic",weight:"bold",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"}
    ]
  },
  red_small_bottom: {
    layers: [
      {type: "base", color: "#ffffff", height: 1126, width: 826, params: "color"},
      {type:"block", src:"templates__red_small_bottom", x:0,y:0,width:826,height:1126,params:"allimages"},
      {type:"text",data:"Cost",x:118,y:147,width:826,height:66,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"block", src:"requisites__normal", x:179,y:97,width:22,height:59,params:"allimages allpreset"},
      {type:"text",data:"CARD NAME",x:413,y:214,width:826,height:46,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"FAN MADE",x:413,y:718,width:826,height:24,color:"#c36a17",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines",x:100,y:810,width:826,height:22,color:"#000000",font:"Pagella",style:"normal",weight:"normal",lineSpace:4,justify:"left",params:"allimages color alltext allpreset"},
      {type:"text",data:"Flavor text!",x:413,y:1005,width:826,height:22,color:"#000000",font:"Pagella",style:"italic",weight:"bold",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"}
    ]
  },
  prelude: {
    layers: [
      {type: "base", color: "#ffffff", height: 826, width: 1126, params: "color"},
      {type:"block", src:"templates__prelude", x:0,y:0,width:1126,height:826,params:"allimages"},
      {type:"text",data:"CARD NAME",x:563,y:218,width:826,height:48,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"FAN MADE",x:563,y:500,width:826,height:24,color:"#ce809f",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"P R E L U D E",x:563,y:99,width:826,height:24,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text",data:"Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines",x:110,y:560,width:826,height:22,color:"#000000",font:"Pagella",style:"normal",weight:"normal",lineSpace:4,justify:"left",params:"allimages color alltext allpreset"},
      {type:"text",data:"Flavor text!",x:563,y:723,width:826,height:22,color:"#000000",font:"Pagella",style:"italic",weight:"bold",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"}
    ]
  },
  corporation: {
    layers: [
      {type:"base", color: "#ffffff", height: 826, width: 1126, params: "color"},
      //{type:"block", src:"2_for", x:969,y:103,width:257,height:89,params:"allimages"},
      {type:"block", src:"templates__corporation", x:0,y:0,width:1126,height:826,params:"allimages"},
      {type:"effect", x: 600, y: 300, width: 400, height: 300, params: "allimages allpreset"},
      //{type:"block", name: "", iNum: 97, x: 631, y: 307, width: 345.79, height: 36,params:"allimages"},
      {type:"block", name: "", src: "effect", x: 631, y: 307, width: 345.79, height: 36,params:"allimages"},
      {type:"text", data: "E F F E C T", x: 800, y: 333, width: 1126, height: 22, color: "#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text","data":"FAN MADE",x:198,y:736,width:826,height:24,color:"#c3c3c3",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text","data":"C O R P O R A T I O N",x:563,y:109,width:826,height:24,color:"#000000",font:"Prototype",style:"normal",weight:"normal",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"},
      {type:"text","data":"Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines",x:110,y:560,width:826,height:22,color:"#000000",font:"Pagella",style:"normal",weight:"normal",lineSpace:4,justify:"left",params:"allimages color alltext allpreset"},
      {type:"text","data":"Flavor text!",x:563,y:723,width:826,height:22,color:"#000000",font:"Pagella",style:"italic",weight:"bold",lineSpace:4,justify:"center",params:"allimages color alltext allpreset"}
    ]
  }
};

var ddcount = 0;
var maxToLoad;
var numLoaded;

var hiddenImage = {};

var domInputfont = document.getElementById("inputfont");
var domParams = document.getElementById("params").parentNode.removeChild(document.getElementById("params"));
domParams.classList.remove("w3-hide");

function resetProject(loadautosave) {
  document.getElementById("layerlist").innerHTML = "";
  ddcount = 0;
  aLayers = {};
  document.getElementById("xcanvases").innerHTML = "";
  aCanvases = [];
  addLayer("Base",{type:"base", color:"#ffffff", height:1126, width:826, params:"color"});

  maxToLoad = 0;
  for (let i=0; i < blockList.length; i++) {
    if (!blockList[i].obj) {
      maxToLoad++;
      addBlockMenuItem(i);
    }
  }
  // if (maxToLoad) {
  //   numLoaded = 0;
  //   document.getElementById("files").max = maxToLoad;
  //   document.getElementById("files").value = numLoaded;
  //   document.getElementById("loadprogress").style.display = "block";
  //   document.getElementById("cmcanvas").style.display = "none";
  // } else {
    allLoadingDone(loadautosave);
  // }
}

function fetchBlock(num) {
  let imageObj = new Image();
  // Allow cross-origin requests so canvas stays exportable when server
  // provides appropriate CORS headers. Must be set before assigning `src`.
  // Do NOT set `crossOrigin` when running from the local filesystem
  // (file://), as browsers will block those requests when CORS is used.
  try {
    if (window && window.location && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
      imageObj.crossOrigin = "Anonymous";
    }
  } catch (err) {
    // ignore and proceed without crossOrigin
  }
  imageObj.onload = onBlockLoad;
  // Try the new prefixed filename first (e.g. "resources__animal"),
  // then fall back to the original unprefixed name if the first fails.
  (function(img, idx) {
    const entry = blockList[idx] || {};
    const base = entry.src || "";
    const prefixed = (base.indexOf('__') === -1) ? (entry.putUnder + '__' + base) : base;
    const prefixedPath = entry.putUnder + '/' + prefixed + '.png';
    const fallbackPath = entry.putUnder + '/' + base + '.png';
    img._fetchAttempts = 0;
    img.onerror = function (e) {
      if (this._fetchAttempts === 0 && prefixedPath !== fallbackPath) {
        this._fetchAttempts++;
        console.warn('fetchBlock: primary image failed, trying fallback', fallbackPath);
        this.src = fallbackPath;
        return;
      }
      try {
        console.error("fetchBlock: image load error", this.src, this.dataindex, e);
      } catch (err) {
        console.error("fetchBlock: image load error (no details)", err);
      }
    };
    console.log("fetchBlock: requesting", idx, prefixedPath);
    img.src = prefixedPath;
  })(imageObj, num);
  imageObj.dataindex = num;
  blockList[num].obj = imageObj;
  if (blockList[num].text.indexOf("otherbg") != -1) {
    // if this image is an 'other people background', save its name
    otherBgList[blockList[num].text] = imageObj;
  }
}

function resolveBlockIndex(idOrSrc) {
  if (idOrSrc === undefined || idOrSrc === null) return -1;
  if (typeof idOrSrc === 'number') return idOrSrc;
  // numeric string?
  if ((typeof idOrSrc === 'string') && idOrSrc.match(/^\d+$/)) return Number(idOrSrc);
  // search by src
  for (let i = 0; i < blockList.length; i++) {
    // exact match
    if (blockList[i].src === idOrSrc) return i;
    // support matching when filenames were prefixed with "putUnder__basename"
    if (typeof blockList[i].src === 'string' && blockList[i].src.indexOf('__') !== -1) {
      const parts = blockList[i].src.split('__');
      const suffix = parts[parts.length - 1];
      if (suffix === idOrSrc) return i;
    }
    if (blockList[i].text && (blockList[i].text === idOrSrc)) return i;
  }
  return -1;
}

function addBlockMenuItem(num) {

  if (blockList[num].hidden) {
    // hidden images don't get menu items
    hiddenImage[blockList[num].text] = num;
  } else {
    let tmpText = blockList[num].text;
    if (!tmpText) {
      tmpText = blockList[num].src;
      tmpText = tmpText.replace(/_/g, ' ');
      tmpText = tmpText.replace(tmpText.charAt(0), tmpText.charAt(0).toUpperCase());
      blockList[num].text = tmpText;
    }
    // add menu item for image
    // <a onclick="addBlock('template:green')" href="#" class="w3-bar-item w3-button">Green Card</a>
    if (!document.getElementById("image" + num)) {
      let toAdd = document.createElement("a");
      toAdd.onclick = addBlock;
      toAdd.innerText = tmpText;
      toAdd.classList.add("w3-bar-item");
      toAdd.classList.add("w3-button");
      toAdd.href = "#";
      toAdd.id = "image" + num;
      document.getElementById(blockList[num].putUnder).appendChild(toAdd);
      if (blockList[num].putUnder == "templates") {
        // add Super Templates
        toAdd = document.createElement("a");
        toAdd.onclick = addMegaTemplate;
        toAdd.innerText = tmpText;
        toAdd.classList.add("w3-bar-item");
        toAdd.classList.add("w3-button");
        toAdd.href = "#";
        toAdd.id = "mega" + blockList[num].src;
        document.getElementById("fromTemplate").appendChild(toAdd);
      }
    }
  }
}

function addLayer(title, layer) {
  // <div id='div1' class='divRec'><div class='inside'>item 1</div></div>
  let toAdd = document.createElement("div");
  // toAdd.appendChild(downButton());
  if (!ddcount && (ddcount != 0)) ddcount = 0;
  toAdd.id = "dragdropdiv" + ddcount;
  toAdd.classList.add("divRec");
  if (ddcount) toAdd.appendChild(createGroupCheckbox());
  let childAdd = document.createElement("div");
  childAdd.classList.add("inside");
  //childAdd.innerHTML = title;
  childAdd.appendChild(createTextbox(title));
  childAdd.onclick = selectLayer;
  // skip delete button for base layer
  if (ddcount) childAdd.appendChild(deleteButton());
  toAdd.appendChild(childAdd);
  document.getElementById("layerlist").appendChild(toAdd);
  aLayers[toAdd.id] = layer;
  ddcount++;

  sortable( document.getElementById('layerlist'), function (item){
    /* console.log(item); */
  });
  return layer;
}

function createGroupCheckbox() {
  let toAdd = document.createElement("input");
  toAdd.type = "checkbox";
  toAdd.classList.add("groupcheck");
  toAdd.classList.add("w3-hide");
  toAdd.checked = false;
  //toAdd.style.display = "none";
  return toAdd;
}

function createTextbox(txt) {
  let toAdd = document.createElement("input");
  toAdd.type = "text";
  toAdd.id = "layername" + ddcount;
  toAdd.maxLength = 20;
  toAdd.size = 15;
  toAdd.value = txt;
  toAdd.onchange = function () {updateLayerName(event, this)};
  return toAdd;
}

function updateLayerName(e, th) {
  let layerName = th.parentNode.parentNode.id;
  aLayers[layerName].name = th.value;
  drawProject();
}

function deleteButton() {
  let toAdd = document.createElement("button");
  toAdd.innerHTML = "X";
  toAdd.style.float = "right";
  toAdd.onclick = function () {deleteListItem(event, this)};
  return toAdd;
}

function genSpan(txt) {
  let toAdd = document.createElement("span");
  toAdd.innerText = txt;
}

function deleteListItem(e,th) {
  e.stopPropagation();
  // delete item from aLayers and from layerlist (DOM)
  let toDelete = th.parentNode.parentNode;
  // let deleteNum = Number(toDelete.id.slice(11));
  // // for every list numbered > than the one being deleted, subtract 1
  // let allLayerNodes = toDelete.parentNode.children;
  // for (let ch=0; ch < allLayerNodes.length; ch++) {
  //   let thisNum = Number(allLayerNodes[ch].id.slice(11));
  //   if (thisNum > deleteNum)   {
  //     thisNum--;
  //     allLayerNodes[ch].id = "dragdropdiv" + thisNum;
  //   }

  // }
  delete aLayers[toDelete.id];
  toDelete.parentNode.removeChild(toDelete);
  drawProject();
}

// Return the id of the currently selected layer DOM node, or null
function getSelectedLayerNodeId() {
  let nodes = document.getElementsByClassName('divRec');
  for (let i=0; i < nodes.length; i++) {
    if (nodes[i].classList.contains('selected')) return nodes[i].id;
  }
  return null;
}

// Update the params panel inputs to reflect `layer`'s current values.
function refreshParamsForLayer(layer, nodeId) {
  if (!layer) return;
  let thisLayer = layer;
  let thisLayerParams = thisLayer.params || "";
  if (!nodeId) nodeId = getSelectedLayerNodeId();
  if (nodeId != "dragdropdiv0") {
    thisLayerParams += " allall";
  }

  for (let pch = 0; pch < domParams.children.length; pch++) {
    let thispch = domParams.children[pch];
    if (thisLayerParams.indexOf(thispch.id) == -1) {
      thispch.classList.add("w3-hide");
    } else {
      thispch.classList.remove("w3-hide");
      for (let intype of ["input", "textarea", "select"]) {
        let chInputs = thispch.getElementsByTagName(intype);
        for (let subch of chInputs) {
          if (subch.id.indexOf("input") == 0) {
            if (subch.type == "checkbox") {
              subch.checked = thisLayer[subch.id.slice(5)];
            } else {
              // guard against undefined properties
              try { subch.value = thisLayer[subch.id.slice(5)]; } catch (e) {}
            }
          } else if ((subch.id == "lar") || (subch.id == "slar")) {
            subch.checked = true;
          } else if (subch.id == "presets") {
            let opts = subch.getElementsByTagName("option");
            let defType = "";
            if (thisLayer.type == "block") {
              defType = blockList[thisLayer.iNum].putUnder;
            } else if (thisLayer.type == "text") {
              defType = "text";
            } else if (thisLayer.type == "production") {
              defType = "production";
            }
            if (defType) {
              subch.value = "";
              while (opts.length < blockDefaults[defType].length + 1) {
                let cNode = opts[1].cloneNode(false);
                cNode.value = "defselect" + (opts.length - 1);
                subch.appendChild(cNode);
              }
              for (let i = 1; i < opts.length; i++) {
                if (i <= blockDefaults[defType].length) {
                  opts[i].innerText = blockDefaults[defType][i-1].label;
                  opts[i].classList.remove("w3-hide");
                } else {
                  opts[i].classList.add("w3-hide");
                }
              }
            }
          }
        }
      }
    }
  }
}

function selectLayer() {
  removeKeyInputFocus();
  let allLayerNodes = document.getElementById("layerlist").children;
  let clickedNode = this.parentNode;

  // Deselect any other node but keep the clicked node selected
  for (let ch = 0; ch < allLayerNodes.length; ch++) {
    let node = allLayerNodes[ch];
    if (node !== clickedNode && node.classList.contains("selected")) {
      if (domParams.parentNode == node) {
        node.removeChild(domParams);
      }
      node.classList.remove("selected");
      let buttons = node.getElementsByTagName("button");
      if (buttons.length) {
        buttons[0].style.display = "block";
      }
    }
  }

  // Ensure clicked node is selected (keep it selected if it already was)
  if (!clickedNode.classList.contains("selected")) {
    clickedNode.classList.add("selected");
  }

  // Show appropriate params for the clicked layer (populate inputs)
  let thisLayer = aLayers[clickedNode.id];
  refreshParamsForLayer(thisLayer, clickedNode.id);

  clickedNode.appendChild(domParams);

  try { drawProject(); } catch (e) {}
}

function drawProject() {
  if (reloading) return;
  let c = document.getElementById("cmcanvas");
  let ctx = c.getContext("2d");
  let layerDivs = document.getElementsByClassName("divRec");
  let imagesForSaving = [];
  for (let i=0; i < layerDivs.length; i++) {
    let layer = aLayers[layerDivs[i].id];
    imagesForSaving.push(layer);
    switch (layer.type) {
      case "block":
        if (i==0) {
          c.height = layer.height;
          c.width = layer.width;
        }
        // layer = {type:"block", obj:{}, x:0, y:0, width:0, height:0, params:"allimages"};
        if (layer.obg) { // draw others background?
          let brdr = 3;
          if (!otherBgList[blockList[layer.iNum].otherbg]) {
            for (let j=0; j < blockList.length; j++) {
              if (blockList[j].text == blockList[layer.iNum].otherbg) {
                fetchBlock(j);
                break;
              }
            }
          } else if (otherBgList[blockList[layer.iNum].otherbg].complete) {
            ctx.drawImage(otherBgList[blockList[layer.iNum].otherbg],layer.x-brdr,layer.y-brdr,layer.width+2*brdr,layer.height+2*brdr);
          }
        }
        if (!blockList[layer.iNum].obj) {
          fetchBlock(layer.iNum);
        } else if (blockList[layer.iNum].obj.complete) {
          ctx.drawImage(blockList[layer.iNum].obj,layer.x,layer.y,layer.width,layer.height);
        }
        break;
      case "text":

        // layer = {type:"text", data:"", x:0, y:0, width:0, height:0,
        // color:"#000000",
        // font:"Prototype", lineSpace:4, justify:"center",
        // params:""};
        ctx.textAlign = layer.justify;
        if (!layer.style) layer.style = "normal";
        ctx.font = layer.style + " " + layer.weight + " " + layer.height + "px " + layer.font;
        ctx.fillStyle = layer.color;
        // TBD break up long text into mutiple parts
        // Note that this algorithm is copied in clickIsWithinText()
        let lines = layer.data.split("\n");
        let cnt = 0;
        for (var ln=0; ln < lines.length; ln++) {
          let spl = lines[ln].split(" ");
          let o = "";
          while (spl.length) {
            o = spl.shift();
            while (spl.length && (ctx.measureText(o + " " + spl[0]).width < layer.width)) {
              o += " " + spl.shift();
            }
            ctx.fillText(o, layer.x, 0 + layer.y + (layer.height + layer.lineSpace) * cnt);
            cnt++;
          }
        }

        break;
      case "production":

        {
          let sz = 20;
          let border = 3;
          let xpos = Number(layer.x);
          let ypos = Number(layer.y);
          let width = Number(layer.width);
          let height = Number(layer.height);
          let img = blockList[hiddenImage["prod_nxn"]].obj ;
          let x=xpos;
          let w=width % sz;
          // if (!w) w += sz;
          let h=height % sz;
          // if (!h) h += sz;
          for (x=xpos; x <= xpos+width; x += sz) {
            let y=ypos;
            for (y=ypos; y <= ypos+height; y += sz) {
              if ((x <= xpos+width-sz) && (y <= ypos+height-sz)) {
                ctx.drawImage(img,x,y,sz,sz);
              } else {
                if (x > xpos+width-sz) {
                  if (y > ypos+height-sz) {
                    ctx.drawImage(img,0,0,w,h,x,y,w,h);
                  } else {
                    ctx.drawImage(img,0,0,w,sz,x,y,w,sz);
                  }
                } else {
                  if (y > ypos+height-sz) {
                    ctx.drawImage(img,0,0,sz,h,x,y,sz,h);
                  } else {
                    window.alert("What?");
                    ctx.drawImage(img,0,0,sz,sz,x,y,sz,sz);
                  }
                }
              }

            }
          }
          // inner gradient
          let my_gradient = ctx.createLinearGradient(0, ypos, 0, ypos + height);
          my_gradient.addColorStop(0, "#9d6c43");
          my_gradient.addColorStop(1, "#5a412c");
          ctx.fillStyle = my_gradient;
          ctx.fillRect(xpos, ypos+border, width, border); // top
          ctx.fillRect(xpos, ypos+height-border*2, width, border); // bottom
          ctx.fillRect(xpos+border, ypos, border, height); // left
          ctx.fillRect(xpos+width-border*2, ypos, border, height); // right

          // outer gradient
          my_gradient = ctx.createLinearGradient(0, ypos, 0, ypos + height);
          my_gradient.addColorStop(0, "#505050");
          my_gradient.addColorStop(1, "#c0c0c0");
          ctx.fillStyle = my_gradient;
          ctx.fillRect(xpos, ypos, width, border);// top
          ctx.fillRect(xpos, ypos+height-border, width, border); // bottom
          ctx.fillRect(xpos, ypos, border, height); // left
          ctx.fillRect(xpos+width-border, ypos, border, height); // right
        }

        break;
      case "effect":

        {
          let border = 5;
          let xpos = Number(layer.x);
          let ypos = Number(layer.y);
          let width = Number(layer.width);
          let height = Number(layer.height);
          // draw border (actually draws whole rectange but we overwrite below)
          let grd = ctx.createLinearGradient(xpos, ypos, xpos+width, ypos);
          let stops = [0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.68, 0.76, 0.84, 0.92];
          let stopColors = ["#333333", "#999999"];
          for (let s=0; s < stops.length; s++) {
            grd.addColorStop(stops[s], stopColors[s % 2]);
          }
          grd.addColorStop(1, "#777777");
          ctx.fillStyle = grd;
          ctx.fillRect(xpos, ypos, layer.width, layer.height);
          // draw center
          grd = ctx.createLinearGradient(xpos+border, ypos+border, xpos+layer.width-border, ypos+layer.height-border);
          stops = [0, 0.07, 0.25, 0.6, 0.85, 1.0];
          stopColors = ["#ffffff", "#999999"];
          for (let s=0; s < stops.length; s++) {
            grd.addColorStop(stops[s], stopColors[s % 2]);
          }
          ctx.fillStyle = grd;
          ctx.fillRect(xpos+border, ypos+border, layer.width-2*border, layer.height-2*border);
        }
        break;
      case "userFile":
      case "embedded":
      case "webFile":
        if (layer.iNum != -1) {
          if (layer.alpha == undefined) layer.alpha = 100;
          ctx.globalAlpha = Number(layer.alpha) / 100;
          ctx.drawImage(userImageList[layer.iNum],layer.sx,layer.sy,layer.swidth,layer.sheight,layer.x,layer.y,layer.width,layer.height);
          ctx.globalAlpha = 1;
        }

        break;
      case "line":

        ctx.lineWidth = layer.width;
        ctx.strokeStyle = layer.color;
        ctx.translate(layer.x, layer.y);
        ctx.rotate(Math.PI * layer.angle / 180);
        ctx.moveTo(0,0);
        ctx.lineTo(layer.len,0);
        ctx.stroke();
        ctx.setTransform();
        ctx.lineWidth = 1;
        break;
      // case "group":
      //   break;
      case "base":

        // set height/width
        c.height = layer.height;
        c.width = layer.width;
        // clear to background color
        ctx.fillStyle = layer.color;
        // ctx.fillStyle = "rgb(" + layer.red + "," + layer.blue + "," + layer.green + ")";
        ctx.fillRect(0,0,layer.width, layer.height);
        break;

      default:
        window.alert("Invalid layer type:" + layer.type);
        break;
    }
  }
  autoSave(imagesForSaving);
  if (window.debugOverlay && typeof window.debugOverlay.drawOverlay === 'function') {
    try {
      window.debugOverlay.drawOverlay(document.getElementById('cmcanvas'), imagesForSaving, aLayers);
    } catch (err) {
      console.error('debugOverlay draw error', err);
    }
  }
}

var lastAutoSave = "";
function autoSave(layers) {
  // Create a saveable copy of layers where block layers use `src` instead of numeric `iNum`.
  let saveLayers = [];
  for (let layer of layers) {
    // shallow copy to avoid mutating in-memory layer objects
    let copy = {};
    for (let k in layer) copy[k] = layer[k];
    if (copy.type === "block") {
      if ((copy.iNum !== undefined) && (copy.iNum !== null) && (copy.iNum !== -1)) {
        let idx = resolveBlockIndex(copy.iNum);
        if ((idx !== -1) && blockList[idx] && blockList[idx].src) {
          copy.src = blockList[idx].src;
        }
      }
      // remove numeric index to make saved data index-independent
      delete copy.iNum;
    }
    saveLayers.push(copy);
  }

  lastAutoSave = projectDataToJson(saveLayers);
  try {
    if (typeof(Storage) !== "undefined") {
      localStorage.setItem("autosave", lastAutoSave);
    }

  } catch (error) {
    window.alert("Error with autosave");
  }
}

const arAlt = {
  width: ["height", "lar"],
  height: ["width", "lar"],
  swidth: ["sheight", "slar"],
  sheight: ["swidth", "slar"]
};

function updateValue(th) {
  // called after user updates a value
  // OR after user select preset (reloading==true, in this case)
  let layer = th.parentNode.parentNode.parentNode.parentNode;
  let layerName = layer.id;
  let fieldName = th.id.slice(5);
  if (th.type == "number") {
    let newValue =  Number(th.value);
    // deal with group moves
    if ((fieldName == "x") || (fieldName == "y")) {
      // check if part of group
      if (layer.getElementsByClassName("groupcheck")[0].checked) {
        // adjust all other members of group by same amount
        let thisgroup = document.getElementsByClassName("groupcheck");
        let diff = newValue - aLayers[layerName][fieldName];
        for (let x=0; x < thisgroup.length; x++) {
          if (!thisgroup[x].checked) continue;
          let groupLayerId = thisgroup[x].parentNode.id;
          aLayers[groupLayerId][fieldName] += diff;
        }
      }
    }
    if (arAlt[fieldName] && !reloading && (aLayers[layerName].type != "text")) {
      // it is width/height/swidth/sheight field
      if (document.getElementById(arAlt[fieldName][1]).checked) {
        // lar or slar (as appropriate) is checked
        // compute otherValue (e.g. if fieldname = width, otherValue = newValue * height/width)
        let otherValue = newValue * aLayers[layerName][arAlt[fieldName][0]] / aLayers[layerName][fieldName];
        otherValue = Math.round(otherValue * 1000) / 1000;
        if ((otherValue) && (Math.abs(otherValue - Math.round(otherValue)) < 0.01)) otherValue = Math.round(otherValue);
        aLayers[layerName][arAlt[fieldName][0]] = otherValue;
        document.getElementById("input" + arAlt[fieldName][0]).value = otherValue;
      }
    }
    aLayers[layerName][fieldName] = newValue;
  } else if (th.type == "checkbox") {
    aLayers[layerName][fieldName] = th.checked;
  } else {
    if (th.id == "inputfont") {
      aLayers[layerName].filename = fontList[th.value];
    }
    aLayers[layerName][fieldName] = th.value;
  }
  drawProject();
}


function setPresets(th){
  let selVal = document.getElementById("presets").value;
  if (!selVal) return;
  let sel = Number(selVal.slice(9));
  let layerDom = th.parentNode.parentNode.parentNode.parentNode;
  let layer = aLayers[layerDom.id];

  let dName = "";
  if (layer.type == "block") {
    let a = layer.iNum;
    let b = blockList[a];
    dName = b.putUnder;
  } else if (layer.type == "text") {
    dName = "text";
  } else if (layer.type == "production") {
    dName = "production";
  }

  if (dName) {
    reloading = true;
    for (let v in blockDefaults[dName][sel]) {
      // fill in presets
      if (v == "label") continue;
      document.getElementById("input" + v).value = blockDefaults[dName][sel][v];
      if (dName == "tiles") {
        reloading = false;
      }
      updateValue(document.getElementById("input" + v));
    }
    if (dName == "templates") {
      aLayers["dragdropdiv0"].height = blockDefaults[dName][sel].height;
      aLayers["dragdropdiv0"].width = blockDefaults[dName][sel].width;
    }
    reloading = false;
  }
  drawProject();
}

function onBlockLoad() {
  console.log("onBlockLoad: loaded", this.dataindex, blockList[this.dataindex] && blockList[this.dataindex].src, this.src);
  if (blockList[this.dataindex].hidden) {
    // hidden images don't get menu items
    hiddenImage[blockList[this.dataindex].text] = this.dataindex;
  } else {
    let tmpText = blockList[this.dataindex].text;
    if (!tmpText) {
      tmpText = blockList[this.dataindex].src;
      tmpText = tmpText.replace(/_/g, ' ');
      tmpText = tmpText.replace(tmpText.charAt(0), tmpText.charAt(0).toUpperCase());
      blockList[this.dataindex].text = tmpText;
    }
    // add menu item for image
    // <a onclick="addBlock('template:green')" href="#" class="w3-bar-item w3-button">Green Card</a>
    if (!document.getElementById("image" + this.dataindex)) {
      let toAdd = document.createElement("a");
      toAdd.onclick = addBlock;
      toAdd.innerText = tmpText;
      toAdd.classList.add("w3-bar-item");
      toAdd.classList.add("w3-button");
      toAdd.href = "#";
      toAdd.id = "image" + this.dataindex;
      document.getElementById(blockList[this.dataindex].putUnder).appendChild(toAdd);
      if (blockList[this.dataindex].putUnder == "templates") {
        // add Super Templates
        toAdd = document.createElement("a");
        toAdd.onclick = addMegaTemplate;
        toAdd.innerText = tmpText;
        toAdd.classList.add("w3-bar-item");
        toAdd.classList.add("w3-button");
        toAdd.href = "#";
        toAdd.id = "mega" + blockList[this.dataindex].src;
        document.getElementById("fromTemplate").appendChild(toAdd);
      }
    }
  }
  // numLoaded++;
  // document.getElementById("files").value = numLoaded;
  // if (numLoaded == maxToLoad) {
  //   allLoadingDone();
  // }
  for (let l in aLayers) {
    if ((aLayers[l].type == "block") && (aLayers[l].iNum == this.dataindex)) {
      let imgW = blockList[this.dataindex].obj.width;
      let imgH = blockList[this.dataindex].obj.height;
      // scale so the largest side is at most 100px (preserve aspect ratio)
      let scale = Math.min(1, 100 / Math.max(imgW, imgH));
      let scaledW = Math.max(1, Math.round(imgW * scale));
      let scaledH = Math.max(1, Math.round(imgH * scale));

      // Apply scaled size for layers that are using the placeholder/default
      // dimensions (we use height==100 as our placeholder indicator), or
      // when neither dimension was set.
      if ((!aLayers[l].width && !aLayers[l].height) || (aLayers[l].height === 100 && !aLayers[l].width)) {
        aLayers[l].width = scaledW;
        aLayers[l].height = scaledH;
      } else if (!aLayers[l].width && aLayers[l].height) {
        // compute width to preserve aspect ratio for given height
        aLayers[l].width = Math.round(imgW * aLayers[l].height / imgH);
        // if computed width exceeds 100, scale down to max 100
        if (aLayers[l].width > 100 && aLayers[l].height <= 100) {
          let s = 100 / aLayers[l].width;
          aLayers[l].width = Math.round(aLayers[l].width * s);
          aLayers[l].height = Math.round(aLayers[l].height * s);
        }
      } else if (aLayers[l].width && !aLayers[l].height) {
        // compute height to preserve aspect ratio for given width
        aLayers[l].height = Math.round(imgH * aLayers[l].width / imgW);
        if (aLayers[l].height > 100 && aLayers[l].width <= 100) {
          let s = 100 / aLayers[l].height;
          aLayers[l].width = Math.round(aLayers[l].width * s);
          aLayers[l].height = Math.round(aLayers[l].height * s);
        }
      }
    }
  }
  drawProject();
}

var reloading = false;

function allLoadingDone(loadautosave) {
  document.getElementById("loadprogress").style.display = "none";
  document.getElementById("cmcanvas").style.display = "block";
  try {
    if (loadautosave) {
      loadFrom(JSON.parse(localStorage.getItem("autosave")), true);
    } else {
      drawProject();
    }
  } catch (error) {
    // no autosave file
  }
}

function loadFrom(saved, autoload) {
  // load autosave file
  reloading = true;
  unreloadable = false;
  let resize = false;
  let scale = {x:1, y:1, width:1, height:1};
  try {
    for (let layer of saved) {
      let ignore = ["type", "params"];
      let newLayer = {};
      switch (layer.type) {
        case "block":
        case "text":
        case "production":
        case "effect":
        case "line":
          if (layer.type == "block") {
            // support saved projects using numeric iNum or src string
            let blockRef;
            if ((layer.src !== undefined) && (layer.src !== null)) {
              blockRef = layer.src;
            } else if (typeof layer.iNum === 'number') {
              blockRef = layer.iNum;
            } else {
              blockRef = layer.iNum || layer.src;
            }
            newLayer = addBlock(blockRef);
            // don't copy saved index or src over the runtime layer
            ignore.push("iNum");
            ignore.push("src");
          } else if (layer.type == "text") {
            if (layer.filename  && !fontList[layer.font]) {
              // this font has not been reloaded
              loadFont(layer.filename);
            }
            newLayer = addTextBox(layer.data);
          // } else if (layer.type == "effect") {
          //   newLayer = addEffectBox();
          // } else if (layer.type == "line") {
          //   newLayer = addLine();
          } else {
            newLayer = type2FuncList[layer.type]();
          //   newLayer = addProduction();
          }

          for (let key in layer) {
            if (ignore.indexOf(key) != -1) continue;
            if (scale[key]) {
              newLayer[key] = scale[key] * layer[key];
            } else {
              newLayer[key] = layer[key];
            }
          }
          break;
        // case "group":
        //   addLayer(layer.name, layer);
        //   break;
        case "embedded":
          if (autoload) {unreloadable=true; break};
          if (layer.name) {
            addLayer(layer.name, layer);
          } else {
            addLayer("embed" + layer.iNum, layer);
          }
          break;

        case "webFile":
          reloadWebImage(layer.filename);
          layer.iNum = -1;
          addLayer("Web:" + layer.filename, layer);
          break;
        case "userFile":
          if (autoload) {unreloadable=true; break};
          layer.iNum = -1;
          addLayer("Local:" + layer.filename, layer);
          //newLayer = addUserFile(layer);
          break;
        case "base":
          newLayer = aLayers.dragdropdiv0;
          for (let key in layer) {
            if (ignore.indexOf(key) != -1) continue;
            newLayer[key] = layer[key];
            if (layer[key] == 1050) {
              if (confirm("Looks like data saved at old size. Do you want to automatically resize?")) {
                resize = true;
                newLayer.height = 1126;
                newLayer.width = 826;
                scale.x = 826 / 750;
                scale.width = scale.x;
                scale.y = 1126 / 1050;
                scale.height = scale.y;
                break;
              }
            }
          }
          break;

        default:
          window.alert("Invalid layer type:" + layer.type);
          break;
      }
      if (layer.name) {
        document.getElementById("layername" + (ddcount-1)).value = layer.name;
      }
    }
  } catch (error) {
  }
  if (unreloadable) window.alert("User local files not reloaded. You must do this manually.");
  reloading = false;
  drawProject();

}

type2FuncList.block = addBlock;

function addBlock(th) {
  let layer = {type:"block", name:"", iNum:0, x:0, y:0, width:0, height:0, params:"allimages"};
  let myIndex = 0;
  if ((typeof th == "number")) {
    myIndex = th;
  } else if (typeof th == "string") {
    // if string is numeric, convert, otherwise resolve by src/text
    myIndex = resolveBlockIndex(th);
    if (myIndex == -1) myIndex = this.id ? this.id.slice(5) : 0;
  } else {
    myIndex = this.id ? this.id.slice(5) : 0;
  }
  layer.iNum = Number(myIndex);
  let thisBlock = blockList[layer.iNum];
  if (thisBlock.otherbg) {
    layer.params += " " + thisBlock.otherbg;
    layer.obg = false;
  }
  if (blockDefaults[thisBlock.putUnder]) {
    layer.params += " allpreset";
  }
  // layer.width = thisBlock.obj.width;
  // layer.height = thisBlock.obj.height;
  let newLayer = addLayer(thisBlock.text, layer);
  // If the image is already loaded and complete, use its real size.
  // Otherwise, start loading it and give the layer a sensible default size
  // so it can be clicked/dragged immediately. onBlockLoad() will update
  // the real dimensions once the image finishes loading.
  if (thisBlock.obj && thisBlock.obj.complete) {
    if (!newLayer.width) newLayer.width = thisBlock.obj.width;
    if (!newLayer.height) newLayer.height = thisBlock.obj.height;
  } else {
    // Trigger loading (this will replace blockList[i].obj when loaded).
    fetchBlock(layer.iNum);
    // Set only a default height so we can maintain the image's aspect
    // ratio when the real image finishes loading. onBlockLoad() will
    // compute the missing dimension.
    if (!newLayer.height) newLayer.height = 100;
    // leave width undefined so onBlockLoad can compute it proportionally
  }
  drawProject();

  return newLayer;
}

function addMegaTemplate() {
  if (!confirm("All current data will be discarded. Continue?")) return;
  if (this.id.slice(0,4) != "mega") return;
  let mega = this.id.slice(4);
  if (!megaTemplates[mega]) return;
  document.getElementById("layerlist").innerHTML = "";
  ddcount = 0;
  aLayers = {};
  addLayer("Base",{type:"base", color:"#ffffff", height:1126, width:826, params:"color"});
  loadFrom(megaTemplates[mega].layers);
}

type2FuncList.text = addTextBox;

function addTextBox(th) {
  let layer = {type:"text", data:"", x:0, y:0, width:110, height:21,
              color: "#000000",
              font:"Prototype", style:"normal", weight:"normal", lineSpace:4, justify:"center",
              params:"allimages color alltext allpreset"};
  if ((typeof th == "string") || (typeof th == "number")) {
    layer.data = th;
  } else {
    layer.data = "Replace this text!";
  }
  let c = document.getElementById("cmcanvas");
  layer.x = Math.round(c.width/2);
  layer.y = Math.round(c.height/2);
  layer.width = c.width;
  let newLayer = addLayer("Text:" + layer.data.substr(0,10), layer);
  drawProject();
  return newLayer;
}

var mostRecentFile = {};
function addUserFile(th) {
  if (!th.value) return;
  try {
    let file = th.files[0];
    // Check if the file is an image.
    if (file.type && file.type.indexOf('image') === -1) {
      window.alert('File is not an image.');
      return;
    }
      // load a local file
      mostRecentFile = file;
      const reader = new FileReader();
      reader.addEventListener('load', function() {
        let newI = new Image();
        newI.onload = userImageLoaded;
        newI.src = reader.result;
        newI.crossOrigin = "Anonymous";
      });
      reader.readAsDataURL(file);

  } catch (error) {
    projectLoad = false;
    window.alert("Something went wrong loading file.")
  }
  th.value = "";
}

function getImageFromUrl(url, callback) {
  var img = new Image();
  img.setAttribute('crossOrigin', 'anonymous');
  img.onload = function (a) {
  var canvas = document.createElement("canvas");
  canvas.width = this.width;
  canvas.height = this.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(this, 0, 0);

  var dataURI = canvas.toDataURL("image/jpg");

  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return callback(new Blob([ia], { type: mimeString }));
  }

  img.src = url;
}

function loadInitialProject(url) {
  projectLoad = true;
  try {
      getImageFromUrl(url, function (blobImage) {
        const reader = new FileReader();
        reader.addEventListener('load', function() {
          let newI = new Image();
          newI.onload = userImageLoaded;
          newI.src = reader.result;
          newI.crossOrigin = "Anonymous";
        });
        reader.readAsDataURL(blobImage);
      });
  } catch (error) {
    projectLoad = false;
    window.alert("Something went wrong loading initial project." + error)
  }
}

var oLoadedProject;

function userImageLoaded() {
  // this = image object
  if (projectLoad) {
    // verify image is a project (we support)
    try {
      let c = document.getElementById("cmcanvas");
      let ctx = c.getContext("2d");
      // set canvas size to hold image
      c.width = this.width;
      c.height = this.height;
      // put image on canvas
      ctx.drawImage(this, 0, 0);
      oLoadedProject = this;

      // need to wait until canvas drawn
      setTimeout(function(){
        // now we can access the image
        let c = document.getElementById("cmcanvas");
        let ctx = c.getContext("2d");
        let imgData = ctx.getImageData(0,0,c.width,c.height);
        let tmp = "tm_cmV01";
        let p = 0;

        let ob = array2string(imgData.data, p, 8);
        if (ob.str != tmp) throw "project";
        p = ob.pos;

        // get image pos data
        ob = array2string(imgData.data, p, 0);
        let posStr = ob.str;
        p = ob.pos;

        // get layer data
        ob = array2string(imgData.data, p, 0);
        let layerStr = ob.str;
        //p = ob.pos;

        // parse pos data and extract images
        let pos=JSON.parse(posStr);
        // if (pos.length) window.alert("User files not yet supported. :(");
        let aCanvases = [];
        for (let i=0; i<pos.length; i++) {
          // draw images on new canvases, use canvas{i} for each
          // later we could retrieve 'i' if needed
          let cvs = document.createElement("CANVAS");
          cvs.id = "canvas" + i;
          cvs.width = pos[i].width;
          cvs.height = pos[i].height;
          let nctx = cvs.getContext("2d");
          nctx.drawImage(oLoadedProject, pos[i].x, pos[i].y, pos[i].width, pos[i].height, 0, 0, pos[i].width, pos[i].height);
          // add cvs to DOM (needed, I think, or they won't draw)
          //document.getElementById("xcanvases").appendChild(cvs);
          aCanvases.push(cvs);

          // TBD put canvases into a temporary array
          // when we first try to draw them, we will pull them out in the order they went in.

          // // use setTimeout to ensure image is drawn before we extract it
          // setTimeout(function (oCvs, num) {
          //   // oCvs is canvas object
          //   // num should match up with iNum of save layer
          //   userImageList[num] = oCvs.toDataURL("image/png");
          //   // disappear this canvas
          //   oCvs.style.display = "none";
          // },0,cvs, i);
          // TBD
        }

        // parse layer data
        let newLayers = JSON.parse(layerStr);
        for (let i=0; i < newLayers.length; i++) {
          // update dragdropdiv0 and remove that newLayer (if it existed)
          let layer;
          if ((newLayers[0].type == "base") && (aLayers["dragdropdiv0"])) {
            layer = aLayers["dragdropdiv0"];
            layer.width = newLayers[0].width;
            layer.height = newLayers[0].height;
            layer.color = newLayers[0].color;
            newLayers.shift();
          }
          // normally userFile cannot reload but here we have userFile data embedded
          // so change from userFile to embedded if needed
          if ((newLayers[i].type == "userFile") || (newLayers[i].type == "embedded")) {
            newLayers[i].iNum = userImageList.length;
            // set iNum above to point to canvas we add to userImageList below
            userImageList.push(aCanvases.shift());
            newLayers[i].type = "embedded";
          }
        }
        // load the rest of newLayers using loadFrom
        loadFrom(newLayers);
        projectLoad = false;
        // redraw project
        setTimeout(drawProject, 100);
      }, 50);


    } catch (error) {
      // end up here for a variety of reasons
      projectLoad = false;
      if (error == "project") {
        // doesn't look like a project file, or one we support
      } else {
        // probably a JSON parse error, just call it parse error
      }

    }


    // TBD
  } else {
    let layer = {type:"userFile", iNum:0,
      x:0, y:0, width:1, height:1,
      alpha:100,
      sx:0, sy:0, swidth:0, sheight:0, params:"allimages clipimages"};
    layer.iNum = userImageList.length;
    layer.filename = mostRecentFile.name;
    layer.width = this.width;
    layer.height = this.height;
    layer.swidth = this.width;
    layer.sheight = this.height;

    userImageList.push(this);
    let newLayer = addLayer("Local:" + layer.filename, layer);
    drawProject();
  }
}

function array2string(arr, aPos, len) {
  // convert part of array to string of length len(if len is 0, it is a zero terminated string)
  // start at array position pos
  let str = "";
  let pos = aPos;
  do {
    let n = 0;
    for (let j=0; j < 8; j++) {
      if (pos % 4 == 3) pos++;
      let v = arr[pos];
      if (v > 127) {
        n |= 1 << j;
      }
      pos++;
    }
    if (!n) break;
    str += String.fromCharCode(n);
  } while (str.length != len);
  return {str:str, pos:pos};
}

function string2array(str, arr, aPos, zeroTerminate) {
  // assume array is a image data array
  let pos=aPos;
  for (let i=0; i < str.length; i++) {
    for (let j=0; j < 8; j++) {
      if (pos % 4 == 3) pos++;
      arr[pos] = (str.charCodeAt(i) & (1 << j)) ? 0xff : 0;
      pos++;
    }
  }
  if (pos % 4 == 3) pos++;
  if (zeroTerminate) {
    for (let j=0; j < 8; j++) {
      if (pos % 4 == 3) pos++;
      arr[pos] = 0;
      pos++;
    }
  }
  return pos;
}

type2FuncList.production = addProduction;

function addProduction() {
  let layer = {type:"production", x:200, y:643, width:130, height:130,
              params:"allimages allpreset"};
  let newLayer = addLayer("Production", layer);
  let thisBlock = blockList[hiddenImage["prod_nxn"]];
  if (thisBlock.obj) {
    drawProject();
  } else {
    fetchBlock(hiddenImage["prod_nxn"]);
  }
  return newLayer;
}

type2FuncList.effect = addEffectBox;

function addEffectBox() {
  let layer = {type:"effect", x:600, y:300, width:400, height:300,
              params:"allimages allpreset"};
  let newLayer = addLayer("Effect Box", layer);
  drawProject();
  return newLayer;
}

function addEmbed() {
  let layer = {type:"embedded", iNum:-1,
    x:0, y:0, width:1, height:1,
    alpha:100,
    sx:0, sy:0, swidth:0, sheight:0, params:"allimages clipimages"};
  layer.iNum = userImageList.length;
  layer.filename = th.src;
  layer.width = th.width;
  layer.height = th.height;
  layer.swidth = th.width;
  layer.sheight = th.height;

  userImageList.push(th);
  let newLayer = addLayer("Web image", layer);

}

type2FuncList.line = addLine;

function addLine() {
  let layer = {type:"line", x:0, y:0, width:2, angle:0, len:100, color:"#000000",
              opacity:1, params:"allangle alllen allpreset allcolor"};
  let newLayer = addLayer("Line", layer);
  drawProject();
  return newLayer;
}

function copyToClipboard() {
  let str = localStorage.getItem("autosave");
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

function clickLoadFont() {
  let o = document.getElementById("fontoverlay");
  if (o.classList.contains("w3-nodisplay")) {
    o.classList.remove("w3-nodisplay");
    o.classList.add("w3-display");
  } else {
    o.classList.remove("w3-display");
    o.classList.add("w3-nodisplay");
  }
}

function loadSpecifiedFont() {
  let url = document.getElementById("fonturl2load").value;

  let o = document.getElementById("fontoverlay");
  o.classList.remove("w3-display");
  o.classList.add("w3-nodisplay");

  loadFont(url);
}

function loadFont(url) {
  // <link href="https://fonts.googleapis.com/css2?family=Turret+Road:wght@400;700;800&display=swap" rel="stylesheet">
  // <link href="https://fonts.googleapis.com/css2?family=Turret+Road&display=swap" rel="stylesheet">

  if (!url.startsWith("http")) {
    let httpPos = url.indexOf('http');
    if (httpPos > 0) {
      // assume url enclosed on double or single quotes
      // extract url start from http, end at char before close quote
      url = url.slice(httpPos, url.indexOf(url.charAt(httpPos-1),httpPos));
    }
  }
  let domLink = document.createElement("link");
  domLink.href = url;
  domLink.rel = "stylesheet";
  document.body.appendChild(domLink);

  // <span style="float: right;">Font:<select id="inputfont" type="select" onchange="updateValue(this)">
  // <option value="Prototype" style="font-family: Prototype;" default>Prototype</option>
  let fontName = url.slice(url.indexOf('family=')+7);
  fontName = fontName.replace(/["&]/g,":"); // change " or & to :
  fontName = fontName.slice(0,fontName.indexOf(":")); // now use : to find end of name
  fontName = fontName.replace(/[+]/g, " ");
  let domOpt = document.createElement("option");
  domOpt.value = fontName;
  domOpt.style.fontFamily = fontName;
  domOpt.innerText = fontName;
  fontList[fontName] = url;

  domInputfont.appendChild(domOpt);

  return;
}

function clickLoadWebImage() {
  let o = document.getElementById("overlay");
  if (o.classList.contains("w3-nodisplay")) {
    o.classList.remove("w3-nodisplay");
    o.classList.add("w3-display");
  } else {
    o.classList.remove("w3-display");
    o.classList.add("w3-nodisplay");
  }
}

function loadWebImage() {
  let url = document.getElementById("url2load").value;
  let img = new Image();
  img.onload = function () {
      webImageLoaded(img);
  };
  img.src = url;
  img.crossOrigin = "Anonymous";
  let o = document.getElementById("overlay");
  o.classList.remove("w3-display");
  o.classList.add("w3-nodisplay");
}

function webImageLoaded(th) {
  // th = image object
  let layer = {type:"webFile", iNum:0,
    x:0, y:0, width:1, height:1,
    alpha:100,
    sx:0, sy:0, swidth:0, sheight:0, params:"allimages clipimages"};
  layer.iNum = userImageList.length;
  layer.filename = th.src;
  layer.width = th.width;
  layer.height = th.height;
  layer.swidth = th.width;
  layer.sheight = th.height;

  userImageList.push(th);
  let newLayer = addLayer("Web image", layer);
  drawProject();
}

function reloadWebImage(url) {
  let img = new Image();
  img.onload = function () {
      webImageReloaded(img);
  };
  img.src = url;
  img.crossOrigin = "Anonymous";
}

function webImageReloaded(th) {
  // th = image object
  let iNum = userImageList.length;
  userImageList.push(th);

  for (let l in aLayers) {
    let thisLayer = aLayers[l];
    if ((thisLayer.type == "webFile") && (thisLayer.filename == th.src)) {
      if (thisLayer.iNum == -1) {
        thisLayer.iNum = iNum;
      }
    }
  }

  drawProject();
}

function cancelOverlay() {
  let o = document.getElementById("overlay");
  o.classList.remove("w3-show");
  o.classList.add("w3-hide");
}

function cancelFontOverlay() {
  let o = document.getElementById("fontoverlay");
  o.classList.remove("w3-show");
  o.classList.add("w3-hide");
}

function clickNew() {
  if (confirm("Delete current work and start fresh?")) resetProject(false);
}

function clickLoadNewProject() {
  if (confirm("Delete current work and start fresh?")) {
    resetProject(false);
    clickLoadProject();
  }
}

var extraRows = 0;
var oldHeight = 0;

var projectLoad = false;

function clickLoadProject() {
  projectLoad = true;
  // following click eventually runs addUserFile()
  document.getElementById('fileselection').click();
}

function projectDataToJson(data) {
  let jsonStr = JSON.stringify(data)
  return jsonStr.replace(/[\u007F-\uFFFF]/g, function(chr) {
    return "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substr(-4)
  })
}

function clickSaveProject() {
  // make array of user images
  let layerDivs = document.getElementsByClassName("divRec");
  let imagesForSaving = [];
  for (let i=0; i < layerDivs.length; i++) {
    let layer = aLayers[layerDivs[i].id];
    if ((layer.type != "userFile") && (layer.type != "embedded")) continue;
    imagesForSaving.push(userImageList[layer.iNum]);
  }
  // if no images, assume canvas of 200x200
  let imgData = {container:{width:200,height:200}, pos:[]};
  // if 1+ image, run fitImages and assume canvas of max(height,200) x max(width,200);
  if (imagesForSaving.length) {
    imgData = fitImages(imagesForSaving, 200);
    if (imgData.container.width < 200) imgData.container.width=200;
    if (imgData.container.height < 200) imgData.container.height=200;
    for (let i=0; i < imagesForSaving.length; i++) {
      imgData.pos[i].width = imagesForSaving[i].width;
      imgData.pos[i].height = imagesForSaving[i].height;
    }
  }
  // determine number of extra rows, add this value to all pos.y values returned from fitImages
  // currently our storeage is 2 bytes per pixel (4 worked but BGG does something that ruins it)
  let posStr = projectDataToJson(imgData.pos);
  extraRows = Math.ceil(8 + (lastAutoSave.length + posStr.length + 10) / .375 / imgData.container.width);
  for (let i=0; i < imgData.pos.length; i++) {
    imgData.pos[i].y += extraRows;
  }
  posStr = projectDataToJson(imgData.pos);
  // NOTE: we are making the not so crazy judgement that changing the pos.y data will not increase
  //  posStr by much and certainly nothing near the minimum 600+ bytes
  //  (8 extra height * 200 (min) * .375 byte per pixel) we have available.
  // make canvas assumed.height+extrarows x assumed.width
  let c = document.getElementById("cmcanvas");
  let ctx = c.getContext("2d");
  c.height = imgData.container.height + extraRows;
  c.width = imgData.container.width;

  // insert JSON and other data
  let tmp = "tm_cmV01";
  let imgPlus = ctx.createImageData(imgData.container.width, extraRows);
  imgPlus.data.fill(255);
  let p = 0;
  // insert our 8 byte signature
  p = string2array(tmp,imgPlus.data,p,false);
  // insert image pos data
  p = string2array(posStr, imgPlus.data, p, true);
  // insert layer info
  p = string2array(lastAutoSave, imgPlus.data, p, true);
  // and put that onto the canvas
  ctx.putImageData(imgPlus, 0, 0);

  // insert images at their pos.x/y locations
  for (let i=0; i < imgData.pos.length; i++) {
    let layer = imagesForSaving[i];
    let pos = imgData.pos[i];
    ctx.drawImage(layer,pos.x,pos.y);
  }

  // allow time for drawing then prompt for save
  setTimeout(saveProjectCont,100, true) ;


  // figure out how much extra height we need (assume UTF-8)
  // oldHeight = h;
  // c.height = h+extraRows;
  // drawProject(true);
}

function saveProjectCont(need2wait) {
  let c = document.getElementById("cmcanvas");

  let projectlink = document.getElementById('projectlink');
  projectlink.setAttribute('download', 'cardMaker.png');
  projectlink.setAttribute('href', c.toDataURL("image/png").replace("image/png", "image/octet-stream"));
  projectlink.click();
  if (need2wait) saveDone();
}

function saveDone() {
  let ans = confirm("Click when done.");
  if (ans || !ans) {
      let c = document.getElementById("cmcanvas");
    c.height = c.height-extraRows;
    extraRows = 0;
    drawProject();

  }
}

function groupModeToggle() {
  let c = document.getElementsByClassName("groupcheck");
  for (let l=0; l < c.length; l++) {
    if (document.getElementById("groupmode").checked) {
      // turn on group check box
      c[l].classList.add("w3-show-inline-block");
      c[l].classList.remove("w3-hide");
      // make sure they are all unchecked
      c[l].checked = false;
    } else {
      c[l].classList.remove("w3-show-inline-block");
      c[l].classList.add("w3-hide");
      // make sure they are all unchecked
      c[l].checked = false;
    }
  }
}

// function clickMakeGroup() {
//   let c = document.getElementsByClassName("groupcheck");
//   let ch = [];
//   let gap = false;
//   for (let l=0; l < c.length; l++) {
//     if (c[l].checked) {
//       if (gap) {
//         // only true is found checked box after unchecked box after checked box
//         window.alert("Error:Group layers must be contiguous.");
//         return;
//       } else {
//         ch.push(c[l].parentNode.id);
//       }
//     } else if (ch.length) {
//       gap = true; // found unchecked box after checked box
//     }
//   }
//   if (ch.length < 2) return;
//   // make ch into a group
//   let layer = {type:"group", name:"", groupNum:0, params:""};
//   layer.groupNum = groupList.length;
//   layer.name = "Group:" + layer.groupNum;
//   let newLayer = addLayer("Group:" + layer.groupNum, layer);
//   for (let l=0; l < ch.length; l++) {
//     aLayers[ch[l]].group = layer.groupNum;
//   }

//   return newLayer;
// }

// function clickUngroup() {

// }

// Accordion
function myAccFunc(acc) {
  removeKeyInputFocus()
  var x = document.getElementById(acc);
  if (x.classList.contains("w3-hide")) {
    x.classList.remove("w3-hide");
    // if any div siblings are showing, hide them
    let showDivs = x.parentNode.getElementsByClassName("w3-show");
    for (let x=showDivs.length-1; x >= 0; x--) {

      showDivs[x].classList.add("w3-hide");
      showDivs[x].classList.remove("w3-show");
    }
    x.classList.add("w3-show");
  } else {
    x.classList.add("w3-hide");
    x.classList.remove("w3-show");
  }
}

// Open and close sidebar
function w3_open() {
  document.getElementById("mySidebar").style.display = "block";
  document.getElementById("myOverlay").style.display = "block";
}

function w3_close() {
  document.getElementById("mySidebar").style.display = "none";
  document.getElementById("myOverlay").style.display = "none";
}

// drag/drop stuff
function sortable(section, onUpdate){
  var dragEl, nextEl, newPos;
  var dragRect;

  let oldPos = [...section.children].map(item => {
    if (item.id != "dragdropdiv0") item.draggable = true;
    let pos = document.getElementById(item.id).getBoundingClientRect();
    // let pos = item.getBoundingClientRect();
    return pos;
  });

  function _onDragOver(e){

      let selectedDoms = document.getElementsByClassName("selected");
      for (let i=selectedDoms.length-1; i >= 0; i--) {
        selectedDoms[i].removeChild(domParams);
        selectedDoms[i].classList.remove("selected");
      }
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      var target = e.target;
      if( target && target !== dragEl && target.nodeName == 'DIV' ){
        if(target.classList.contains('inside')) {
          e.stopPropagation();
        } else {
          //getBoundingClientRect contains location-info about the element (relative to the viewport)
          var targetPos = target.getBoundingClientRect();
          // if dragging higher, put element before target
          // if dragging lower, put element after target (i.e. before target.nextSibling)
          if (targetPos.top < dragRect.top) {
            if (target.id == "dragdropdiv0") return;
            section.insertBefore(dragEl, target);
          } else {
            section.insertBefore(dragEl, target.nextSibling);
          }

        }
      }
  }

  function _onDragEnd(evt){
      evt.preventDefault();
      newPos = [...section.children].map(child => {
           let pos = document.getElementById(child.id).getBoundingClientRect();
          //  let pos = child.getBoundingClientRect();
           return pos;
         });
      dragEl.classList.remove('ghost');
      section.removeEventListener('dragover', _onDragOver, false);
      section.removeEventListener('dragend', _onDragEnd, false);

      nextEl !== dragEl.nextSibling ? onUpdate(dragEl) : false;

      drawProject();
  }

    section.addEventListener('dragstart', function(e){
      dragEl = e.target;
      dragRect = dragEl.getBoundingClientRect();
      nextEl = dragEl.nextSibling;

      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('Text', dragEl.textContent);

      section.addEventListener('dragover', _onDragOver, false);
      section.addEventListener('dragend', _onDragEnd, false);

      setTimeout(function (){
          dragEl.classList.add('ghost');
      }, 0)

  });
}

function getMousePos(event) {
    let c = document.getElementById("cmcanvas");
    var rect = c.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
}

function dragStart(event) {
    var mouse = getMousePos(event);

    // Collision detection between clicked offset and element.
    let layerDivs = document.getElementsByClassName("divRec");
    for (let i=layerDivs.length - 1; i >= 0; i--) {
      let layer = aLayers[layerDivs[i].id];
      if (clickIsWithinLayer(layer, mouse.x, mouse.y)) {
        // Select the corresponding layer in the properties panel.
        // `selectLayer` expects to be called with the `.inside` element as `this`.
        let inside = document.getElementById(layerDivs[i].id).getElementsByClassName('inside')[0];
        if (inside) {
          selectLayer.call(inside);
        } else {
          selectLayer();
        }
        layerToDrag = layer;
        focusKeyInput(layer);
        dragOffsetX = layer.x - mouse.x;
        dragOffsetY = layer.y - mouse.y;
        return;
      }
    }
}

// Check to see if the given coordinates are within the specified layer
//
// Block objects are anchored at the upper left, and may contain
// transparent areas:
//
//    O-----------+
//    |     .     |
//    |   .....   |
//    | ......... |
//    | ......... |
//    | ......... |
//    |   .....   |
//    |     .     |
//    +-----------+
//
// For these sorts of layers, we can first check to see whether the
// point is within the bounding rectangle, and then check to see if
// the pixel under the point is transparent or not.
//
// Text layers do not lie within their bounding box. The width
// of the bounding box is used to determine where text should wrap,
// and the height of the bounding box controls the font size. The
// anchor is on the baseline of the text. Text layers therefore
// look something like this:
//
// Left-justified:
//
//                     THIS IS SOME TEXT
//                     O--------------------+
//                     +--------------------+
//
// Centered:
//
//             THIS IS SOME TEXT
//                     O--------------------+
//                     +--------------------+
//
// Right-justified:
//
//    THIS IS SOME TEXT
//                     O--------------------+
//                     +--------------------+
//
// Multi-line text layers will vertically overlap with the
// bounding box on the second line only, with the third and
// subsequent lines lying below the bounding box. To do hit
// testing on text, then, we replicate the word-wrapping
// algorithm and calculate a bounding rectangle for each line
// individually, checkin each one until a hit is found.
//
// For all other layer types, the bounding box is used as specified.
function clickIsWithinLayer(layer, x, y) {
  let c = document.getElementById("cmcanvas");
  let ctx = c.getContext("2d");

  // Check to see if we are inside the text bounding box of a text layer
  // n.b. Text is rendered just above the bounding box (bug?).
  if (layer.type == 'text') {
    return clickIsWithinText(layer, x - layer.x, (y - layer.y) + layer.height);
  }

  // If the x,y is not inside the bounding box, then it's definitely a miss
  if (y < layer.y || y > layer.y + layer.height
          || x < layer.x || x > layer.x + layer.width) {
    return false;
  }

  // If the click hits a transparent area, then count it as a miss
  if (clickIsWithinTransparentArea(layer, x - layer.x, y - layer.y)) {
    return false;
  }

  // If the click hasn't been found to be outside the area, then it is inside.
  return true;
}

function clickIsWithinTransparentArea(layer, x, y) {
  if ((layer.type != "block") || (!blockList[layer.iNum].obj.complete)) {
    console.log(layer);
    return false;
  }

  try {
    var ctx = document.createElement("canvas").getContext("2d");
    ctx.drawImage(blockList[layer.iNum].obj, 0, 0, layer.width, layer.height);
    alpha = ctx.getImageData(x, y, 1, 1).data[3]; // [0]R [1]G [2]B [3]A

    return alpha === 0;
  } catch (error) {
    // https://stackoverflow.com/questions/16217521/i-get-a-canvas-has-been-tainted-error-in-chrome-but-not-in-ff/16218015#16218015
    return false;
  }
}

// This function is a copy of the text-wrapping algorithm in drawProject()
function clickIsWithinText(layer, x, y) {
  if (y < 0) {
    return false;
  }
  text = layer.data
  let c = document.getElementById("cmcanvas");
  let ctx = c.getContext("2d");
  let lines = text.split("\n");
  let cnt = 0;
  for (var ln=0; ln < lines.length; ln++) {
    let spl = lines[ln].split(" ");
    let o = "";
    while (spl.length) {
      o = spl.shift();
      while (spl.length && (ctx.measureText(o + " " + spl[0]).width < layer.width)) {
        o += " " + spl.shift();
      }
      cnt++;
      lineWidth = ctx.measureText(o).width;
      if (y < ((layer.height + layer.lineSpace) * cnt)) {
        if (layer.justify == "center") {
          x = x + (lineWidth / 2);
        }
        if (layer.justify == "right") {
          x = x + lineWidth;
        }

        return (x > 0) && (x < lineWidth);
      }
    }
  }
}

function dragEnd(event) {
  layerToDrag = null;
}

function drag(event) {
  var mouse = getMousePos(event)
  var x = mouse.x + dragOffsetX,
      y = mouse.y + dragOffsetY;

  if (layerToDrag != null) {
      layerToDrag.x = x;
      layerToDrag.y = y;
      drawProject();
      // Update params panel live if the dragged layer is the currently selected one
      try {
        let selId = getSelectedLayerNodeId();
        if (selId && aLayers[selId] === layerToDrag) {
          refreshParamsForLayer(layerToDrag, selId);
        }
      } catch (e) {}
  }
}

function focusKeyInput(layer) {
  keyFocusLayer = layer;
  document.addEventListener("keydown", moveLayerWithKey, false);
}

function removeKeyInputFocus() {
  keyFocusLayer = null;
  document.removeEventListener("keydown", moveLayerWithKey, false);
}

function moveLayerWithKey(event) {
  if (keyFocusLayer != null) {
    aspectRatio = keyFocusLayer.height / keyFocusLayer.width;
    delta = getMoveDeltas(event, aspectRatio)
    if (delta.x || delta.y || delta.w || delta.h) {
      if (keyFocusLayer.type == "text") {
        if (event.altKey) {
          delta.x = 0;
          delta.y = 0;
          if ((event.key == "ArrowUp") || (event.key == "ArrowDown")) {
            // Do not adjust the width for alt up / down, only change the font size
            delta.w = 0;
            delta.h = 2 * Math.sign(delta.h);
            delta.y = delta.h
          } else {
            // Do not adjust the height for alt left / right, only change the width (wrap point)
            delta.h = 0;
          }
        }
      }
      newX = keyFocusLayer.x + delta.x;
      newY = keyFocusLayer.y + delta.y;
      newWidth = keyFocusLayer.width + delta.w;
      newHeight = keyFocusLayer.height + delta.h;
      if (((newWidth >= 8) && (newHeight >=8)) || (delta.w > 0)) {
        keyFocusLayer.x = newX;
        keyFocusLayer.y = newY;
        keyFocusLayer.width = newWidth;
        keyFocusLayer.height = newHeight;
        drawProject();
        try {
          let selId = getSelectedLayerNodeId();
          if (selId && aLayers[selId] === keyFocusLayer) {
            refreshParamsForLayer(keyFocusLayer, selId);
          }
        } catch (e) {}
      }
      event.preventDefault();
    }
  }
}

function getMoveDeltas(event, aspectRatio) {
    var delta = {
      x: 0,
      y: 0,
      w: 0,
      h: 0
    };

    // One pixel if shift is up, 1/12" if shift is down
    magnitude = 1;
    if (event.shiftKey) {
      magnitude = 25;
    }

    // Set the directions based on the key
    switch (event.key) {
      case "ArrowRight":
        delta.x = magnitude;
        break;
      case "ArrowLeft":
        delta.x = -magnitude;
        break;
      case "ArrowUp":
        delta.y = -magnitude;
        break;
      case "ArrowDown":
        delta.y = magnitude;
        break;
    }

    // If alt is down, convert movement into resize
    if (event.altKey) {
      var centered = (delta.y != 0);
      delta.w = delta.x - (2 * delta.y);
      delta.h = delta.w * aspectRatio;
      delta.x = 0;
      delta.y = 0;
      if (centered) {
        delta.x = -delta.w / 2;
        delta.y = -delta.h / 2;
      }
    }
    return delta;
}

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

var projectUrl = getParameterByName('project')
let str = localStorage.getItem("loadedProjectUrl");
if (projectUrl && projectUrl != "") {
  localStorage.setItem("loadedProjectUrl", projectUrl);
  // Redirect without the query parameters now that they are stored in local
  // storage, so that they do not cause problems e.g. on reload or "new".
  window.location.assign(location.protocol + '//' + location.host + location.pathname);
} else if (str && str != "") {
  resetProject(false);
  loadInitialProject(str)
} else {
  resetProject(true);
}

var elem = document.getElementById('cmcanvas'),
    elemLeft = elem.offsetLeft + elem.clientLeft,
    elemTop = elem.offsetTop + elem.clientTop;

// Add event listener for `drag` events.
elem.addEventListener("mousedown", dragStart, false);
elem.addEventListener("mouseup", dragEnd, false);
elem.addEventListener("mousemove", drag, false);

