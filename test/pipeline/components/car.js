const {type} = require('reflectype/src/decorators');
const autowired = require('../../../decorators/autowired');
const Fuel = require('./driver.js');
const Vehicle = require('./vehicle');

module.exports = class Car extends Vehicle{

    static count = 0;

    id = ++this.constructor.count;

    name = 'car';
}