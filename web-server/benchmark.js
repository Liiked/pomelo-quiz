var siege = require('siege');

siege('node app.js')
    .wait(5000)
    .on(80)
    .concurrent(400)
    .for(2).times
    .get('/')
    .attack();