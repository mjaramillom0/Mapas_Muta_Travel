// ─── Custom region registries ─────────────────────────────────────────────────

// Drop your own GeoJSON geometry objects here — checked before any API call.
const CUSTOM_REGIONS = {};

// Predefined informal travel regions (not sovereign countries).
// Checked before Nominatim fallback.
const TRAVEL_REGIONS = {
  "patagonia": { type:"Polygon", coordinates:[[[-76,-37],[-61,-37],[-61,-56],[-67,-56],[-69,-54],[-74,-52],[-76,-50],[-76,-37]]] },
  "lapland":   { type:"Polygon", coordinates:[[[14,65],[32,65],[32,71],[14,71],[14,65]]] },
  "dolomites": { type:"Polygon", coordinates:[[[11.4,46.1],[12.5,46.1],[12.5,46.8],[11.4,46.8],[11.4,46.1]]] },
  "scottish highlands": { type:"Polygon", coordinates:[[[-7.6,56.4],[-1.7,56.4],[-1.7,58.7],[-7.6,58.7],[-7.6,56.4]]] },
  "amazon":    { type:"Polygon", coordinates:[[[-74,-5],[-44,-5],[-44,3],[-74,3],[-74,-5]]] },
  "sahara":    { type:"Polygon", coordinates:[[[-17,15],[37,15],[37,30],[-17,30],[-17,15]]] },
};


// ─── ISO 3166-1 Numeric Lookup ────────────────────────────────────────────────
// Lowercase country name → ISO numeric code (matches world-atlas feature IDs).

const COUNTRY_ISO_NUMERIC = {
  "afghanistan":4,"albania":8,"algeria":12,"andorra":20,"angola":24,
  "antigua and barbuda":28,"argentina":32,"armenia":51,"australia":36,
  "austria":40,"azerbaijan":31,
  "bahamas":44,"bahrain":48,"bangladesh":50,"barbados":52,"belarus":112,
  "belgium":56,"belize":84,"benin":204,"bhutan":64,"bolivia":68,
  "bosnia and herzegovina":70,"botswana":72,"brazil":76,"brunei":96,
  "bulgaria":100,"burkina faso":854,"burundi":108,
  "cabo verde":132,"cape verde":132,"cambodia":116,"cameroon":120,
  "canada":124,"central african republic":140,"chad":148,"chile":152,
  "china":156,"colombia":170,"comoros":174,"congo":178,
  "democratic republic of the congo":180,"dr congo":180,"drc":180,
  "costa rica":188,"croatia":191,"cuba":192,"cyprus":196,
  "czechia":203,"czech republic":203,
  "denmark":208,"djibouti":262,"dominica":212,"dominican republic":214,
  "ecuador":218,"egypt":818,"el salvador":222,"equatorial guinea":226,
  "eritrea":232,"estonia":233,"eswatini":748,"swaziland":748,"ethiopia":231,
  "fiji":242,"finland":246,"france":250,
  "gabon":266,"gambia":270,"georgia":268,"germany":276,"ghana":288,
  "greece":300,"grenada":308,"guatemala":320,"guinea":324,
  "guinea-bissau":624,"guyana":328,
  "haiti":332,"honduras":340,"hungary":348,
  "iceland":352,"india":356,"indonesia":360,"iran":364,"iraq":368,
  "ireland":372,"israel":376,"italy":380,
  "jamaica":388,"japan":392,"jordan":400,
  "kazakhstan":398,"kenya":404,"kiribati":296,
  "north korea":408,"south korea":410,"korea":410,
  "kuwait":414,"kyrgyzstan":417,
  "laos":418,"latvia":428,"lebanon":422,"lesotho":426,"liberia":430,
  "libya":434,"liechtenstein":438,"lithuania":440,"luxembourg":442,
  "madagascar":450,"malawi":454,"malaysia":458,"maldives":462,"mali":466,
  "malta":470,"marshall islands":584,"mauritania":478,"mauritius":480,
  "mexico":484,"micronesia":583,"moldova":498,"monaco":492,"mongolia":496,
  "montenegro":499,"morocco":504,"mozambique":508,"myanmar":104,"burma":104,
  "namibia":516,"nauru":520,"nepal":524,"netherlands":528,"new zealand":554,
  "nicaragua":558,"niger":562,"nigeria":566,"north macedonia":807,
  "macedonia":807,"norway":578,
  "oman":512,
  "pakistan":586,"palau":585,"palestine":275,"panama":591,
  "papua new guinea":598,"paraguay":600,"peru":604,"philippines":608,
  "poland":616,"portugal":620,
  "qatar":634,
  "romania":642,"russia":643,"rwanda":646,
  "saint kitts and nevis":659,"saint lucia":662,
  "saint vincent and the grenadines":670,"samoa":882,"san marino":674,
  "sao tome and principe":678,"saudi arabia":682,"senegal":686,
  "serbia":688,"seychelles":690,"sierra leone":694,"singapore":702,
  "slovakia":703,"slovenia":705,"solomon islands":90,"somalia":706,
  "south africa":710,"south sudan":728,"spain":724,"sri lanka":144,
  "sudan":729,"suriname":740,"sweden":752,"switzerland":756,"syria":760,
  "taiwan":158,"tajikistan":762,"tanzania":834,"thailand":764,
  "timor-leste":626,"east timor":626,"togo":768,"tonga":776,
  "trinidad and tobago":780,"tunisia":788,"turkey":792,"türkiye":792,
  "turkmenistan":795,"tuvalu":798,
  "uganda":800,"ukraine":804,"united arab emirates":784,"uae":784,
  "united kingdom":826,"uk":826,"great britain":826,
  "united states":840,"usa":840,"united states of america":840,
  "uruguay":858,"uzbekistan":860,
  "vanuatu":548,"vatican":336,"holy see":336,"venezuela":862,"vietnam":704,
  "yemen":887,
  "zambia":894,"zimbabwe":716,
  "greenland":304,"hong kong":344,
  "ivory coast":384,"côte d'ivoire":384,"cote d'ivoire":384,
};


// ─── World Atlas (Natural Earth TopoJSON) ─────────────────────────────────────

const ATLAS_URLS = {
  "50m":  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json",
  "110m": "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
};
const atlasCache = {};

async function loadWorldAtlas(resolution) {
  if (atlasCache[resolution]) return atlasCache[resolution];
  const res = await fetch(ATLAS_URLS[resolution]);
  if (!res.ok) throw new Error(`Failed to load Natural Earth data (${res.status})`);
  atlasCache[resolution] = await res.json();
  return atlasCache[resolution];
}

async function fetchNaturalEarthCountry(name) {
  if (typeof topojson === "undefined") return null;
  const key = name.toLowerCase().trim();
  let code = COUNTRY_ISO_NUMERIC[key];
  if (!code) {
    const hit = Object.keys(COUNTRY_ISO_NUMERIC).find(k => k.startsWith(key) || key.startsWith(k));
    if (hit) code = COUNTRY_ISO_NUMERIC[hit];
  }
  if (!code) return null;

  const resolution = document.getElementById("map-resolution")?.value ?? "50m";
  const topo = await loadWorldAtlas(resolution);
  const fc   = topojson.feature(topo, topo.objects.countries);
  const feat = fc.features.find(f => +f.id === code);
  return feat?.geometry ?? null;
}


// ─── Geometry Simplification (Ramer-Douglas-Peucker) ─────────────────────────

function ptLineDist([px,py],[x1,y1],[x2,y2]) {
  const dx=x2-x1, dy=y2-y1, len2=dx*dx+dy*dy;
  if (!len2) return Math.hypot(px-x1,py-y1);
  const t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/len2));
  return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));
}

function rdp(pts, eps) {
  if (pts.length<=2) return pts;
  let md=0, mi=0;
  const f=pts[0], l=pts[pts.length-1];
  for (let i=1;i<pts.length-1;i++) { const d=ptLineDist(pts[i],f,l); if(d>md){md=d;mi=i;} }
  if (md<=eps) return [f,l];
  return [...rdp(pts.slice(0,mi+1),eps).slice(0,-1),...rdp(pts.slice(mi),eps)];
}

function simplifyGeometry(geometry, epsilon) {
  const sr = ring => rdp(ring, epsilon);
  if (geometry.type==="Polygon")      return {...geometry, coordinates: geometry.coordinates.map(sr)};
  if (geometry.type==="MultiPolygon") return {...geometry, coordinates: geometry.coordinates.map(p=>p.map(sr))};
  return geometry;
}

function geometryCoordCount(g) {
  const rings = g.type==="Polygon" ? g.coordinates : g.type==="MultiPolygon" ? g.coordinates.flat() : [];
  return rings.reduce((n,r)=>n+r.length,0);
}

function geometryBBox(g) {
  const rings = g.type==="Polygon" ? g.coordinates : g.type==="MultiPolygon" ? g.coordinates.flat() : [];
  let minLon=Infinity,maxLon=-Infinity,minLat=Infinity,maxLat=-Infinity;
  rings.forEach(r=>r.forEach(([lon,lat])=>{
    if(lon<minLon)minLon=lon; if(lon>maxLon)maxLon=lon;
    if(lat<minLat)minLat=lat; if(lat>maxLat)maxLat=lat;
  }));
  return {minLon,maxLon,minLat,maxLat,w:maxLon-minLon,h:maxLat-minLat};
}


// ─── Nominatim boundary fetch (region fallback) ───────────────────────────────

