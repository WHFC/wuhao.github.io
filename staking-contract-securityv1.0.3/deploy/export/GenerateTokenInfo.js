fs = require('fs');
const { promisify } = require('util');
const { TOKENS } = require('../../config/defaultlist.token.js');
const { CONFIG } = require('../../config/config.js');
module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const {deployer} = await ethers.getNamedSigners();

    let tokens = []
    for (let i = 0; i < TOKENS.length; i ++) {
        console.log("(" + (i + 1) + "," + TOKENS.length + ")");
        let erc20 = await ethers.getContractAt('ERC20', TOKENS[i].address);
        tokens.push({
            symbol: await erc20.symbol(),
            name: await erc20.name(),
            decimals: await erc20.decimals(),
            address: erc20.address,
            projectLink: "",
            image: CONFIG.imageRootURL + erc20.address.toLowerCase() + "." + CONFIG.imageSuffix,
        });
    }
    let tokensStr = JSON.stringify(tokens, null, 4);
    console.log(tokensStr);
    if (hre.network.tags.local) {
        return;
    }
    let fileName = './config/defaultlist.token.js';
    console.log(fileName);
    const writeFileAsync = promisify(fs.writeFile)
    await writeFileAsync(fileName, "module.exports.TOKENS = " + tokensStr);
};

module.exports.tags = ['ExportDefaultlistTokenInfo'];
module.exports.dependencies = [];
