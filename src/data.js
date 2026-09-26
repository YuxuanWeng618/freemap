// Original, fictional listings. Coordinates represent neighbourhood examples, not collection addresses.
const areas = [
  ['Tiong Bahru',1.2858,103.8275], ['Queenstown',1.2954,103.8053],
  ['Clementi',1.3151,103.7652], ['Bukit Timah',1.3361,103.7857],
  ['Bishan',1.3506,103.8488], ['Toa Payoh',1.3343,103.8563],
  ['Serangoon',1.3498,103.8738], ['Geylang',1.3182,103.8870],
  ['Katong',1.3050,103.9035], ['Bedok',1.3249,103.9300],
  ['Tampines',1.3520,103.9440], ['Ang Mo Kio',1.3691,103.8454],
];
const catalogue = {
  furniture: ['Oak lounge chair','Little bedside table','Two dining chairs','Low wooden bookshelf','Three-seat fabric sofa','Vintage writing desk','Rattan side table','Compact shoe cabinet','Solid wood dresser','Reading armchair','Round coffee table','Small kitchen trolley'],
  electronics: ['24-inch desktop monitor','Desk lamp, warm white','Computer keyboard','Small Bluetooth speaker','Standing fan','USB webcam','LED reading light','Computer mouse','Wi-Fi router','Working rice cooker','Wired headphones','Monitor stand'],
  materials: ['Pine boards for your next project','Leftover ceramic tiles','Cotton fabric offcuts','Garden pots, set of three','Wooden shelf brackets','Spare craft paper','Small plywood sheets','Paintbrushes and a roller','Bag of clean wood offcuts','Yarn for a weekend project','Spare door handles','Planter boxes'],
  boxes: ['Moving boxes, set of six','Sturdy book boxes','Large packing cartons','Shoe boxes for storage','Flat-pack shipping boxes','Clean bubble wrap and boxes','Archive boxes','Small gift boxes','Five moving cartons','Packing paper and boxes','Storage boxes with lids','Heavy-duty cardboard boxes'],
  bikes: ['City bicycle, ready to ride','Adult cycling helmet','Rear bike basket','Bicycle floor pump','Kids’ balance bike','Spare bicycle tyres','Bike lights, front and rear','Bicycle repair stand','Folding bike — needs a tune-up','Cycling pannier bag','Bike lock and keys','Spare bicycle saddle'],
};
const photoFor = { 'furniture-0': 'chair.jpg', 'electronics-0': 'monitor.jpg', 'bikes-0': 'bicycle.jpg' };
const hours = [0.3, 1.1, 1.8, 3, 5, 8, 14, 21, 30, 45, 62, 96];
export function createDemoItems(anchor = Date.now()) {
  return areas.flatMap(([locationLabel, latitude, longitude], areaIndex) => Object.entries(catalogue).map(([category, titles], j) => {
    const shift = ((areaIndex * 3 + j * 7) % 11) - 5;
    return {
      id: `${category}-${areaIndex}`, title: titles[areaIndex], category,
      latitude: latitude + (j - 2) * 0.006,
      longitude: longitude + shift * 0.0027,
      locationLabel, locationPrecision: 'approximate',
      imageUrl: photoFor[`${category}-${areaIndex}`] ? `./assets/${photoFor[`${category}-${areaIndex}`]}` : null,
      postedAt: new Date(anchor - hours[(areaIndex + j * 3) % hours.length] * 3600000).toISOString(),
      description: ['A useful little find looking for a new home. This sample listing shows how a free offer appears on the map.', 'A second life starts with a small discovery. Explore the details and save it to your stash.'][(areaIndex+j)%2],
      sourceUrl: null, sourceName: 'Demo listing', pickupNote: 'Sample offer · no collection available',
      availability: 'unknown', isDemo: true,
    };
  }));
}