async function fetchNominatimBoundary(placeName) {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(placeName)}&format=json&polygon_geojson=1&limit=5`;
  const res = await fetch(url, { headers:{"Accept-Language":"en"} });
  if (!res.ok) throw new Error(`Network error ${res.status}`);
  const results = await res.json();
  if (!results.length) throw new Error(`"${placeName}" not found.`);
  const hit = results.find(r=>r.geojson&&(r.geojson.type==="Polygon"||r.geojson.type==="MultiPolygon"));
  if (!hit) throw new Error(`No boundary outline found for "${placeName}".`);
  let geom = hit.geojson;
  if (geometryCoordCount(geom) > 1500) {
    const b = geometryBBox(geom);
    geom = simplifyGeometry(geom, Math.max(0.002*Math.min(b.w||1,b.h||1), 0.0005));
  }
  return geom;
}


// ─── GADM Local File Lookup ───────────────────────────────────────────────────
// Maps common country names (English + Spanish) to ISO Alpha-3 codes.
// Keys are pre-normalized (lowercase, no diacritics, no punctuation).

const GADM_COUNTRY_CODES = {
  // A
  "aruba":"ABW",
  "afghanistan":"AFG","afganistan":"AFG",
  "angola":"AGO",
  "anguilla":"AIA","anguila":"AIA",
  "aland islands":"ALA","islas aland":"ALA",
  "albania":"ALB",
  "andorra":"AND",
  "united arab emirates":"ARE","emiratos arabes unidos":"ARE","uae":"ARE","emiratos arabes":"ARE",
  "argentina":"ARG",
  "armenia":"ARM",
  "american samoa":"ASM","samoa americana":"ASM",
  "antarctica":"ATA","antartida":"ATA",
  "french southern territories":"ATF","territorios australes franceses":"ATF",
  "antigua and barbuda":"ATG","antigua y barbuda":"ATG",
  "australia":"AUS",
  "austria":"AUT",
  "azerbaijan":"AZE","azerbaiyan":"AZE","azerbaiyán":"AZE",
  // B
  "burundi":"BDI",
  "belgium":"BEL","belgica":"BEL","bélgica":"BEL",
  "benin":"BEN","benín":"BEN",
  "bonaire":"BES","bonaire sint eustatius and saba":"BES",
  "burkina faso":"BFA",
  "bangladesh":"BGD","banglades":"BGD","bangladés":"BGD",
  "bulgaria":"BGR",
  "bahrain":"BHR","barein":"BHR","baréin":"BHR",
  "bahamas":"BHS",
  "bosnia and herzegovina":"BIH","bosnia y herzegovina":"BIH","bosnia":"BIH",
  "saint barthelemy":"BLM","san bartolome":"BLM","saint barthélemy":"BLM",
  "belarus":"BLR","bielorrusia":"BLR",
  "belize":"BLZ","belice":"BLZ",
  "bermuda":"BMU","bermudas":"BMU",
  "bolivia":"BOL",
  "brazil":"BRA","brasil":"BRA",
  "barbados":"BRB",
  "brunei":"BRN","brunei darussalam":"BRN","brunéi":"BRN",
  "bhutan":"BTN","butan":"BTN","bután":"BTN",
  "bouvet island":"BVT","isla bouvet":"BVT",
  "botswana":"BWA","botsuana":"BWA",
  // C
  "central african republic":"CAF","republica centroafricana":"CAF","república centroafricana":"CAF",
  "canada":"CAN","canadá":"CAN",
  "cocos islands":"CCK","islas cocos":"CCK","keeling islands":"CCK",
  "switzerland":"CHE","suiza":"CHE",
  "chile":"CHL",
  "china":"CHN",
  "ivory coast":"CIV","cote d ivoire":"CIV","cote divoire":"CIV","costa de marfil":"CIV","cote d ivoire":"CIV",
  "cameroon":"CMR","camerun":"CMR","camerún":"CMR",
  "democratic republic of the congo":"COD","dr congo":"COD","drc":"COD","republica democratica del congo":"COD","república democrática del congo":"COD","congo kinshasa":"COD","zaire":"COD",
  "republic of the congo":"COG","congo brazzaville":"COG","republica del congo":"COG","república del congo":"COG","congo":"COG",
  "cook islands":"COK","islas cook":"COK",
  "colombia":"COL",
  "comoros":"COM","comoras":"COM",
  "cape verde":"CPV","cabo verde":"CPV",
  "costa rica":"CRI",
  "cuba":"CUB",
  "curacao":"CUW","curazao":"CUW","curaçao":"CUW",
  "christmas island":"CXR","isla de navidad":"CXR",
  "cayman islands":"CYM","islas caiman":"CYM","islas caimán":"CYM",
  "cyprus":"CYP","chipre":"CYP",
  "czech republic":"CZE","czechia":"CZE","republica checa":"CZE","república checa":"CZE","chequia":"CZE",
  // D
  "germany":"DEU","alemania":"DEU",
  "djibouti":"DJI","yibuti":"DJI",
  "dominica":"DMA",
  "denmark":"DNK","dinamarca":"DNK",
  "dominican republic":"DOM","republica dominicana":"DOM","república dominicana":"DOM",
  "algeria":"DZA","argelia":"DZA",
  // E
  "ecuador":"ECU",
  "egypt":"EGY","egipto":"EGY",
  "eritrea":"ERI",
  "western sahara":"ESH","sahara occidental":"ESH",
  "spain":"ESP","espana":"ESP","españa":"ESP",
  "estonia":"EST",
  "ethiopia":"ETH","etiopia":"ETH","etiopía":"ETH",
  // F
  "finland":"FIN","finlandia":"FIN",
  "fiji":"FJI","fiyi":"FJI",
  "falkland islands":"FLK","malvinas":"FLK","islas malvinas":"FLK","falklands":"FLK",
  "france":"FRA","francia":"FRA",
  "faroe islands":"FRO","islas feroe":"FRO",
  "micronesia":"FSM","federated states of micronesia":"FSM",
  // G
  "gabon":"GAB","gabón":"GAB",
  "united kingdom":"GBR","reino unido":"GBR","uk":"GBR","great britain":"GBR","england":"GBR","inglaterra":"GBR",
  "georgia":"GEO",
  "guernsey":"GGY",
  "ghana":"GHA",
  "gibraltar":"GIB",
  "guinea":"GIN",
  "guadeloupe":"GLP","guadalupe":"GLP",
  "gambia":"GMB","the gambia":"GMB",
  "guinea-bissau":"GNB","guinea bisau":"GNB","guinea bissau":"GNB","guinea-bisáu":"GNB",
  "equatorial guinea":"GNQ","guinea ecuatorial":"GNQ",
  "greece":"GRC","grecia":"GRC",
  "grenada":"GRD","granada":"GRD",
  "greenland":"GRL","groenlandia":"GRL",
  "guatemala":"GTM",
  "french guiana":"GUF","guayana francesa":"GUF","guyana francesa":"GUF",
  "guam":"GUM",
  "guyana":"GUY",
  // H
  "heard island":"HMD","heard island and mcdonald islands":"HMD",
  "honduras":"HND",
  "croatia":"HRV","croacia":"HRV",
  "haiti":"HTI","haití":"HTI",
  "hungary":"HUN","hungria":"HUN","hungría":"HUN",
  // I
  "indonesia":"IDN",
  "isle of man":"IMN","isla de man":"IMN",
  "india":"IND",
  "british indian ocean territory":"IOT","territorio britanico del oceano indico":"IOT",
  "ireland":"IRL","irlanda":"IRL",
  "iran":"IRN","irán":"IRN",
  "iraq":"IRQ","irak":"IRQ",
  "iceland":"ISL","islandia":"ISL",
  "israel":"ISR",
  "italy":"ITA","italia":"ITA",
  // J
  "jamaica":"JAM",
  "jersey":"JEY",
  "jordan":"JOR","jordania":"JOR",
  "japan":"JPN","japon":"JPN","japón":"JPN",
  // K
  "kazakhstan":"KAZ","kazajistan":"KAZ","kazajistán":"KAZ",
  "kenya":"KEN","kenia":"KEN",
  "kyrgyzstan":"KGZ","kirguistan":"KGZ","kirguistán":"KGZ","kirguizistán":"KGZ",
  "cambodia":"KHM","camboya":"KHM",
  "kiribati":"KIR",
  "saint kitts and nevis":"KNA","san cristobal y nieves":"KNA","san cristóbal y nieves":"KNA",
  "south korea":"KOR","corea del sur":"KOR","korea":"KOR","republic of korea":"KOR",
  "kuwait":"KWT",
  // L
  "laos":"LAO",
  "lebanon":"LBN","libano":"LBN","líbano":"LBN",
  "liberia":"LBR",
  "libya":"LBY","libia":"LBY",
  "saint lucia":"LCA","santa lucia":"LCA","santa lucía":"LCA",
  "liechtenstein":"LIE",
  "sri lanka":"LKA",
  "lesotho":"LSO","lesoto":"LSO",
  "lithuania":"LTU","lituania":"LTU",
  "luxembourg":"LUX","luxemburgo":"LUX",
  "latvia":"LVA","letonia":"LVA",
  // M
  "saint martin":"MAF","san martin frances":"MAF",
  "morocco":"MAR","marruecos":"MAR",
  "monaco":"MCO","mónaco":"MCO",
  "moldova":"MDA","moldavia":"MDA",
  "madagascar":"MDG",
  "maldives":"MDV","maldivas":"MDV",
  "mexico":"MEX","méxico":"MEX",
  "marshall islands":"MHL","islas marshall":"MHL",
  "north macedonia":"MKD","macedonia del norte":"MKD","macedonia":"MKD",
  "mali":"MLI","malí":"MLI",
  "malta":"MLT",
  "myanmar":"MMR","burma":"MMR","birmania":"MMR",
  "montenegro":"MNE",
  "mongolia":"MNG",
  "northern mariana islands":"MNP","islas marianas del norte":"MNP",
  "mozambique":"MOZ",
  "mauritania":"MRT",
  "montserrat":"MSR",
  "martinique":"MTQ","martinica":"MTQ",
  "mauritius":"MUS","mauricio":"MUS",
  "malawi":"MWI","malaui":"MWI",
  "malaysia":"MYS","malasia":"MYS",
  "mayotte":"MYT",
  // N
  "namibia":"NAM",
  "new caledonia":"NCL","nueva caledonia":"NCL",
  "niger":"NER","níger":"NER",
  "norfolk island":"NFK","isla norfolk":"NFK",
  "nigeria":"NGA",
  "nicaragua":"NIC",
  "niue":"NIU",
  "netherlands":"NLD","paises bajos":"NLD","países bajos":"NLD","holanda":"NLD","holland":"NLD",
  "norway":"NOR","noruega":"NOR",
  "nepal":"NPL",
  "nauru":"NRU",
  "new zealand":"NZL","nueva zelanda":"NZL","nueva zelandia":"NZL",
  // O
  "oman":"OMN","omán":"OMN",
  // P
  "pakistan":"PAK","pakistán":"PAK",
  "panama":"PAN","panamá":"PAN",
  "pitcairn islands":"PCN","islas pitcairn":"PCN",
  "peru":"PER","perú":"PER",
  "philippines":"PHL","filipinas":"PHL",
  "palau":"PLW","palaos":"PLW",
  "papua new guinea":"PNG","papua nueva guinea":"PNG","papúa nueva guinea":"PNG",
  "poland":"POL","polonia":"POL",
  "puerto rico":"PRI",
  "north korea":"PRK","corea del norte":"PRK","democratic peoples republic of korea":"PRK",
  "portugal":"PRT",
  "paraguay":"PRY",
  "palestine":"PSE","palestina":"PSE",
  "french polynesia":"PYF","polinesia francesa":"PYF",
  // Q
  "qatar":"QAT","catar":"QAT",
  // R
  "reunion":"REU","réunion":"REU","reunión":"REU",
  "romania":"ROU","rumania":"ROU","rumanía":"ROU",
  "russia":"RUS","rusia":"RUS","russian federation":"RUS",
  "rwanda":"RWA","ruanda":"RWA",
  // S
  "saudi arabia":"SAU","arabia saudita":"SAU","arabia saudi":"SAU","arabia saudí":"SAU",
  "sudan":"SDN","sudán":"SDN",
  "senegal":"SEN",
  "singapore":"SGP","singapur":"SGP",
  "south georgia":"SGS","south georgia and the south sandwich islands":"SGS","georgias del sur":"SGS",
  "saint helena":"SHN","santa elena":"SHN",
  "svalbard":"SJM","svalbard and jan mayen":"SJM",
  "solomon islands":"SLB","islas salomon":"SLB","islas salomón":"SLB",
  "sierra leone":"SLE",
  "el salvador":"SLV",
  "san marino":"SMR",
  "somalia":"SOM",
  "saint pierre and miquelon":"SPM","san pedro y miquelon":"SPM",
  "serbia":"SRB",
  "south sudan":"SSD","sudan del sur":"SSD","sudán del sur":"SSD",
  "sao tome and principe":"STP","santo tome y principe":"STP","são tomé y príncipe":"STP",
  "suriname":"SUR","surinam":"SUR",
  "slovakia":"SVK","eslovaquia":"SVK",
  "slovenia":"SVN","eslovenia":"SVN",
  "sweden":"SWE","suecia":"SWE",
  "eswatini":"SWZ","swaziland":"SWZ","swazilandia":"SWZ","suazilandia":"SWZ",
  "sint maarten":"SXM","san martin holandes":"SXM",
  "seychelles":"SYC",
  "syria":"SYR","siria":"SYR",
  // T
  "turks and caicos islands":"TCA","islas turcas y caicos":"TCA",
  "chad":"TCD",
  "togo":"TGO",
  "thailand":"THA","tailandia":"THA",
  "tajikistan":"TJK","tayikistan":"TJK","tayikistán":"TJK",
  "tokelau":"TKL",
  "turkmenistan":"TKM","turkmenistán":"TKM",
  "timor-leste":"TLS","timor oriental":"TLS","east timor":"TLS",
  "tonga":"TON",
  "trinidad and tobago":"TTO","trinidad y tobago":"TTO",
  "tunisia":"TUN","tunez":"TUN","túnez":"TUN",
  "turkey":"TUR","turquia":"TUR","turquía":"TUR","turkiye":"TUR","türkiye":"TUR",
  "tuvalu":"TUV",
  "taiwan":"TWN","taiwán":"TWN",
  "tanzania":"TZA",
  // U
  "uganda":"UGA",
  "ukraine":"UKR","ucrania":"UKR",
  "us minor outlying islands":"UMI","islas ultramarinas de estados unidos":"UMI",
  "uruguay":"URY",
  "united states":"USA","estados unidos":"USA","usa":"USA","united states of america":"USA",
  "uzbekistan":"UZB","uzbekistán":"UZB",
  // V
  "vatican city":"VAT","ciudad del vaticano":"VAT","vaticano":"VAT","holy see":"VAT",
  "saint vincent and the grenadines":"VCT","san vicente y las granadinas":"VCT",
  "venezuela":"VEN",
  "british virgin islands":"VGB","islas virgenes britanicas":"VGB","islas vírgenes británicas":"VGB",
  "us virgin islands":"VIR","islas virgenes de los estados unidos":"VIR","islas vírgenes":"VIR",
  "vietnam":"VNM","viet nam":"VNM",
  "vanuatu":"VUT",
  // W
  "wallis and futuna":"WLF","wallis y futuna":"WLF",
  "samoa":"WSM",
  // X — non-standard GADM codes
  "akrotiri and dhekelia":"XAD",
  "clipperton island":"XCL","isla clipperton":"XCL",
  "kosovo":"XKO",
  "paracel islands":"XPI","islas paracel":"XPI",
  "spratly islands":"XSP","islas spratly":"XSP",
  // Y
  "yemen":"YEM",
  // Z
  "south africa":"ZAF","sudafrica":"ZAF","sudáfrica":"ZAF",
  "zambia":"ZMB",
  "zanzibar":"ZNC",
  "zimbabwe":"ZWE","zimbabue":"ZWE",
};

// Strips diacritics and normalises to plain lowercase ASCII for fuzzy matching.
function normalizeCountryName(s) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // remove diacritics
    .replace(/[^a-z0-9\s]/g, " ")                        // strip punctuation
    .replace(/\s+/g, " ")
    .trim();
}

function lookupGADMCode(name) {
  const norm = normalizeCountryName(name);
  if (GADM_COUNTRY_CODES[norm]) return GADM_COUNTRY_CODES[norm];
  // Partial-match fallback: find a table key that starts with or contains the query
  const hit = Object.keys(GADM_COUNTRY_CODES).find(k => k === norm || norm.startsWith(k) || k.startsWith(norm));
  return hit ? GADM_COUNTRY_CODES[hit] : null;
}

function formatCountryLabel(name) {
  const keepLower = new Set(["and", "of", "the", "de", "del", "y"]);
  return name.split(" ").map((word, i) => {
    if (i > 0 && keepLower.has(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
}

const GADM_COUNTRY_OPTIONS = Object.entries(GADM_COUNTRY_CODES).reduce((options, [name, code]) => {
  if (!options[code]) {
    options[code] = {
      code,
      name: formatCountryLabel(name),
      searchText: `${code.toLowerCase()} ${name}`,
    };
  } else {
    options[code].searchText += ` ${name}`;
  }
  return options;
}, {});

const GADM_COUNTRIES = Object.values(GADM_COUNTRY_OPTIONS)
  .map(option => ({ ...option, searchText: normalizeCountryName(option.searchText) }))
  .sort((a, b) => a.name.localeCompare(b.name));

function getGADMCountryMatches(query) {
  const norm = normalizeCountryName(query);
  if (!norm) return [];
  return GADM_COUNTRIES
    .map(option => {
      const nameNorm = normalizeCountryName(option.name);
      const codeNorm = option.code.toLowerCase();
      let score = 99;
      if (nameNorm === norm || codeNorm === norm) score = 0;
      else if (nameNorm.startsWith(norm)) score = 1;
      else if (codeNorm.startsWith(norm)) score = 2;
      else if (option.searchText.includes(norm)) score = 3;
      return { ...option, score };
    })
    .filter(option => option.score < 99)
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
    .slice(0, 8);
}

const gadmScriptCache = {};
const gadmScriptPending = {};

window.__GADM_JSON_LOADER__ = function(code, json) {
  gadmScriptCache[code] = json;
  if (gadmScriptPending[code]) {
    gadmScriptPending[code].resolve(json);
    delete gadmScriptPending[code];
  }
};

function loadGADMJsonScript(code) {
  if (gadmScriptCache[code]) return Promise.resolve(gadmScriptCache[code]);
  if (gadmScriptPending[code]) return gadmScriptPending[code].promise;

  const path = `gadm_js/gadm41_${code}_0.js?v=20260420-gadm5`;
  const script = document.createElement("script");
  script.src = path;
  script.async = true;

  const promise = new Promise((resolve, reject) => {
    gadmScriptPending[code] = { promise: null, resolve, reject };
    script.onload = () => {
      if (gadmScriptCache[code]) resolve(gadmScriptCache[code]);
      else reject(new Error(`Loaded ${path}, but it did not register ${code}.`));
    };
    script.onerror = () => {
      delete gadmScriptPending[code];
      reject(new Error(`Could not load ${path}.`));
    };
  });

  gadmScriptPending[code].promise = promise;
  document.head.appendChild(script);
  return promise;
}

async function loadLocalText(path) {
  try {
    const res = await fetch(path, { cache: "reload" });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    return await res.text();
  } catch(fetchError) {
    console.warn("Fetch failed, retrying with XMLHttpRequest:", fetchError.message);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", path, true);
      xhr.overrideMimeType("application/json");
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText);
        else reject(new Error(`${xhr.status} ${xhr.statusText || "HTTP error"}`));
      };
      xhr.onerror = () => reject(new Error(`Network error while loading ${path}`));
      xhr.send();
    });
  }
}

async function fetchGADMFile(code) {
  const path = `gadm_js/gadm41_${code}_0.js`;
  let json;
  try {
    json = await loadGADMJsonScript(code);
  } catch(e) {
    throw new Error(`Could not load ${path}: ${e.message}`);
  }

  let geom = extractGeometry(json);
  try {
    // Graduated simplification — larger files get a coarser epsilon.
    // If simplification fails in the browser, keep the original geometry
    // instead of treating a valid local file as missing.
    const n = geometryCoordCount(geom);
    if (n > 2000) {
      const b   = geometryBBox(geom);
      const dim = Math.min(b.w || 1, b.h || 1);
      const eps = n > 20000
        ? Math.max(0.005 * dim, 0.005)   // very complex (Russia, USA, Canada…)
        : Math.max(0.002 * dim, 0.001);  // moderately complex
      geom = simplifyGeometry(geom, eps);
    }
  } catch(e) {
    console.warn("GADM simplification skipped:", e.message);
  }
  return geom;
}


// ─── Boundary source hierarchy ────────────────────────────────────────────────
// 1. CUSTOM_REGIONS  2. GADM local files  3. TRAVEL_REGIONS
// 4. Natural Earth   5. Nominatim

async function fetchBoundary(placeName) {
  const key = placeName.toLowerCase().trim();

  const customKey = Object.keys(CUSTOM_REGIONS).find(k=>k.toLowerCase()===key);
  if (customKey) { showSourceBadge("Custom",""); return CUSTOM_REGIONS[customKey]; }

  // ── GADM local files (highest-quality country outlines) ──
  const gadmCode = lookupGADMCode(placeName);
  if (gadmCode) {
    try {
      const geom = await fetchGADMFile(gadmCode);
      if (geom) { showSourceBadge(`GADM 4.1 · ${gadmCode}`, "natural-earth"); return geom; }
    } catch(e) {
      console.warn("GADM local lookup skipped:", e.message);
    }
  }

  if (TRAVEL_REGIONS[key]) { showSourceBadge("Travel region (predefined)",""); return TRAVEL_REGIONS[key]; }

  try {
    const geom = await fetchNaturalEarthCountry(placeName);
    if (geom) {
      const res = document.getElementById("map-resolution")?.value ?? "50m";
      showSourceBadge(`Natural Earth ${res}`, "natural-earth");
      return geom;
    }
  } catch(e) { console.warn("Natural Earth lookup failed:", e.message); }

  showSourceBadge("OpenStreetMap (region fallback)", "osm");
  return fetchNominatimBoundary(placeName);
}

function showSourceBadge(text, cls) {
  const el = document.getElementById("source-badge");
  if (!el) return;
  el.textContent = text;
  el.className = "source-badge" + (cls ? ` ${cls}` : "");
}


// ─── GeoJSON file utilities ───────────────────────────────────────────────────

function extractGeometry(json) {
  if (json.type === "Feature")  return json.geometry;
  if (json.type === "Polygon" || json.type === "MultiPolygon") return json;
  if (json.type === "FeatureCollection") {
    const polys = json.features.filter(f=>f.geometry&&
      (f.geometry.type==="Polygon"||f.geometry.type==="MultiPolygon"));
    if (!polys.length) throw new Error("No polygon features in this GeoJSON.");
    if (polys.length===1) return polys[0].geometry;
    const coords=[];
    polys.forEach(f=>{
      if(f.geometry.type==="Polygon") coords.push(f.geometry.coordinates);
      else f.geometry.coordinates.forEach(c=>coords.push(c));
    });
    return { type:"MultiPolygon", coordinates:coords };
  }
  throw new Error("Unsupported GeoJSON type: "+json.type);
}


// ─── App State ────────────────────────────────────────────────────────────────

let leafletMap       = null;
let currentTileLayer = null;
let geoLayers        = [];   // { id, name, geometry, source:"name"|"file", visible }
let points           = [];
let routeEditMode    = false;
let routeWaypoints   = {};   // { "ptId1--ptId2": [{lat, lon}, ...] }
let annotations      = [];   // [ { id, text, lat, lon, offset:{dx,dy}, visible, status, error } ]

const annotationStyle = {
  color:   "#044040",
  size:    22,
  opacity: 0.85,
  bold:    true,
  showAll: true,
};

const style = {
  bgColor:              "#ffffff",
  mapFill:              "#BACCC6",
  fillOpacity:          1,
  markerColor:          "#044040",
  markerSize:           6,
  markerOpacity:        1,
  labelColor:           "#044040",
  labelSize:            11,
  labelOpacity:         1,
  labelBold:            false,
  showAllPoints:        true,
  showAllLabels:        true,
  routeVisible:         true,
  routeColor:           "#044040",
  routeWidth:           2,
  routeOpacity:         0.85,
  routeDash:            "none",
  showTransportIcons:   true,
};


// ─── Utilities ────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2,10); }

function escapeHtml(s) {
  return String(s??"")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// Converts a mouse ClientX/Y to the coordinate space of the map container
// (which matches what latLngToContainerPoint returns).
function clientToSVG(e) {
  const rect = document.getElementById("map-container").getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}


// ─── Leaflet Initialization ───────────────────────────────────────────────────

function initLeaflet() {
  leafletMap = L.map("map-container", {
    center: [25, 10],
    zoom: 2,
    zoomControl: false,        // custom position below
    attributionControl: true,
  });

  L.control.zoom({ position: "bottomright" }).addTo(leafletMap);

  // Re-render SVG overlay whenever the map view changes
  leafletMap.on("zoomend moveend resize", renderAll);
}


// ─── Map Projection ───────────────────────────────────────────────────────────

// Projects geographic lon/lat to container-pixel coordinates.
// These match the SVG overlay (both are positioned at top-left of .preview-box).
function projectPoint(lon, lat) {
  if (!leafletMap) return null;
  const p = leafletMap.latLngToContainerPoint([lat, lon]);
  return { x: p.x, y: p.y };
}


// ─── SVG Path Generation ──────────────────────────────────────────────────────

// Converts a GeoJSON Polygon/MultiPolygon to SVG path strings using the current
// Leaflet map projection (re-computed on every zoom/pan).
function geometryToSVGPaths(geometry) {
  const rings = geometry.type === "Polygon" ? geometry.coordinates
    : geometry.type === "MultiPolygon" ? geometry.coordinates.flat()
    : [];

  return rings.map(ring => {
    if (ring.length < 2) return "";
    const pts = ring.map(([lon, lat]) => {
      const p = leafletMap.latLngToContainerPoint([lat, lon]);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    });
    return `M ${pts.join(" L ")} Z`;
  }).filter(Boolean);
}


// ─── Route Waypoint Helpers ───────────────────────────────────────────────────

// Returns the screen-projected main route anchor points (in-route + visible + geocoded).
function getRoutePoints() {
  return points
    .filter(p => p.inRoute && p.visible && p.lat !== null)
    .map(p => {
      const proj = projectPoint(p.lon, p.lat);
      return { x: proj.x + p.markerOffset.dx, y: proj.y + p.markerOffset.dy, src: p };
    });
}

// Stable key for the segment between two consecutive anchor points.
function getSegmentKey(p1, p2) {
  return `${p1.src.id}--${p2.src.id}`;
}

// Builds the complete flat point list for Catmull-Rom: anchor → waypoints → anchor → …
function buildAllRoutePts(routePoints) {
  const allPts = [];
  for (let i = 0; i < routePoints.length; i++) {
    allPts.push({ ...routePoints[i], isAnchor: true });
    if (i < routePoints.length - 1) {
      const segKey = getSegmentKey(routePoints[i], routePoints[i + 1]);
      const wps = routeWaypoints[segKey] || [];
      wps.forEach((wp, wi) => {
        const proj = leafletMap.latLngToContainerPoint([wp.lat, wp.lon]);
        allPts.push({ x: proj.x, y: proj.y, isWaypoint: true, segKey, wpIndex: wi });
      });
    }
  }
  return allPts;
}

// Returns the t-parameter of projecting point (px,py) onto segment (x1,y1)→(x2,y2).
function projectOntoSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (!len2) return 0;
  return Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
}

// Returns the index i such that the click at (mx,my) is closest to segment i→i+1.
function findNearestAnchorSegment(mx, my, routePoints) {
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < routePoints.length - 1; i++) {
    const p1 = routePoints[i], p2 = routePoints[i + 1];
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len2 = dx * dx + dy * dy;
    let dist;
    if (!len2) {
      dist = Math.hypot(mx - p1.x, my - p1.y);
    } else {
      const t = Math.max(0, Math.min(1, ((mx - p1.x) * dx + (my - p1.y) * dy) / len2));
      dist = Math.hypot(mx - (p1.x + t * dx), my - (p1.y + t * dy));
    }
    if (dist < bestDist) { bestDist = dist; best = i; }
  }
  return best;
}

// Inserts a new waypoint into a segment in order (sorted by t along the straight segment).
function insertWaypointSorted(segKey, fromPt, toPt, lat, lon) {
  if (!routeWaypoints[segKey]) routeWaypoints[segKey] = [];
  const wps = routeWaypoints[segKey];
  const newProj = leafletMap.latLngToContainerPoint([lat, lon]);
  const newT = projectOntoSegment(newProj.x, newProj.y, fromPt.x, fromPt.y, toPt.x, toPt.y);
  let insertIdx = wps.length;
  for (let i = 0; i < wps.length; i++) {
    const wpProj = leafletMap.latLngToContainerPoint([wps[i].lat, wps[i].lon]);
    const wpT = projectOntoSegment(wpProj.x, wpProj.y, fromPt.x, fromPt.y, toPt.x, toPt.y);
    if (newT < wpT) { insertIdx = i; break; }
  }
  wps.splice(insertIdx, 0, { lat, lon });
}


// ─── Route Curves (Catmull-Rom → Cubic Bézier) ───────────────────────────────

function catmullRomPath(pts) {
  if (pts.length < 2) return "";
  const t = 0.4;
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length-1; i++) {
    const p0=pts[Math.max(0,i-1)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(pts.length-1,i+2)];
    const cp1x=p1.x+(p2.x-p0.x)*t, cp1y=p1.y+(p2.y-p0.y)*t;
    const cp2x=p2.x-(p3.x-p1.x)*t, cp2y=p2.y-(p3.y-p1.y)*t;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}


// ─── Rendering ───────────────────────────────────────────────────────────────

function renderOutline() {
  const g = document.getElementById("layer-map");
  g.innerHTML = "";
  if (!leafletMap) return;

  geoLayers.filter(l => l.visible).forEach(layer => {
    geometryToSVGPaths(layer.geometry).forEach(d => {
      const path = document.createElementNS("http://www.w3.org/2000/svg","path");
      path.setAttribute("d", d);
      path.setAttribute("class", "map-path");
      path.setAttribute("fill", style.mapFill);
      path.setAttribute("fill-opacity", style.fillOpacity);
      path.setAttribute("stroke", "#fff");
      path.setAttribute("stroke-width", "0.8");
      path.setAttribute("stroke-linejoin", "round");
      g.appendChild(path);
    });
  });
}

function renderRoute() {
  const g = document.getElementById("layer-route");
  g.innerHTML = "";
  if (!style.routeVisible || !leafletMap) return;

  const routePoints = getRoutePoints();
  if (routePoints.length < 2) return;

  // Arrow marker color
  const arrowShape = document.getElementById("arrow-shape");
  if (arrowShape) {
    arrowShape.setAttribute("fill", style.routeColor);
    arrowShape.setAttribute("fill-opacity", style.routeOpacity);
  }

  // Build full point list (anchors interleaved with waypoints)
  const allPts = buildAllRoutePts(routePoints);
  const pathD  = catmullRomPath(allPts.map(p => ({ x: p.x, y: p.y })));

  // ── Edit mode: transparent wide hit-area (click to add waypoint) ──
  if (routeEditMode) {
    const hitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hitPath.setAttribute("d", pathD);
    hitPath.setAttribute("fill", "none");
    hitPath.setAttribute("stroke", "transparent");
    hitPath.setAttribute("stroke-width", String(Math.max(style.routeWidth + 14, 22)));
    hitPath.style.pointerEvents = "stroke";
    hitPath.style.cursor = "crosshair";
    hitPath.addEventListener("click", e => {
      e.stopPropagation();
      const pos    = clientToSVG(e);
      const segIdx = findNearestAnchorSegment(pos.x, pos.y, routePoints);
      if (segIdx < 0 || segIdx >= routePoints.length - 1) return;
      const segKey = getSegmentKey(routePoints[segIdx], routePoints[segIdx + 1]);
      const ll     = leafletMap.containerPointToLatLng([pos.x, pos.y]);
      insertWaypointSorted(segKey, routePoints[segIdx], routePoints[segIdx + 1], ll.lat, ll.lng);
      renderRoute();
    });
    g.appendChild(hitPath);
  }

  // ── Visible route path ──
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathD);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", style.routeColor);
  path.setAttribute("stroke-width", style.routeWidth);
  path.setAttribute("stroke-opacity", style.routeOpacity);
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("marker-end", "url(#route-arrow)");
  if (style.routeDash && style.routeDash !== "none") {
    path.setAttribute("stroke-dasharray", style.routeDash);
  }
  g.appendChild(path);

  // ── Transport icons — one per segment, at the geometric midpoint ──
  if (style.showTransportIcons) {
    for (let i = 0; i < routePoints.length - 1; i++) {
      const src       = routePoints[i].src;
      const transport = src.transportAfter;
      if (!transport || transport === "none") continue;
      const opt = TRANSPORT_OPTIONS.find(o => o.value === transport);
      if (!opt || !opt.icon) continue;

      const mx    = (routePoints[i].x + routePoints[i + 1].x) / 2;
      const my    = (routePoints[i].y + routePoints[i + 1].y) / 2;
      const iconR = Math.max(style.routeWidth * 2.5, 11);

      const grp = document.createElementNS("http://www.w3.org/2000/svg", "g");
      grp.setAttribute("class", "transport-icon");

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", mx.toFixed(1));
      circle.setAttribute("cy", my.toFixed(1));
      circle.setAttribute("r",  iconR);
      circle.setAttribute("fill", "#fff");
      circle.setAttribute("stroke", style.routeColor);
      circle.setAttribute("stroke-width", "1.2");
      circle.setAttribute("stroke-opacity", style.routeOpacity);

      const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      txt.setAttribute("x", mx.toFixed(1));
      txt.setAttribute("y", my.toFixed(1));
      txt.setAttribute("text-anchor", "middle");
      txt.setAttribute("dominant-baseline", "central");
      txt.setAttribute("font-size", (iconR * 1.15).toFixed(1));
      txt.setAttribute("font-family", "Apple Color Emoji,Segoe UI Emoji,sans-serif");
      txt.textContent = opt.icon;

      grp.appendChild(circle);
      grp.appendChild(txt);
      g.appendChild(grp);
    }
  }

  // ── Edit mode: draggable waypoint handles ──
  if (routeEditMode) {
    allPts.forEach(pt => {
      if (!pt.isWaypoint) return;

      const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      handle.setAttribute("cx", pt.x.toFixed(1));
      handle.setAttribute("cy", pt.y.toFixed(1));
      handle.setAttribute("r",  "6");
      handle.setAttribute("fill", "#fff");
      handle.setAttribute("stroke", style.routeColor);
      handle.setAttribute("stroke-width", "2");
      handle.setAttribute("class", "route-wp-handle");
      handle.style.pointerEvents = "auto";
      handle.style.cursor = "grab";

      // Double-click → remove this waypoint
      handle.addEventListener("dblclick", e => {
        e.stopPropagation();
        const wps = routeWaypoints[pt.segKey];
        if (wps) {
          wps.splice(pt.wpIndex, 1);
          if (wps.length === 0) delete routeWaypoints[pt.segKey];
        }
        renderRoute();
      });

      // Mousedown → start drag
      handle.addEventListener("mousedown", e => {
        e.preventDefault();
        e.stopPropagation();
        leafletMap.dragging.disable();
        dragState = {
          type:       "waypoint",
          segKey:     pt.segKey,
          wpIndex:    pt.wpIndex,
          origLatLon: { ...routeWaypoints[pt.segKey][pt.wpIndex] },
        };
      });

      g.appendChild(handle);
    });
  }
}

function renderMarkers() {
  const g = document.getElementById("layer-markers");
  g.innerHTML = "";
  if (!leafletMap) return;

  points.forEach(p => {
    if (p.lat===null||!p.visible||!style.showAllPoints) return;
    const proj = projectPoint(p.lon,p.lat);
    if (!proj) return;
    const cx = proj.x + p.markerOffset.dx;
    const cy = proj.y + p.markerOffset.dy;

    const circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
    circle.setAttribute("cx", cx.toFixed(1));
    circle.setAttribute("cy", cy.toFixed(1));
    circle.setAttribute("r",  style.markerSize);
    circle.setAttribute("fill", style.markerColor);
    circle.setAttribute("fill-opacity", style.markerOpacity);
    circle.setAttribute("stroke","#fff");
    circle.setAttribute("stroke-width","1.5");
    circle.setAttribute("class","pt-marker");
    circle.setAttribute("data-id", p.id);
    circle.style.cursor = "grab";
    g.appendChild(circle);
  });
  bindMarkerDrag();
}

function renderLabels() {
  const g = document.getElementById("layer-labels");
  g.innerHTML = "";
  if (!leafletMap) return;

  points.forEach(p => {
    if (p.lat===null||!p.labelVisible||!style.showAllLabels) return;
    const proj = projectPoint(p.lon,p.lat);
    if (!proj) return;
    const mx = proj.x + p.markerOffset.dx;
    const my = proj.y + p.markerOffset.dy;

    const text = document.createElementNS("http://www.w3.org/2000/svg","text");
    text.setAttribute("x", (mx+p.labelOffset.dx).toFixed(1));
    text.setAttribute("y", (my+p.labelOffset.dy).toFixed(1));
    text.setAttribute("fill", style.labelColor);
    text.setAttribute("fill-opacity", style.labelOpacity);
    text.setAttribute("font-size", style.labelSize);
    text.setAttribute("font-weight", style.labelBold?"700":"500");
    text.setAttribute("font-family", "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif");
    text.setAttribute("dominant-baseline","middle");
    text.setAttribute("class","pt-label");
    text.setAttribute("data-id", p.id);
    text.style.cursor = "grab";
    text.textContent = p.label || p.resolvedName || p.query;
    g.appendChild(text);
  });
  bindLabelDrag();
}

// ─── Annotations ──────────────────────────────────────────────────────────────

function createAnnotation(text) {
  return {
    id: uid(), text,
    lat: null, lon: null,
    offset: { dx: 0, dy: 0 },
    visible: true,
    status: "loading", error: null,
  };
}

function renderAnnotations() {
  const g = document.getElementById("layer-annotations");
  g.innerHTML = "";
  if (!leafletMap || !annotationStyle.showAll) return;

  annotations.forEach(a => {
    if (!a.visible || a.lat === null) return;
    const proj = projectPoint(a.lon, a.lat);
    if (!proj) return;

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", (proj.x + a.offset.dx).toFixed(1));
    text.setAttribute("y", (proj.y + a.offset.dy).toFixed(1));
    text.setAttribute("fill", annotationStyle.color);
    text.setAttribute("fill-opacity", annotationStyle.opacity);
    text.setAttribute("font-size", annotationStyle.size);
    text.setAttribute("font-weight", annotationStyle.bold ? "700" : "400");
    text.setAttribute("font-family", "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("class", "ann-label");
    text.setAttribute("data-id", a.id);
    text.style.pointerEvents = "auto";
    text.style.cursor = "grab";
    text.textContent = a.text;
    g.appendChild(text);
  });

  bindAnnotationDrag();
}

function bindAnnotationDrag() {
  document.querySelectorAll(".ann-label").forEach(el => {
    el.addEventListener("mousedown", e => {
      e.preventDefault(); e.stopPropagation();
      leafletMap.dragging.disable();
      const a = annotations.find(x => x.id === el.getAttribute("data-id"));
      if (!a) return;
      dragState = { type: "annotation", ann: a, start: clientToSVG(e), origOffset: { ...a.offset } };
    });
  });
}

function renderAnnotationList() {
  const list = document.getElementById("annotation-list");
  if (!list) return;
  list.innerHTML = "";

  annotations.forEach(a => {
    const item = document.createElement("div");
    item.className = "ann-item";

    // Eye toggle
    const eye = document.createElement("button");
    eye.className = "ann-eye" + (a.visible ? " on" : "");
    eye.textContent = a.visible ? "●" : "○";
    eye.title = a.visible ? "Hide" : "Show";
    eye.addEventListener("click", () => {
      a.visible = !a.visible;
      renderAnnotationList();
      renderAnnotations();
    });

    // Editable text
    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "ann-text-input";
    inp.value = a.text;
    inp.addEventListener("input", () => { a.text = inp.value; renderAnnotations(); });
    inp.addEventListener("mousedown", e => e.stopPropagation());

    // Status badge
    const meta = document.createElement("span");
    if (a.status === "loading") {
      meta.className = "ann-meta loading"; meta.textContent = "…";
    } else if (a.status === "error") {
      meta.className = "ann-meta error"; meta.textContent = "?";
      meta.title = a.error || "Not found";
    } else {
      meta.className = "ann-meta";
      meta.textContent = a.lat !== null ? `${a.lat.toFixed(1)}°` : "";
    }

    // Delete
    const del = document.createElement("button");
    del.className = "ann-del"; del.textContent = "×"; del.title = "Remove";
    del.addEventListener("click", () => {
      annotations = annotations.filter(x => x.id !== a.id);
      renderAnnotationList();
      renderAnnotations();
    });

    item.appendChild(eye);
    item.appendChild(inp);
    item.appendChild(meta);
    item.appendChild(del);
    list.appendChild(item);
  });
}

async function addAnnotation(text) {
  text = text.trim();
  if (!text) return;
  const a = createAnnotation(text);
  annotations.push(a);
  renderAnnotationList();

  try {
    let vb = "";
    if (leafletMap) {
      const b = leafletMap.getBounds();
      vb = `&viewbox=${b.getWest()},${b.getNorth()},${b.getEast()},${b.getSouth()}&bounded=0`;
    }
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=1${vb}`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) throw new Error(`Network error ${res.status}`);
    const results = await res.json();
    if (!results.length) throw new Error("Not found");
    a.lat = parseFloat(results[0].lat);
    a.lon = parseFloat(results[0].lon);
    a.status = "ok";
  } catch (err) {
    a.status = "error"; a.error = err.message;
  }

  renderAnnotationList();
  renderAnnotations();
}


