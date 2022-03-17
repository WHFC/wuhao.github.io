const { ethers } = require("hardhat");

const depolyedAddr = require(`../deployments/${network.name}/UniswapMarket.json`)
const { abi:token1Abi, bytecode:token1Bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/AirToken.json');

async function main() {
  let [owner, owner2]  = await ethers.getSigners();
  const UniswapMarket = await ethers.getContractFactory("UniswapMarket");
  const market = await UniswapMarket.attach(depolyedAddr.address);
  console.log("market.address: ", market.address);
  const token1Address = '0x07882Ae1ecB7429a84f1D53048d35c4bB2056877';
  const AirToken = await new ethers.ContractFactory(token1Abi, token1Bytecode, owner);
  const token1 = await AirToken.attach(token1Address);
  console.log("token1.address: ", token1.address);
  const token2Address = '0x22753E4264FDDc6181dc7cce468904A80a363E44';
  const token2 = await AirToken.attach(token2Address);
  console.log("token2.address: ", token2.address);
  console.log("1");
  let value = 10000;
  let tx = await token1.approve(market.address, value);
  console.log("2");
  await tx.wait();
  console.log("3");
  tx = await token2.approve(market.address, value);
  console.log("4");
  await tx.wait();
  console.log("5");
  tx = await market.depositTokenA(value);
  console.log("6");
  await tx.wait();
  console.log("7");
  tx = await market.depositTokenB(value);
  console.log("8");
  await tx.wait();
  console.log("9");
  tx = await market.addLiquidity(value, value, 0, 0, owner.address);
  console.log("10");
  await tx.wait();
  console.log("11");
  value = 100;
  tx = await token1.approve(market.address, value);
  console.log("12");
  await tx.wait();
  tx = await market.depositTokenA(value);
  console.log("13");
  await tx.wait();
  console.log("14");
  console.log("market tokenA balance: ", await token1.balanceOf(market.address));
  tx = await market.buyTokenB(value, 0, owner2.address);
  console.log("15");
  await tx.wait();
  console.log("16");
  let result = await token2.balanceOf(owner2.address);
  console.log("owner2 tokenB balance: ", result._hex);
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

