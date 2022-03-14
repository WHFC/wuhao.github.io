require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
const networkJson = require('./utils/network.json')
const { nnemonic } = require('./utils/nnemonic.json')

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers : [{
      version: "0.6.2",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }]
  },
  defaultNetwork: "ropsten",
  networks : {
    dev: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    goerli: {
      url: networkJson.goerliUrl,
      accounts: nnemonic,
    },
    ropsten: {
      url: networkJson.ropstenUrl,
      accounts: nnemonic,
      timeout: 999999,
    }
  },
  paths: {
    sources: "./flattened",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: {
      ropsten: networkJson.scankey
    }
  }
};