// Master render: called on every map view change and state update.
function renderAll() {
  renderOutline();
  renderAnnotations();
  renderRoute();
  renderMarkers();
  renderLabels();
}

function updatePlaceholder() {
  document.getElementById("placeholder-overlay").style.display = geoLayers.length === 0 ? "" : "none";
}


// ─── SVG Drag (markers and labels) ───────────────────────────────────────────

let dragState = null;

function bindMarkerDrag() {
  document.querySelectorAll(".pt-marker").forEach(el => {
    el.addEventListener("mousedown", e => {
      e.preventDefault(); e.stopPropagation();
      leafletMap.dragging.disable();
      const p = points.find(x=>x.id===el.getAttribute("data-id"));
      if (!p) return;
      dragState = { type:"marker", point:p, start:clientToSVG(e), origOffset:{...p.markerOffset} };
    });
  });
}

function bindLabelDrag() {
  document.querySelectorAll(".pt-label").forEach(el => {
    el.addEventListener("mousedown", e => {
      e.preventDefault(); e.stopPropagation();
      leafletMap.dragging.disable();
      const p = points.find(x=>x.id===el.getAttribute("data-id"));
      if (!p) return;
      dragState = { type:"label", point:p, start:clientToSVG(e), origOffset:{...p.labelOffset} };
    });
  });
}

