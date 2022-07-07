const { ethers } = require("hardhat");
const Web3 = require('web3');
const { providerUrl } = require('./InterestArbitrage/config/InterestArbitrageConfig.json');

async function main() {
    var web3 = await new Web3(Web3.givenProvider || providerUrl[network.name]);
    let blockNumber = 7149291;//web3.eth.getBlockNumber();
    console.log(blockNumber);
    let count = 100;
    while (count > 0) {
        // await web3.eth.getBlock(blockNumber, (result) => {
        //     console.log(result);
        // });
        await web3.eth.getBlock(blockNumber).then(console.log);
        --count;
        blockNumber++;
    }
}
  
  main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });