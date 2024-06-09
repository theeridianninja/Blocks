const Docker = require('dockerode');
const docker = new Docker();

/* !TODO: Allow for users to add additional dockers to manage */
module.exports.main = (async () => {
    console.log(await docker.listContainers({}))
    module.exports = await docker.listContainers({})
})