document.addEventListener("mousemove", e => {
  if (!dragState) return;
  const cur = clientToSVG(e);

  // ── Annotation drag ──
  if (dragState.type === "annotation") {
    const dx = cur.x - dragState.start.x;
    const dy = cur.y - dragState.start.y;
    const a  = dragState.ann;
    a.offset.dx = dragState.origOffset.dx + dx;
    a.offset.dy = dragState.origOffset.dy + dy;
    const proj = projectPoint(a.lon, a.lat);
    const el = document.querySelector(`.ann-label[data-id="${a.id}"]`);
    if (el && proj) {
      el.setAttribute("x", (proj.x + a.offset.dx).toFixed(1));
      el.setAttribute("y", (proj.y + a.offset.dy).toFixed(1));
    }
    return;
  }

  // ── Waypoint drag ──
  if (dragState.type === "waypoint") {
    const ll  = leafletMap.containerPointToLatLng([cur.x, cur.y]);
    const wps = routeWaypoints[dragState.segKey];
    if (wps && wps[dragState.wpIndex] !== undefined) {
      wps[dragState.wpIndex] = { lat: ll.lat, lon: ll.lng };
    }
    renderRoute();
    return;
  }

  const dx = cur.x - dragState.start.x;
  const dy = cur.y - dragState.start.y;
  const p  = dragState.point;
  const svg = document.getElementById("overlay-svg");

  if (dragState.type === "marker") {
    p.markerOffset.dx = dragState.origOffset.dx + dx;
    p.markerOffset.dy = dragState.origOffset.dy + dy;
    const proj = projectPoint(p.lon, p.lat);
    const cx = proj.x + p.markerOffset.dx;
    const cy = proj.y + p.markerOffset.dy;
    const circle = svg.querySelector(`.pt-marker[data-id="${p.id}"]`);
    if (circle) { circle.setAttribute("cx",cx.toFixed(1)); circle.setAttribute("cy",cy.toFixed(1)); }
    const label  = svg.querySelector(`.pt-label[data-id="${p.id}"]`);
    if (label)  { label.setAttribute("x",(cx+p.labelOffset.dx).toFixed(1)); label.setAttribute("y",(cy+p.labelOffset.dy).toFixed(1)); }
    renderRoute();
  } else {
    p.labelOffset.dx = dragState.origOffset.dx + dx;
    p.labelOffset.dy = dragState.origOffset.dy + dy;
    const proj = projectPoint(p.lon, p.lat);
    const mx = proj.x + p.markerOffset.dx;
    const my = proj.y + p.markerOffset.dy;
    const label = svg.querySelector(`.pt-label[data-id="${p.id}"]`);
    if (label) { label.setAttribute("x",(mx+p.labelOffset.dx).toFixed(1)); label.setAttribute("y",(my+p.labelOffset.dy).toFixed(1)); }
  }
});

