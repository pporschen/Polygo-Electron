const fetch = require('node-fetch');
const Wkt = require('Wicket');
const turf = require('@turf/turf');
const wkt = new Wkt.Wkt();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const WKTtoGJ = (wktInput) => {
    wkt.read(wktInput);
    return wkt.WKTtoGeoJSON();
};

const GJtoWKT= (GeoJsonInput) => {
    wkt.read(GeoJsonInput);
    return wkt.write();
}

const geocoder = async (address) => {
    try{
        const fetcher = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const response = await fetcher.json();
        const {lat, lon} = response[0];
        //console.log(response[0]);
        return [lat, lon];

    } catch(err){
       console.log(err)
        return err
    }
};

const calculateRadius = (radius, latlon) => {
    const [lat, lon] = latlon;
    const normalPolygon = [[0,0.008983204953],[0.0006266367004,0.008961322318],[0.00125022049,0.00889578102],[0.001867713331,0.008786900372],[0.00247610686,0.008635210828],[0.003072437046,0.008441451406],[0.003653798627,0.00820656608],[0.004217359268,0.00793169919],[0.004760373359,0.007618189858],[0.00528019539,0.007267565471],[0.005774292839,0.006881534236],[0.006240258514,0.006461976858],[0.006675822277,0.006010937378],[0.007078862105,0.005530613215],[0.007447414428,0.00502334446],[0.007779683697,0.004491602477],[0.008074051129,0.003937977857],[0.008329082595,0.003365167806],[0.008543535608,0.002775962995],[0.008716365375,0.002173233971],[0.008846729885,0.00155991717],[0.008933994017,0.000939000609],[0.008977732628,0.0003135093317],[0.008977732628,-0.0003135093317],[0.008933994017,-0.000939000609],[0.008846729885,-0.00155991717],[0.008716365375,-0.002173233971],[0.008543535608,-0.002775962995],[0.008329082595,-0.003365167806],[0.008074051129,-0.003937977857],[0.007779683697,-0.004491602477],[0.007447414428,-0.00502334446],[0.007078862105,-0.005530613215],[0.006675822277,-0.006010937377],[0.006240258514,-0.006461976858],[0.005774292839,-0.006881534236],[0.00528019539,-0.007267565471],[0.004760373359,-0.007618189858],[0.004217359268,-0.00793169919],[0.003653798627,-0.00820656608],[0.003072437046,-0.008441451406],[0.00247610686,-0.008635210828],[0.001867713331,-0.008786900372],[0.00125022049,-0.00889578102],[0.0006266367004,-0.008961322318],[0.00E+00,-0.008983204953],[-0.0006266367004,-0.008961322318],[-0.00125022049,-0.00889578102],[-0.001867713331,-0.008786900372],[-0.00247610686,-0.008635210828],[-0.003072437046,-0.008441451406],[-0.003653798627,-0.00820656608],[-0.004217359268,-0.00793169919],[-0.004760373359,-0.007618189858],[-0.00528019539,-0.007267565471],[-0.005774292839,-0.006881534236],[-0.006240258514,-0.006461976858],[-0.006675822277,-0.006010937377],[-0.007078862105,-0.005530613215],[-0.007447414428,-0.00502334446],[-0.007779683697,-0.004491602477],[-0.008074051129,-0.003937977857],[-0.008329082595,-0.003365167806],[-0.008543535608,-0.002775962995],[-0.008716365375,-0.002173233971],[-0.008846729885,-0.00155991717],[-0.008933994017,-0.000939000609],[-0.008977732628,-0.0003135093317],[-0.008977732628,0.0003135093317],[-0.008933994017,0.000939000609],[-0.008846729885,0.00155991717],[-0.008716365375,0.002173233971],[-0.008543535608,0.002775962995],[-0.008329082595,0.003365167806],[-0.008074051129,0.003937977857],[-0.007779683697,0.004491602477],[-0.007447414428,0.00502334446],[-0.007078862105,0.005530613215],[-0.006675822277,0.006010937378],[-0.006240258514,0.006461976858],[-0.005774292839,0.006881534236],[-0.00528019539,0.007267565471],[-0.004760373359,0.007618189858],[-0.004217359268,0.00793169919],[-0.003653798627,0.00820656608],[-0.003072437046,0.008441451406],[-0.00247610686,0.008635210828],[-0.001867713331,0.008786900372],[-0.00125022049,0.00889578102],[-0.0006266367004,0.008961322318],[0,0.008983204953]];
    const newPolygon = normalPolygon.map( coords => [parseFloat(lon) + coords[1]  * radius * 1/Math.cos(parseFloat(lat) * Math.PI / 180), parseFloat(lat) + coords[0]  * radius]);
    const radiusGJ = turf.polygon([newPolygon]);
    console.log(radiusGJ);

    return radiusGJ;
};

const calculateBoundaries = (polygon) => {
    console.log(turf.bbox(polygon))
    const [minX, minY, maxX, maxY] =  turf.bbox(polygon);
    const searchFactor = 30;

    const lat1 = maxY + 0.008983204953 *  searchFactor
    const lat2 = minY - 0.008983204953 * searchFactor
    const lon1 = maxX + 0.008983204953 *  1/Math.cos(maxY * Math.PI / 180) * searchFactor
    const lon2 = minX - 0.008983204953 *  1/Math.cos(minY * Math.PI / 180) * searchFactor

    return [lat1, lat2, lon1, lon2]

};

const dbLookUp = (boundaries) => {
    // sqlite table rows: postcode,name,wkt,lat_centroid,lon_centroid,area

    const [lat1, lat2, lon1, lon2] = boundaries; 
    const dbPath = path.resolve(__dirname, '../db/PLZ.db')
    console.log(boundaries)
    const query = `SELECT * FROM PLZDE WHERE ${lat1} > lat_centroid AND lat_centroid > ${lat2} AND ${lon1} > lon_centroid AND lon_centroid > ${lon2}`;

    let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Connected to the PLZ database.');
      });

      db.serialize(() => {
        db.each(query, (err, row) => {
          if (err) {
            console.error(err.message);
          }
          console.log(row.postcode + "\t" + row.name);
        });
      });
      
      db.close((err) => {
        if (err) {
          console.error(err.message);
        }
        console.log('Close the database connection.');
      });
};




geocoder('Bauer Landstraße 17, 24939 Flensburg')
    .then(res => calculateRadius(10, res))
    .then(res => calculateBoundaries(res))
    .then(res => dbLookUp(res))
    .catch(err => console.log(err))



