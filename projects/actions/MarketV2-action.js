const { ethers } = require("hardhat");

const depolyedAddr = require(`../deployments/${network.name}/UniswapMarketV2.json`)
const depolyedTokenAddr = require(`../deployments/${network.name}/AirToken.json`)
const depolyedSushiAddr = require(`../deployments/${network.name}/SushiToken.json`)
const depolyedMaterChefAddr = require(`../deployments/${network.name}/MasterChef.json`)
const { abi:marketAbi, bytecode:marketBytecode } = require('../artifacts/contracts/UniswapMarket/UniswapMarketV2.sol/UniswapMarketV2.json');
const { abi:token1Abi, bytecode:token1Bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/AirToken.json');
const { abi:sushiAbi, bytecode:sushiBytecode } = require('../artifacts/contracts/sushiswap/contracts/SushiToken.sol/SushiToken.json');
const { advanceBlock } = require('../scripts/delay');

async function main() {
  let jsonRpcProvider = new ethers.providers.JsonRpcProvider();
  let [owner, owner2]  = await ethers.getSigners();
  const UniswapMarketV2 = await new ethers.ContractFactory(marketAbi, marketBytecode, owner);
  const market = await UniswapMarketV2.attach(depolyedAddr.address);
  const AirToken = await new ethers.ContractFactory(token1Abi, token1Bytecode, owner);
  const token1 = await AirToken.attach(depolyedTokenAddr.address);
  const SushiToken = await new ethers.ContractFactory(sushiAbi, sushiBytecode, owner);
  const sushi = await SushiToken.attach(depolyedSushiAddr.address);
  // 给market合约授权
  let amount = ethers.utils.parseUnits("100000", 18);
  let tx = await token1.approve(market.address, amount);
  await tx.wait();
  console.log("tokenA approve successed, amount: ", amount);
  tx = await token1.allowance(owner.address, market.address);
  console.log("tokenA allowance balance: ", ethers.utils.formatUnits(tx, 18));
  // 添加流动性
  console.log("addLiquidity begin");
  tx = await market.addLiquidity(amount, 0, 0, owner.address, {value:ethers.utils.parseUnits("100", 18)});
  await tx.wait();
  console.log("addLiquidity successed");
  amount = ethers.utils.parseUnits("1", 18);
  // 购买token代币，并添加到masterchef中
  tx = await market.buyTokenAndDopsiteToMaterChef(0, owner.address, {value:amount});
  await tx.wait();
  console.log("buyTokenAndDopsiteToMaterChef successed");
  let result = await token1.balanceOf(depolyedMaterChefAddr.address);
  console.log("depolyedMaterChefAddr AirToken balance: ", ethers.utils.formatUnits(result, 18));
  result = await sushi.balanceOf(market.address);
  console.log("market sushi balance: ", ethers.utils.formatUnits(result, 18));
  result = await market.userTokenBalance(owner.address);
  console.log("owner market balance: ", ethers.utils.formatUnits(result, 18));
  let count = 10;
  while (count-- > 0) {
    await advanceBlock(jsonRpcProvider);
  }
  tx = await market.withDrawSushi(owner2.address);
  await tx.wait();
  console.log("market withDrawSushi successed");
  result = await sushi.balanceOf(owner2.address);
  console.log("owner2 sushi balance: ", ethers.utils.formatUnits(result, 18));
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

