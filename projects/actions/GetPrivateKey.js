const { ethers } = require("hardhat");

let overrides = {
    gasLimit: 3000000,
    gasPrice: 1400000000
  }

async function main() {
    const ethers = require('ethers');
    let mnemonic = "repair impose crack spread idea sorry uncle soup sunset great keep clump";
    let mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);
    console.log(mnemonicWallet.privateKey);
  }
  
  main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });