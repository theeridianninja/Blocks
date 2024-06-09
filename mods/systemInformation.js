const os = require('os')

module.exports.main = (async () => {
    const average = array => array.reduce((a, b) => a + b) / array.length;
    const loadavg = average(os.loadavg())
    const cpus = os.cpus().length
    module.exports = {
        freemem: Math.round(os.freemem() / 1073741824), totalmem: Math.round(os.totalmem() / 1073741824),
        cpus: cpus, loadavg: loadavg
    }
});