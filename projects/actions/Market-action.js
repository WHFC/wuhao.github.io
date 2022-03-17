const { ethers } = require("hardhat");

const depolyedAddr = require(`../deployments/${network.name}/UniswapMarket.json`)
const { abi:token1Abi, bytecode:token1Bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/AirToken.json');

async function main() {
  let [owner, owner2]  = await ethers.getSigners();
  const UniswapMarket = await ethers.getContractFactory("UniswapMarket");
  const market = await UniswapMarket.attach(depolyedAddr.address);
  const token1Address = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
  const AirToken = await new ethers.ContractFactory(token1Abi, token1Bytecode, owner);
  const token1 = await AirToken.attach(token1Address);
  const token2Address = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
  const token2 = await AirToken.attach(token2Address);
  // 给market合约授权
  let amount = 10000;
  let tx = await token1.approve(market.address, amount);
  await tx.wait();
  console.log("tokenA approve successed, amount: ", amount);
  tx = await token1.allowance(owner.address, market.address);
  console.log("tokenA allowance balance: ", tx.toNumber());
  tx = await token2.approve(market.address, amount);
  await tx.wait();
  console.log("tokenB approve successed");
  // 添加流动性
  console.log("addLiquidity begin");
  tx = await market.addLiquidity(amount, amount, 0, 0, owner.address);
  console.log("addLiquidity tx begin");
  await tx.wait();
  console.log("addLiquidity successed");
  amount = 100;
  // 给market合约授权转入的tokenA代币
  tx = await token1.approve(market.address, amount);
  await tx.wait();
  console.log("tokenA approve successed");
  // 购买tokenB代币
  tx = await market.buyTokenB(amount, 0, owner2.address);
  await tx.wait();
  console.log("buyTokenB successed");
  let result = await token2.balanceOf(owner2.address);
  console.log("owner2 tokenB balance: ", result.toNumber());
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

