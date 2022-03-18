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
      version: "0.5.16",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },{
      version: "0.6.6",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },{
      version: "0.6.12",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },{
      version: "0.8.0",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }]
  },
  defaultNetwork: "dev",
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
    // sources: "./contracts/uniswap-v2-core-master/contracts",
    // sources: "./contracts/uniswap-v2-periphery-master/contracts",
    // sources: "./contracts/UniswapMarket",
    // sources: "./flattened/uniswap-v2-core-master",
    // sources: "./flattened/uniswap-v2-periphery-master",
    // sources: "./flattened/AirToken",
    // sources: "./contracts/UniswapMarket",
    sources: "./contracts/sushiswap/contracts",
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