document.addEventListener("mouseup", () => {
  if (dragState) { dragState = null; leafletMap?.dragging.enable(); }
});


// ─── Basemap Management ───────────────────────────────────────────────────────

let googleMapsLoaded = false;

async function loadGoogleMapsAPI(apiKey) {
  if (googleMapsLoaded || window.google?.maps) { googleMapsLoaded = true; return; }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    s.async = true;
    s.onload  = () => { googleMapsLoaded = true; resolve(); };
    s.onerror = () => reject(new Error("Failed to load Google Maps API. Check your API key."));
    document.head.appendChild(s);
  });
}

async function setBasemap(type) {
  if (currentTileLayer) { leafletMap.removeLayer(currentTileLayer); currentTileLayer = null; }
  if (type === "none") return;

  if (type.startsWith("google-")) {
    const key = document.getElementById("google-api-key").value.trim();
    if (!key) throw new Error("Enter a Google Maps API key, then click Apply.");
    await loadGoogleMapsAPI(key);
    if (typeof L.gridLayer?.googleMutant === "undefined")
      throw new Error("Google Maps plugin did not load. Check your network connection.");
    const mapType = type.replace("google-","");
    currentTileLayer = L.gridLayer.googleMutant({ type: mapType });
  } else {
    const cfgs = {
      "osm": ["https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
              { attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom:19 }],
      "carto-light": ["https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
              { attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>', subdomains:"abcd", maxZoom:20 }],
      "carto-dark":  ["https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              { attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>', subdomains:"abcd", maxZoom:20 }],
    };
    const [url, opts] = cfgs[type] || [];
    if (!url) return;
    currentTileLayer = L.tileLayer(url, opts);
  }

  currentTileLayer.addTo(leafletMap);

  // Auto-reduce fill opacity when a basemap is active
  if (style.fillOpacity > 0.75) {
    style.fillOpacity = 0.55;
    const el = document.getElementById("fill-opacity");
    if (el) { el.value = 0.55; document.getElementById("fill-opacity-val").textContent = "0.55"; }
  }
  renderOutline();
}


// ─── Basemap Controls ─────────────────────────────────────────────────────────

document.getElementById("basemap-select").addEventListener("change", async function() {
  const val = this.value;
  const keyRow = document.getElementById("google-key-row");
  keyRow.classList.toggle("hidden", !val.startsWith("google-"));

  if (!val.startsWith("google-")) {
    try { await setBasemap(val); }
    catch(err) { setStatus(err.message); this.value = "none"; }
  }
  // For Google: wait for user to fill key and click Apply
});

document.getElementById("apply-basemap-btn").addEventListener("click", async () => {
  const type = document.getElementById("basemap-select").value;
  // Save key to localStorage for convenience
  const key = document.getElementById("google-api-key").value.trim();
  if (key) localStorage.setItem("gmaps-api-key", key);
  try { await setBasemap(type); setStatus("Basemap applied.", true); }
  catch(err) { setStatus(err.message); }
});

// Restore saved Google key
const savedKey = localStorage.getItem("gmaps-api-key");
if (savedKey) document.getElementById("google-api-key").value = savedKey;


// ─── GeoJSON File Upload ──────────────────────────────────────────────────────

document.getElementById("geojson-upload").addEventListener("change", async function(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  spinner.classList.remove("hidden");
  setStatus("");

  let loaded = 0;
  const errors = [];
  let unionBounds = null;

  for (const file of files) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      let geometry = extractGeometry(json);

      if (geometryCoordCount(geometry) > 2000) {
        const b = geometryBBox(geometry);
        geometry = simplifyGeometry(geometry, Math.max(0.002 * Math.min(b.w || 1, b.h || 1), 0.0005));
      }

      const name = file.name.replace(/\.(geo)?json$/i, "");
      const b = geometryBBox(geometry);

      // Accumulate union bounds across all files in this batch
      if (!unionBounds) {
        unionBounds = { ...b };
      } else {
        unionBounds.minLat = Math.min(unionBounds.minLat, b.minLat);
        unionBounds.maxLat = Math.max(unionBounds.maxLat, b.maxLat);
        unionBounds.minLon = Math.min(unionBounds.minLon, b.minLon);
        unionBounds.maxLon = Math.max(unionBounds.maxLon, b.maxLon);
      }

      // Add without auto-fit — we fit to union after the loop
      geoLayers.push({ id: uid(), name, geometry, source: "file", visible: true });
      loaded++;
    } catch(err) {
      errors.push(`${file.name}: ${err.message}`);
    }
  }

  if (loaded > 0) {
    fitToLayer(unionBounds);
    updatePlaceholder();
    renderLayerList();
    renderAll();
    showSourceBadge(loaded > 1 ? `GeoJSON files (${loaded})` : "GeoJSON file", "");
    const summary = loaded > 1 ? `Loaded ${loaded} files` : `Loaded: ${files[0].name}`;
    setStatus(errors.length ? `${summary} (${errors.length} failed)` : summary, true);
  } else {
    setStatus(`Error: ${errors[0] ?? "No files loaded"}`);
  }

  spinner.classList.add("hidden");
  e.target.value = "";
});


// ─── Layer Management ─────────────────────────────────────────────────────────

// Adds or replaces a geometry layer.
// source "name": replaces the existing name-based layer (keeps file layers).
// source "file": always appends.
// fitMap: whether to pan/zoom Leaflet to the layer's bounds.
function addGeoLayer(geometry, name, source, fitMap = true) {
  if (source === "name") {
    const idx = geoLayers.findIndex(l => l.source === "name");
    const layer = { id: uid(), name, geometry, source, visible: true };
    if (idx >= 0) geoLayers.splice(idx, 1, layer);
    else          geoLayers.unshift(layer);
  } else {
    geoLayers.push({ id: uid(), name, geometry, source, visible: true });
  }

  if (fitMap) fitToLayer(geometryBBox(geometry));
  updatePlaceholder();
  renderLayerList();
  renderAll();
}

function fitToLayer(b) {
  leafletMap.fitBounds(
    [[b.minLat, b.minLon], [b.maxLat, b.maxLon]],
    { padding: [50, 50], animate: false }
  );
}

function renderLayerList() {
  const list = document.getElementById("geo-layer-list");
  if (!list) return;
  list.innerHTML = "";
  if (geoLayers.length === 0) { list.style.display = "none"; return; }
  list.style.display = "";

  geoLayers.forEach(layer => {
    const item = document.createElement("div");
    item.className = "geo-layer-item";

    const eye = document.createElement("button");
    eye.className = "geo-layer-eye" + (layer.visible ? " on" : "");
    eye.title     = layer.visible ? "Hide" : "Show";
    eye.textContent = layer.visible ? "●" : "○";
    eye.addEventListener("click", () => {
      layer.visible = !layer.visible;
      renderLayerList();
      renderOutline();
    });

    const nm = document.createElement("span");
    nm.className   = "geo-layer-name";
    nm.textContent = layer.name;
    nm.title       = layer.name;

    const del = document.createElement("button");
    del.className   = "geo-layer-del";
    del.textContent = "×";
    del.title       = "Remove layer";
    del.addEventListener("click", () => {
      geoLayers = geoLayers.filter(l => l.id !== layer.id);
      updatePlaceholder();
      renderLayerList();
      renderOutline();
    });

    item.appendChild(eye);
    item.appendChild(nm);
    item.appendChild(del);
    list.appendChild(item);
  });
}


// ─── Point Data Model ─────────────────────────────────────────────────────────

// Transport type labels and emoji for each option
const TRANSPORT_OPTIONS = [
  { value:"none",    label:"— none",    icon:""   },
  { value:"plane",   label:"✈ Flight",  icon:"✈"  },
  { value:"train",   label:"🚆 Train",   icon:"🚆" },
  { value:"car",     label:"🚗 Car",     icon:"🚗" },
  { value:"boat",    label:"⛵ Boat",    icon:"⛵" },
  { value:"bus",     label:"🚌 Bus",     icon:"🚌" },
  { value:"bike",    label:"🚲 Bike",    icon:"🚲" },
  { value:"walk",    label:"🚶 Walk",    icon:"🚶" },
];

function createPoint(query, category="city") {
  return {
    id:uid(), query, resolvedName:null, label:"", category,
    lat:null, lon:null,
    markerOffset:{dx:0,dy:0}, labelOffset:{dx:10,dy:-13},
    visible:true, labelVisible:true, inRoute:true,
    transportAfter:"none",          // transport type used to reach the NEXT point
    status:"loading", candidates:[], error:null,
  };
}


// ─── Point Geocoding ──────────────────────────────────────────────────────────

async function geocodePoint(query) {
  let vb = "";
  if (leafletMap) {
    const b = leafletMap.getBounds();
    vb = `&viewbox=${b.getWest()},${b.getNorth()},${b.getEast()},${b.getSouth()}&bounded=0`;
  }
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5${vb}`;
  const res = await fetch(url, { headers:{"Accept-Language":"en"} });
  if (!res.ok) throw new Error(`Network error ${res.status}`);
  return res.json();
}


// ─── Add Point Flow ───────────────────────────────────────────────────────────

async function addPoint(query, category) {
  query = query.trim();
  if (!query) return;
  const p = createPoint(query, category);
  points.push(p);
  renderPointList();

  try {
    const results = await geocodePoint(query);
    if (!results.length) { p.status="error"; p.error="Not found"; }
    else {
      const first = results[0];
      p.lat          = parseFloat(first.lat);
      p.lon          = parseFloat(first.lon);
      p.resolvedName = first.display_name.split(",")[0].trim();
      const matches  = p.resolvedName.toLowerCase()===query.toLowerCase();
      p.status       = (results.length>1&&!matches) ? "ambiguous" : "resolved";
      if (p.status==="ambiguous") p.candidates = results;
    }
  } catch(err) { p.status="error"; p.error=err.message; }

  renderPointList();
  renderAll();
}


// ─── Point List UI ────────────────────────────────────────────────────────────

function renderPointList() {
  const list = document.getElementById("point-list");
  list.innerHTML = "";

  points.forEach(p => {
    const item = document.createElement("div");
    item.className = "point-item";
    item.setAttribute("data-id", p.id);
    item.setAttribute("draggable","true");

    const header = document.createElement("div");
    header.style.cssText = "display:flex;align-items:flex-start;gap:5px;width:100%";

    const handle = document.createElement("div");
    handle.className = "pt-drag-handle";
    handle.textContent = "⠿";

    const info = document.createElement("div");
    info.className = "pt-info";

    const labelInput = document.createElement("input");
    labelInput.type="text"; labelInput.className="pt-label-input";
    labelInput.value = p.label;
    labelInput.placeholder = p.resolvedName||p.query;
    labelInput.addEventListener("input", ()=>{ p.label=labelInput.value; renderLabels(); });
    labelInput.addEventListener("mousedown", e=>e.stopPropagation());

    const meta = document.createElement("div");
    meta.className = "pt-meta"+(p.status==="loading"?" loading":p.status==="error"?" error":"");
    if      (p.status==="loading")   meta.textContent = "Searching…";
    else if (p.status==="error")     meta.textContent = p.error||"Error";
    else if (p.status==="resolved"&&p.lat!==null)
      meta.textContent = `${Number(p.lat).toFixed(2)}°, ${Number(p.lon).toFixed(2)}° · ${p.category}`;
    else if (p.status==="ambiguous") { meta.className="pt-meta error"; meta.textContent="Multiple matches — pick one:"; }

    info.appendChild(labelInput); info.appendChild(meta);

    const toggles = document.createElement("div");
    toggles.className = "pt-toggles";
    [
      {action:"visible",      label:"●", active:p.visible,      title:"Toggle marker"},
      {action:"labelVisible", label:"T", active:p.labelVisible,  title:"Toggle label"},
      {action:"inRoute",      label:"⟶", active:p.inRoute,       title:"Include in route"},
    ].forEach(({action,label,active,title})=>{
      const btn=document.createElement("button");
      btn.className="tog"+(active?" on":""); btn.textContent=label; btn.title=title;
      btn.addEventListener("click",()=>{ p[action]=!p[action]; renderPointList(); renderAll(); });
      toggles.appendChild(btn);
    });

    const del = document.createElement("button");
    del.className="pt-delete"; del.textContent="×"; del.title="Delete";
    del.addEventListener("click",()=>{ points=points.filter(x=>x.id!==p.id); renderPointList(); renderAll(); });

    header.appendChild(handle); header.appendChild(info);
    header.appendChild(toggles); header.appendChild(del);
    item.appendChild(header);

    if (p.status==="ambiguous"&&p.candidates.length) {
      const dis = document.createElement("div");
      dis.className = "pt-candidates";
      p.candidates.slice(0,4).forEach((c,ci)=>{
        const btn=document.createElement("button");
        btn.className="candidate-btn";
        btn.textContent = c.display_name.length>55 ? c.display_name.slice(0,55)+"…" : c.display_name;
        btn.addEventListener("click",()=>resolveWithCandidate(p.id,ci));
        dis.appendChild(btn);
      });
      item.appendChild(dis);
    }

    // Transport-after row (shown when point is in route)
    if (p.inRoute) {
      const trow = document.createElement("div");
      trow.className = "pt-transport-row";

      const tlabel = document.createElement("span");
      tlabel.textContent = "→";

      const tsel = document.createElement("select");
      TRANSPORT_OPTIONS.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        if (opt.value === p.transportAfter) o.selected = true;
        tsel.appendChild(o);
      });
      tsel.addEventListener("change", () => { p.transportAfter = tsel.value; renderRoute(); });
      tsel.addEventListener("mousedown", e => e.stopPropagation());

      trow.appendChild(tlabel);
      trow.appendChild(tsel);
      item.appendChild(trow);
    }

    list.appendChild(item);
  });

  bindListDragDrop();
}

function resolveWithCandidate(id, idx) {
  const p = points.find(x=>x.id===id); if(!p) return;
  const c = p.candidates[idx];
  p.lat=parseFloat(c.lat); p.lon=parseFloat(c.lon);
  p.resolvedName=c.display_name.split(",")[0].trim();
  p.status="resolved"; p.candidates=[];
  renderPointList(); renderAll();
}


// ─── List Drag-and-Drop Reordering ────────────────────────────────────────────

let listDragSrcId = null;

function bindListDragDrop() {
  document.querySelectorAll(".point-item").forEach(item => {
    item.addEventListener("dragstart", e=>{ listDragSrcId=item.getAttribute("data-id"); item.classList.add("dragging"); e.dataTransfer.effectAllowed="move"; });
    item.addEventListener("dragend",   ()=>{ item.classList.remove("dragging"); document.querySelectorAll(".point-item").forEach(i=>i.classList.remove("drag-over")); });
    item.addEventListener("dragover",  e=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; document.querySelectorAll(".point-item").forEach(i=>i.classList.remove("drag-over")); item.classList.add("drag-over"); });
    item.addEventListener("drop", e=>{
      e.preventDefault();
      const tid=item.getAttribute("data-id");
      if (listDragSrcId&&tid&&listDragSrcId!==tid) {
        const si=points.findIndex(x=>x.id===listDragSrcId), ti=points.findIndex(x=>x.id===tid);
        const [moved]=points.splice(si,1); points.splice(ti,0,moved);
        renderPointList(); renderAll();
      }
    });
  });
}


// ─── Global Style Controls ────────────────────────────────────────────────────

function bindRange(id,valId,key,cb){
  const el=document.getElementById(id),val=document.getElementById(valId);
  el.addEventListener("input",()=>{ style[key]=parseFloat(el.value); val.textContent=el.value; cb(); });
}
function bindColor(id,key,cb){ document.getElementById(id).addEventListener("input",e=>{ style[key]=e.target.value; cb(); }); }
function bindCheck(id,key,cb){ document.getElementById(id).addEventListener("change",e=>{ style[key]=e.target.checked; cb(); }); }

// Background color
document.getElementById("bg-color").addEventListener("input", e => {
  style.bgColor = e.target.value;
  applyBgColor();
});

function applyBgColor() {
  const mc = document.getElementById("map-container");
  if (mc) mc.style.background = style.bgColor;
  // Also override Leaflet's own background
  const lc = document.querySelector(".leaflet-container");
  if (lc) lc.style.background = style.bgColor;
}

// Map fill + opacity
document.getElementById("fill-color").addEventListener("input", e=>{
  style.mapFill = e.target.value;
  document.querySelectorAll(".map-path").forEach(p=>p.setAttribute("fill",style.mapFill));
});
bindRange("fill-opacity","fill-opacity-val","fillOpacity", renderOutline);

// Markers
bindColor("marker-color",   "markerColor",   renderMarkers);
bindRange("marker-size",    "marker-size-val",    "markerSize",    renderMarkers);
bindRange("marker-opacity", "marker-opacity-val", "markerOpacity", renderMarkers);
bindCheck("show-all-points","showAllPoints", renderAll);

// Labels
bindColor("label-color",    "labelColor",    renderLabels);
bindRange("label-size",     "label-size-val",    "labelSize",    renderLabels);
bindRange("label-opacity",  "label-opacity-val", "labelOpacity", renderLabels);
bindCheck("show-all-labels","showAllLabels", renderAll);
bindCheck("label-bold",     "labelBold",     renderLabels);

// Annotation style
document.getElementById("annotation-color").addEventListener("input", e => {
  annotationStyle.color = e.target.value;
  document.querySelectorAll(".ann-label").forEach(el => el.setAttribute("fill", annotationStyle.color));
});
document.getElementById("annotation-size").addEventListener("input", function() {
  annotationStyle.size = parseFloat(this.value);
  document.getElementById("annotation-size-val").textContent = this.value;
  renderAnnotations();
});
document.getElementById("annotation-opacity").addEventListener("input", function() {
  annotationStyle.opacity = parseFloat(this.value);
  document.getElementById("annotation-opacity-val").textContent = this.value;
  document.querySelectorAll(".ann-label").forEach(el => el.setAttribute("fill-opacity", annotationStyle.opacity));
});
document.getElementById("annotation-bold").addEventListener("change", e => {
  annotationStyle.bold = e.target.checked;
  document.querySelectorAll(".ann-label").forEach(el => el.setAttribute("font-weight", annotationStyle.bold ? "700" : "400"));
});
document.getElementById("show-all-annotations").addEventListener("change", e => {
  annotationStyle.showAll = e.target.checked;
  renderAnnotations();
});

// Add annotation
document.getElementById("add-annotation-btn").addEventListener("click", () => {
  const inp = document.getElementById("annotation-input");
  const q = inp.value.trim();
  if (q) { addAnnotation(q); inp.value = ""; }
});
document.getElementById("annotation-input").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("add-annotation-btn").click();
});

// Route
bindCheck("route-visible",  "routeVisible",  renderRoute);
bindColor("route-color",    "routeColor",    renderRoute);
bindRange("route-width",    "route-width-val",   "routeWidth",   renderRoute);
bindRange("route-opacity",  "route-opacity-val", "routeOpacity", renderRoute);
document.getElementById("route-dash").addEventListener("change", e => { style.routeDash = e.target.value; renderRoute(); });
bindCheck("show-transport-icons","showTransportIcons", renderRoute);

// Route edit mode toggle
document.getElementById("route-edit-btn").addEventListener("click", () => {
  routeEditMode = !routeEditMode;
  const btn = document.getElementById("route-edit-btn");
  btn.textContent = routeEditMode ? "Done" : "Edit";
  btn.classList.toggle("active", routeEditMode);
  // Disable/enable Leaflet scroll zoom & drag in edit mode so map doesn't move while clicking
  if (routeEditMode) {
    leafletMap?.scrollWheelZoom.disable();
  } else {
    leafletMap?.scrollWheelZoom.enable();
  }
  renderRoute();
});

// Resolution — reload current map when changed
document.getElementById("map-resolution").addEventListener("change", ()=>{
  const nameLayer = geoLayers.find(l => l.source === "name");
  if (nameLayer) loadMap();
});

// Add Point UI
document.getElementById("add-point-btn").addEventListener("click", ()=>{
  const inp=document.getElementById("point-input");
  const cat=document.getElementById("point-category").value;
  const q=inp.value.trim();
  if(q){ addPoint(q,cat); inp.value=""; }
});
document.getElementById("point-input").addEventListener("keydown", e=>{ if(e.key==="Enter") document.getElementById("add-point-btn").click(); });


// ─── Load Map Flow ────────────────────────────────────────────────────────────

const loadBtn    = document.getElementById("load-btn");
const placeInput = document.getElementById("place-input");
const gadmSuggestions = document.getElementById("gadm-suggestions");
const spinner    = document.getElementById("spinner");
const statusEl   = document.getElementById("status");
let selectedGADMOption = null;
let activeGADMSuggestion = -1;

function setStatus(msg, ok=false) {
  statusEl.textContent = msg;
  statusEl.className   = "status"+(ok?" ok":"");
}

async function loadMap() {
  const name = placeInput.value.trim();
  if (!name) { setStatus("Please enter a place name."); return; }

  const gadmOption = resolveGADMInput();
  if (gadmOption) {
    await loadGADMMap(gadmOption);
    return;
  }

  loadBtn.disabled = true;
  spinner.classList.remove("hidden");
  setStatus("");

  try {
    const geometry = await fetchBoundary(name);
    addGeoLayer(geometry, name, "name");
    setStatus(`Showing: ${name}`, true);
  } catch(err) {
    setStatus(err.message);
  } finally {
    loadBtn.disabled = false;
    spinner.classList.add("hidden");
  }
}

loadBtn.addEventListener("click", loadMap);

function hideGADMSuggestions() {
  activeGADMSuggestion = -1;
  gadmSuggestions.classList.remove("visible");
  gadmSuggestions.innerHTML = "";
}

function chooseGADMOption(option, loadNow = false) {
  selectedGADMOption = option;
  placeInput.value = option.name;
  hideGADMSuggestions();
  if (loadNow) loadGADMMap(option);
}

function renderGADMSuggestions(matches) {
  gadmSuggestions.innerHTML = "";
  if (!matches.length) {
    hideGADMSuggestions();
    return;
  }

  matches.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gadm-option" + (index === activeGADMSuggestion ? " active" : "");
    btn.setAttribute("role", "option");
    btn.innerHTML = `<span>${escapeHtml(option.name)}</span><span class="gadm-option-code">${option.code}</span>`;
    btn.addEventListener("mousedown", e => e.preventDefault());
    btn.addEventListener("click", () => chooseGADMOption(option, true));
    gadmSuggestions.appendChild(btn);
  });

  gadmSuggestions.classList.add("visible");
}

function updateGADMSuggestions() {
  selectedGADMOption = null;
  activeGADMSuggestion = -1;
  renderGADMSuggestions(getGADMCountryMatches(placeInput.value));
}

function resolveGADMInput() {
  if (selectedGADMOption) return selectedGADMOption;
  const query = placeInput.value.trim();
  const exactCode = lookupGADMCode(query);
  const matches = getGADMCountryMatches(query);
  if (exactCode) return matches.find(option => option.code === exactCode) || GADM_COUNTRIES.find(option => option.code === exactCode);
  return null;
}

async function loadGADMMap(option = resolveGADMInput()) {
  if (!option) { setStatus("Please choose a country from the list or enter a region."); return; }

  loadBtn.disabled = true;
  spinner.classList.remove("hidden");
  setStatus(`Loading gadm_js/gadm41_${option.code}_0.js...`);

  try {
    const geometry = await fetchGADMFile(option.code);
    addGeoLayer(geometry, option.name, "file");
    placeInput.value = option.name;
    selectedGADMOption = option;
    hideGADMSuggestions();
    showSourceBadge(`GADM 4.1 · ${option.code}`, "natural-earth");
    setStatus(`Added JSON map: ${option.name}`, true);
  } catch(err) {
    setStatus(err.message);
  } finally {
    loadBtn.disabled = false;
    spinner.classList.add("hidden");
  }
}

placeInput.addEventListener("input", updateGADMSuggestions);
placeInput.addEventListener("focus", () => renderGADMSuggestions(getGADMCountryMatches(placeInput.value)));
placeInput.addEventListener("keydown", e => {
  const matches = getGADMCountryMatches(placeInput.value);
  if (e.key === "ArrowDown" && matches.length) {
    e.preventDefault();
    activeGADMSuggestion = Math.min(activeGADMSuggestion + 1, matches.length - 1);
    renderGADMSuggestions(matches);
  } else if (e.key === "ArrowUp" && matches.length) {
    e.preventDefault();
    activeGADMSuggestion = Math.max(activeGADMSuggestion - 1, 0);
    renderGADMSuggestions(matches);
  } else if (e.key === "Enter") {
    e.preventDefault();
    const option = activeGADMSuggestion >= 0 ? matches[activeGADMSuggestion] : matches[0];
    if (option) {
      chooseGADMOption(option);
      loadGADMMap(option);
    } else {
      loadMap();
    }
  } else if (e.key === "Escape") {
    hideGADMSuggestions();
  }
});
document.addEventListener("click", e => {
  if (!e.target.closest(".gadm-search")) hideGADMSuggestions();
});


// ─── Save / Load Project ──────────────────────────────────────────────────────

function saveProject() {
  const mapView = leafletMap
    ? { center: [leafletMap.getCenter().lat, leafletMap.getCenter().lng], zoom: leafletMap.getZoom() }
    : null;

  const data = {
    version:   4,
    style,
    annotationStyle,
    geoLayers:   geoLayers.map(l => ({ id:l.id, name:l.name, geometry:l.geometry, source:l.source, visible:l.visible })),
    points:      points.map(p => ({ ...p, candidates:[] })),
    annotations: annotations.map(a => ({ ...a })),
    routeWaypoints,
    mapView,
    basemap:   document.getElementById("basemap-select").value,
    placeInput: document.getElementById("place-input").value,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = (document.getElementById("place-input").value.trim() || "project") + ".mapjson";
  a.click();
  URL.revokeObjectURL(url);
  setStatus("Project saved.", true);
}

function loadProject(json) {
  if (!json.version || !json.style) throw new Error("Invalid project file.");

  // Restore style
  Object.assign(style, json.style);

  // Sync all UI controls to restored style
  syncUIFromStyle();

  // Restore annotation style
  if (json.annotationStyle) Object.assign(annotationStyle, json.annotationStyle);
  syncAnnotationUI();

  // Restore annotations
  annotations = (json.annotations || []);
  renderAnnotationList();

  // Restore waypoints (and exit any active edit mode)
  routeWaypoints = json.routeWaypoints || {};
  routeEditMode  = false;
  const editBtn  = document.getElementById("route-edit-btn");
  if (editBtn) { editBtn.textContent = "Edit"; editBtn.classList.remove("active"); }

  // Restore layers
  geoLayers = (json.geoLayers || []);
  renderLayerList();
  updatePlaceholder();

  // Restore points
  points = (json.points || []).map(p => ({ ...createPoint(p.query, p.category), ...p }));
  renderPointList();

  // Restore map view
  if (json.mapView && leafletMap) {
    leafletMap.setView(json.mapView.center, json.mapView.zoom, { animate:false });
  }

  // Restore place input
  if (json.placeInput) document.getElementById("place-input").value = json.placeInput;

  renderAll();
  setStatus("Project loaded.", true);
}

// Sync annotation UI controls to annotationStyle
function syncAnnotationUI() {
  const set    = (id, val) => { const el=document.getElementById(id); if(el) el.value=val; };
  const setChk = (id, val) => { const el=document.getElementById(id); if(el) el.checked=val; };
  const setTxt = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
  set("annotation-color",   annotationStyle.color);
  set("annotation-size",    annotationStyle.size);    setTxt("annotation-size-val",    annotationStyle.size);
  set("annotation-opacity", annotationStyle.opacity); setTxt("annotation-opacity-val", annotationStyle.opacity);
  setChk("annotation-bold",         annotationStyle.bold);
  setChk("show-all-annotations",    annotationStyle.showAll);
}

// Sync all left-panel UI inputs to match the current `style` object
function syncUIFromStyle() {
  const set = (id, val) => { const el=document.getElementById(id); if(el) el.value=val; };
  const setChk = (id, val) => { const el=document.getElementById(id); if(el) el.checked=val; };
  const setTxt = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };

  set("bg-color",      style.bgColor);               applyBgColor();
  set("fill-color",    style.mapFill);
  set("fill-opacity",  style.fillOpacity);            setTxt("fill-opacity-val",  style.fillOpacity);
  set("marker-color",  style.markerColor);
  set("marker-size",   style.markerSize);             setTxt("marker-size-val",   style.markerSize);
  set("marker-opacity",style.markerOpacity);          setTxt("marker-opacity-val",style.markerOpacity);
  set("label-color",   style.labelColor);
  set("label-size",    style.labelSize);              setTxt("label-size-val",    style.labelSize);
  set("label-opacity", style.labelOpacity);           setTxt("label-opacity-val", style.labelOpacity);
  setChk("label-bold",          style.labelBold);
  setChk("show-all-points",     style.showAllPoints);
  setChk("show-all-labels",     style.showAllLabels);
  setChk("route-visible",       style.routeVisible);
  set("route-color",   style.routeColor);
  set("route-width",   style.routeWidth);             setTxt("route-width-val",   style.routeWidth);
  set("route-opacity", style.routeOpacity);           setTxt("route-opacity-val", style.routeOpacity);
  set("route-dash",    style.routeDash);
  setChk("show-transport-icons",style.showTransportIcons);
}

document.getElementById("save-btn").addEventListener("click", saveProject);

document.getElementById("load-project-input").addEventListener("change", async function(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const json = JSON.parse(await file.text());
    loadProject(json);
  } catch(err) {
    setStatus("Load error: " + err.message);
  }
  e.target.value = "";
});


// ─── Export ───────────────────────────────────────────────────────────────────

function exportSVG() {
  const box    = document.querySelector(".preview-box");
  const w      = box.clientWidth;
  const h      = box.clientHeight;
  const svgSrc = document.getElementById("overlay-svg");

  // Build a standalone SVG with background + all overlay content
  const ns  = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("xmlns", ns);
  svg.setAttribute("width",  w);
  svg.setAttribute("height", h);
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

  // Background rect
  const bg = document.createElementNS(ns, "rect");
  bg.setAttribute("width",  w);
  bg.setAttribute("height", h);
  bg.setAttribute("fill", style.bgColor);
  svg.appendChild(bg);

  // Clone all overlay SVG content (defs + layers)
  Array.from(svgSrc.childNodes).forEach(node => svg.appendChild(node.cloneNode(true)));

  const serialized = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([serialized], { type:"image/svg+xml" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = (document.getElementById("place-input").value.trim() || "map") + ".svg";
  a.click();
  URL.revokeObjectURL(url);
  setStatus("SVG exported.", true);
}

async function exportPNG() {
  if (typeof html2canvas === "undefined") {
    setStatus("html2canvas not loaded — PNG export unavailable.");
    return;
  }
  const box = document.querySelector(".preview-box");
  setStatus("Rendering PNG…");
  try {
    const canvas = await html2canvas(box, {
      useCORS:        true,
      allowTaint:     true,
      backgroundColor: style.bgColor,
      scale:          2,   // 2× for retina-quality output
      logging:        false,
    });
    const url = canvas.toDataURL("image/png");
    const a   = document.createElement("a");
    a.href     = url;
    a.download = (document.getElementById("place-input").value.trim() || "map") + ".png";
    a.click();
    setStatus("PNG exported.", true);
  } catch(err) {
    setStatus("PNG export failed: " + err.message);
  }
}

document.getElementById("export-svg-btn").addEventListener("click", exportSVG);
document.getElementById("export-png-btn").addEventListener("click", exportPNG);


// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const sun  = document.getElementById("theme-icon-sun");
  const moon = document.getElementById("theme-icon-moon");
  if (theme === "dark") {
    // dark mode active: show sun (click to go light)
    if (sun)  sun.style.display  = "";
    if (moon) moon.style.display = "none";
  } else {
    // light mode active: show moon (click to go dark)
    if (sun)  sun.style.display  = "none";
    if (moon) moon.style.display = "";
  }
}

document.getElementById("theme-btn").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next    = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("app-theme", next);
});

// Restore saved theme (or system preference)
(function initTheme() {
  const saved   = localStorage.getItem("app-theme");
  const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(saved || prefers);
})();


// ─── Boot ─────────────────────────────────────────────────────────────────────

initLeaflet();
applyBgColor();
