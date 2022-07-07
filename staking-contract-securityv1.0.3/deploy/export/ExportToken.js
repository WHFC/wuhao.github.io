fs = require('fs');
const { promisify } = require('util');
const { TOKENS } = require('../../config/defaultlist.token.js');
const { CONFIG } = require('../../config/config.js');
const { formatSymbol } = require('../../util/common.js');
module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    let tokens = {}
    //first add our contract to the list
    let imagePrefix = CONFIG.imageRootURL;
    //platform token
    let token = await ethers.getContract('KIKIToken');
    console.log("(1" + "," + (TOKENS.length + 1) + ")");
    tokens[formatSymbol(await token.symbol()).toLowerCase()] = {
        symbol: await token.symbol(),
        name: await token.name(),
        decimals: await token.decimals(),
        address: token.address,
        projectLink: "",
        image: imagePrefix + CONFIG.tokenName + '.' + CONFIG.imageSuffix,
    }
    for (let i = 0; i < TOKENS.length; i ++) {
        console.log("(" + (i + 2) + "," + (TOKENS.length + 1) + ")");
        let token = null;
        if (hre.network.tags.local || hre.network.tags.test) {
            token = await ethers.getContract('MockToken_' + TOKENS[i].symbol);
        } else {
            token = await ethers.getContractAt('ERC20', TOKENS[i].address);
        }
        tokens[formatSymbol((await token.symbol())).toLowerCase()] = {
            symbol: formatSymbol((await token.symbol())),
            name: await token.name(),
            decimals: await token.decimals(),
            address: token.address,
            projectLink: "",
            image: TOKENS[i].image,
        }
    }
    let tokensStr = JSON.stringify(tokens, null, 4);
    console.log(tokensStr);
    if (hre.network.tags.local) {
        return;
    }
    let fileName = './config/token.' + (await getChainId()) + ".js";
    console.log(fileName);
    const writeFileAsync = promisify(fs.writeFile)
    await writeFileAsync(fileName, "module.exports.TOKENS = " + tokensStr);
};

module.exports.tags = ['ExportToken'];
if (hre.network.tags.local) {
    module.exports.dependencies = ['KIKIToken', 'MockToken'];
} else {
    module.exports.dependencies = [];
}
