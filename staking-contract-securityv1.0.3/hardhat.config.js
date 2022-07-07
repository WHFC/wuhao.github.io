require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("hardhat-spdx-license-identifier");
require('hardhat-deploy');
require ('hardhat-abi-exporter');
require("@nomiclabs/hardhat-ethers");
require("dotenv/config")
require("@nomiclabs/hardhat-etherscan")

let accounts = [];
var fs = require("fs");
var read = require('read');
var util = require('util');
const keythereum = require("keythereum");
const prompt = require('prompt-sync')();
(async function() {
    try {
        const root = '.keystore';
        var pa = fs.readdirSync(root);
        for (let index = 0; index < pa.length; index ++) {
            let ele = pa[index];
            let fullPath = root + '/' + ele;
		    var info = fs.statSync(fullPath);
            //console.dir(ele);
		    if(!info.isDirectory() && ele.endsWith(".keystore")){
                const content = fs.readFileSync(fullPath, 'utf8');
                const json = JSON.parse(content);
                const password = prompt('Input password for 0x' + json.address + ': ', {echo: '*'});
                //console.dir(password);
                const privatekey = keythereum.recover(password, json).toString('hex');
                //console.dir(privatekey);
                accounts.push('0x' + privatekey);
                //console.dir(keystore);
		    }
	    }
    } catch (ex) {
    }
    try {
        const file = '.secret';
        var info = fs.statSync(file);
        if (!info.isDirectory()) {
            const content = fs.readFileSync(file, 'utf8');
            let lines = content.split('\n');
            for (let index = 0; index < lines.length; index ++) {
                let line = lines[index];
                if (line == undefined || line == '') {
                    continue;
                }
                if (!line.startsWith('0x') || !line.startsWith('0x')) {
                    line = '0x' + line;
                }
                accounts.push(line);
            }
        }
    } catch (ex) {
    }
})();

module.exports = {
    defaultNetwork: "hardhat",
    abiExporter: {
        path: "./abi",
        clear: false,
        flat: true,
        // only: [],
        // except: []
    },
    namedAccounts: {
        deployer: {
            default: 0,
            3: '0x7286d8b6a41A3cE6e2360bb62eBc5B15059c2166',
            97: '0x7286d8b6a41A3cE6e2360bb62eBc5B15059c2166',
            5: '0x7286d8b6a41A3cE6e2360bb62eBc5B15059c2166',
            1: '0x1C70Fb8De1e25E169d717f27C6396B8fC26BD26F',
        },
        seedRoundReceiver: {
            default: 0,
            5: '0x7286d8b6a41A3cE6e2360bb62eBc5B15059c2166',
            1: '0x140525C3359708475e6fa818B123cA21fDbD1bfd',
        },
        privateFundReceiver: {
            default: 0,
            5: '0x7286d8b6a41A3cE6e2360bb62eBc5B15059c2166',
            1: '0xe8097341bFFD211784054109441BfDc0EC0Ee7ff',
        },
        marketReceiver: {
            default: 0,
            5: '0x7286d8b6a41A3cE6e2360bb62eBc5B15059c2166',
            1: '0xC0A95B45CAE22DE61c2020AC76Df1736a78585eD',
        },
        teamReceiver: {
            default: 0,
            5: '0x7286d8b6a41A3cE6e2360bb62eBc5B15059c2166',
            1: '0x0572FFeea1ac3610d84Dd4f7b5E829cD645CCbA9',
        },
        daoReceiver: {
            default: 0,
            5: '0x7286d8b6a41A3cE6e2360bb62eBc5B15059c2166',
            1: '0x3D87614c7DE18982e0C1823cc82f001c98B4bB0d',
        },
        signer1: {
            default: 0,
            5: '0xe44c51aF9B8D1CF2a7427469662d41A01D28566D',
            1: '0x5B854aBA65227EAE0b6e9440B02f9F7C359b2A4c',
        },
        signer2: {
            default: 1,
            5: '0xC17467954aC0f98721D541AcB86D686C854E098e',
            1: '0x7e9559bD11f56226cCC5CE3640709E7D335E77B1',
        },
        signer3: {
            default: 2,
            5: '0xD2a41045cfCCd973C966943C55552ed62064EfBA',
            1: '0x6E94D7d16148d6908cDCCD8bF693f062daCC3f76',
        },
        vaultCaller: {
            default: 0,
            5: '0x7286d8b6a41A3cE6e2360bb62eBc5B15059c2166',
            1: '0xf54d9e289b760f733c6b8074539cef9dce23d4d8',
            56: '0x3dd815704ddf6ab5bd6cdf8df22dc8e6cc816868',
        },
        activeVaultCaller: {
            default: 0,
            5: '0x38a105cc40f2175d2ad1a8587acac982d69c81a5',
            1: '0x1C70Fb8De1e25E169d717f27C6396B8fC26BD26F',
            56: '0x7286d8b6a41A3cE6e2360bb62eBc5B15059c2166',
        },
        WETH: {
            default: 3,
            1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        },
    },
    networks: {
        ethmain: {
            url: `https://mainnet.infura.io/v3/5e5a1756169b4617bb6a47d9dbffb3be`,
            accounts: accounts,
            chainId: 1,
            gasMultiplier: 1.5,
        },
        ethtest: {
            url: `https://rinkeby.infura.io/v3/5e5a1756169b4617bb6a47d9dbffb3be`,
            accounts: accounts,
            chainId: 3,
            gasMultiplier: 1.5,
            tags: ["test"],
        },
        bscmain: {
            url: `https://bsc-dataseed1.defibit.io/`,
            accounts: accounts,
            chainId: 56,
            gasMultiplier: 1.5,
            tags: ["test"],
        },
        bsctest: {
            url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
            accounts: accounts,
            chainId: 97,
            gasMultiplier: 1.5,
            tags: ["test"],
        },
        goerli: {
            url: `https://goerli.infura.io/v3/5e5a1756169b4617bb6a47d9dbffb3be`,
            accounts: accounts,
            chainId: 5,
            gasMultiplier: 1.5,
            tags: ["test"],
        },
        hardhat: {
            forking: {
                enabled: false,
                //url: `https://bsc-dataseed1.defibit.io/`
                url: `https://ropsten.infura.io/v3/5e5a1756169b4617bb6a47d9dbffb3be`,
                //url: `https://bsc-dataseed1.ninicoin.io/`,
                //url: `https://bsc-dataseed3.binance.org/`
                //url: `https://data-seed-prebsc-1-s1.binance.org:8545`
                //blockNumber: 8215578,
            },
            live: true,
            saveDeployments: true,
            tags: ["local"],
            timeout: 2000000,
        }
    },
    solidity: {
        compilers: [
            {
                version: "0.7.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.4.22",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    spdxLicenseIdentifier: {
        overwrite: true,
        runOnCompile: true,
    },
    mocha: {
        timeout: 2000000,
    },
    etherscan: {
      apiKey: process.env.ETH_ETHERSCAN_API_KEY,
   }
};
