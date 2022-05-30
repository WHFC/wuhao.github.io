const { ethers } = require("hardhat");
const Web3 = require('web3');

var transferFuncSelector = "0xa9059cbb";
var safemoonAddr = "0xbAE2E529f50D128298aa1e10337bCaFB601608dE";
var providerUrl = {
  "dev" : "ws://localhost:8545",
  "mainnet" : "wss://mainnet.infura.io/ws/v3/9aaab622e3b34c749c31ea4bac7855a7",
  "rinkeby" : "wss://rinkeby.infura.io/ws/v3/9aaab622e3b34c749c31ea4bac7855a7",
  "bsctUrl" : "https://data-seed-prebsc-1-s1.binance.org:8545/",
  "hecoChain" : "https://http-mainnet.hecochain.com/"
}

async function parsePendingTransaction(from, to, input) {
  if (ethers.utils.getAddress(to) == safemoonAddr) {
      console.log("parsePendingTransaction, input: ", input);
      var func = await input.slice(0, 10);
      if (transferFuncSelector == func) {
          console.log("receive transfer pending transaction");
          var last64Char = "0x" + await input.slice(74);
          console.log("last 64 char: ", last64Char);
          var value = ethers.BigNumber.from(last64Char);
          console.log("value: ", ethers.utils.formatUnits(value, 9));
      }
  }
}

async function listenPendingTransactions() {
  console.log("exec listen pending transaction begin");
  var web3;
  if (network.name == "bsct") {
      web3 = await new Web3(Web3.givenProvider || await new Web3.providers.HttpProvider(providerUrl[network.name]));
  }
  else {
      web3 = await new Web3(Web3.givenProvider || providerUrl[network.name]);
  }
  subscription = web3.eth.subscribe('pendingTransactions', function(error, result){
      if (!error)
          console.log(result);
  })
  .on("data", function(transactionHash){
      web3.eth.getTransaction(transactionHash)
      .then(function (transaction) {
          parsePendingTransaction(transaction.from, transaction.to, transaction.input);
      });
  });
  console.log("exec listen pending transaction end");
}

async function main() {
  await listenPendingTransactions();
}

main()

