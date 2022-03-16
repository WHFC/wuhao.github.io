const { ethers } = require("hardhat");

const depolyedAddr = require(`../deployments/${network.name}/UniswapMarket.json`)
const { abi:token1Abi, bytecode:token1Bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/AirToken.json');

async function main() {
  let [owner, owner2]  = await ethers.getSigners();
  const UniswapMarket = await ethers.getContractFactory("UniswapMarket");
  const market = await UniswapMarket.attach(depolyedAddr.address);
  console.log("market.address: ", market.address);
  const token1Address = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
  const AirToken = await new ethers.ContractFactory(token1Abi, token1Bytecode, owner);
  const token1 = await AirToken.attach(token1Address);
  console.log("token1.address: ", token1.address);
  const token2Address = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
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
  console.log("13");
  tx = await market.buyTokenB(value, 0, owner2.address);
  console.log("14");
  await tx.wait();
  console.log("15");
  console.log("owner2 tokenB balance: ", await token2.balanceOf(owner2.address));
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

