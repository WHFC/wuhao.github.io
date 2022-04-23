const { ethers, network, web3 } = require("hardhat");
const { abi:LongOptionAbi, bytecode:LongOptionByteCode } = require('../artifacts/contracts/LongOption/LongOption.sol/LongOption.json');
const depolyedLongOptionnAddr = require(`../deployments/${network.name}/LongOption.json`)
const { abi:IERC20Abi, bytecode:IERC20Bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/IERC20.json');
const depolyedAirTokenAddr = require(`../deployments/${network.name}/AirToken.json`)
const { delay1Day } = require('../scripts/delay');
const USDC = depolyedAirTokenAddr.address;
// const USDC = '0x5B8B635c2665791cf62fe429cB149EaB42A3cEd8';

async function transferAT(amount) {
  console.log("↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ transferAT ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓");
  let [, owner2, owner3]  = await ethers.getSigners();
  const AirToken = await new ethers.ContractFactory(IERC20Abi, IERC20Bytecode, owner3);
  const AT = await AirToken.attach(USDC);

  console.log("before tansfer owner2 balance of AT: ", ethers.utils.formatUnits(await AT.balanceOf(owner2.address), 18));
  let tx = await AT.transfer(owner2.address, amount);
  await tx.wait();
  console.log("after transfer owner2 balance of AT: ", ethers.utils.formatUnits(await AT.balanceOf(owner2.address), 18));
  console.log("↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑ transferAT ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑\n");
}

async function buyOption(count) {
  console.log("↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ buy option ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓");
  let [owner,owner2]  = await ethers.getSigners();
  const LongOption = await new ethers.ContractFactory(LongOptionAbi, LongOptionByteCode, owner2);
  const longoption = await LongOption.attach(depolyedLongOptionnAddr.address);

  const AirToken = await new ethers.ContractFactory(IERC20Abi, IERC20Bytecode, owner2);
  const AT = await AirToken.attach(USDC);
  let amount = await longoption.price();
  amount = amount.mul(count);
  console.log("buy option approve amount: ", ethers.utils.formatUnits(amount, 18));
  ethers.utils.formatUnits
  let tx = await AT.approve(longoption.address, amount);
  await tx.wait();
  let id = await longoption.totalID() - 1;
  console.log("before buy option, owner AT balance: ", ethers.utils.formatUnits(await AT.balanceOf(owner.address), 18));
  console.log("before buy option, owner2 AT balance: ", ethers.utils.formatUnits(await AT.balanceOf(owner2.address), 18));
  console.log("before buy option, owner NFT balance: ", (await longoption.balanceOf(owner.address, id)).toNumber());
  console.log("before buy option, owner2 NFT balance: ", (await longoption.balanceOf(owner2.address, id)).toNumber());
  tx = await longoption.buyOption(owner2.address, id, amount);
  await tx.wait();
  console.log("after buy option, owner AT balance: ", ethers.utils.formatUnits(await AT.balanceOf(owner.address), 18));
  console.log("after buy option, owner2 AT balance: ", ethers.utils.formatUnits(await AT.balanceOf(owner2.address), 18));
  console.log("after buy option, owner NFT balance: ", (await longoption.balanceOf(owner.address, id)).toNumber());
  console.log("after buy option, owner2 NFT balance: ", (await longoption.balanceOf(owner2.address, id)).toNumber());
  console.log("↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑ buy option ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑\n");
}

async function delivery() {
  console.log("↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ delivery ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓");
  let [owner,owner2]  = await ethers.getSigners();
  let jsonRpcProvider = new ethers.providers.JsonRpcProvider();

  const LongOption = await new ethers.ContractFactory(LongOptionAbi, LongOptionByteCode, owner2);
  const longoption = await LongOption.attach(depolyedLongOptionnAddr.address);

  const AirToken = await new ethers.ContractFactory(IERC20Abi, IERC20Bytecode, owner2);
  const AT = await AirToken.attach(USDC);

  let deliveryTime = await longoption.deliveryTime();
  let currentTime = await longoption.time();
  while (currentTime < deliveryTime) {
    await delay1Day(jsonRpcProvider);
    currentTime = await longoption.time();
  }

  let id = await longoption.totalID() - 1;
  var count = await longoption.balanceOf(owner2.address, id);
  var amount = await longoption.subjectMatterOfUSDC();
  amount = amount.mul(count);
  let tx = await AT.approve(longoption.address, amount);
  await tx.wait();
  console.log("before delivery, owner AT balance: ", ethers.utils.formatUnits(await AT.balanceOf(owner.address), 18));
  console.log("before delivery, owner2 AT balance: ", ethers.utils.formatUnits(await AT.balanceOf(owner2.address), 18));
  console.log("before delivery, owner NFT balance: ", (await longoption.balanceOf(owner.address, id)).toNumber());
  console.log("before delivery, owner2 NFT balance: ", (await longoption.balanceOf(owner2.address, id)).toNumber());
  console.log("before delivery, owner2 ether balance: ", ethers.utils.formatUnits(await owner2.provider.getBalance(owner2.address), 18));
  tx = await longoption.delivery(owner2.address, id, amount);
  await tx.wait();
  console.log("after delivery, owner AT balance: ", ethers.utils.formatUnits(await AT.balanceOf(owner.address), 18));
  console.log("after delivery, owner2 AT balance: ", ethers.utils.formatUnits(await AT.balanceOf(owner2.address), 18));
  console.log("after delivery, owner NFT balance: ", (await longoption.balanceOf(owner.address, id)).toNumber());
  console.log("after delivery, owner2 NFT balance: ", (await longoption.balanceOf(owner2.address, id)).toNumber());
  console.log("after delivery, owner2 ether balance: ", ethers.utils.formatUnits(await owner2.provider.getBalance(owner2.address), 18));
    console.log("↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑ delivery ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑\n");
}

async function redeem() {
  console.log("↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ redeem ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓");
  let [owner]  = await ethers.getSigners();
  let jsonRpcProvider = new ethers.providers.JsonRpcProvider();
  const LongOption = await new ethers.ContractFactory(LongOptionAbi, LongOptionByteCode, owner);
  const longoption = await LongOption.attach(depolyedLongOptionnAddr.address);

  await delay1Day(jsonRpcProvider);
  
  let id = await longoption.totalID() - 1;
  console.log("before redeem, owner NFT balance: ", (await longoption.balanceOf(owner.address, id)).toNumber());
  console.log("before redeem, owner ether balance: ", ethers.utils.formatUnits(await owner.provider.getBalance(owner.address), 18));
  let tx = await longoption.redeem(owner.address, id);
  await tx.wait();
  console.log("after redeem, owner NFT balance: ", (await longoption.balanceOf(owner.address, id)).toNumber());
  console.log("after redeem, owner ether balance: ", ethers.utils.formatUnits(await owner.provider.getBalance(owner.address), 18));
    console.log("↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑ redeem ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑\n");
}

async function main() {
  await transferAT(ethers.utils.parseUnits('400000', 18));
  await buyOption(900);
  await delivery();
  await redeem();
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

