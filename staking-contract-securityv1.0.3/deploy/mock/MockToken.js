const { TOKENS } = require('../../config/defaultlist.token.js');
module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {

    const {deploy} = deployments;
    const {deployer} = await ethers.getNamedSigners();
    if (!hre.network.tags.local && !hre.network.tags.test) {
        return;
    }
    for (let i = 0; i < TOKENS.length; i ++) {
        let token = TOKENS[i];
        if (token.symbol == 'WBNB' || token.symbol == 'WHT' || token.symbol == 'WETH') {
            //console.dir(token);
            await deploy('MockToken_' + token.symbol, {
                from: deployer.address,
                args: [token.name, token.symbol, token.decimals],
                log: true,
                contract: 'WETH',
            });
        } else {
            await deploy('MockToken_' + token.symbol, {
               from: deployer.address,
               args: [token.name, token.symbol, token.decimals],
               log: true,
               contract: 'MockToken',
            });
        }
    }
};

module.exports.tags = ['MockToken'];
module.exports.dependencies = [];
