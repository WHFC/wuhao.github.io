const { ethers } = require("hardhat");

const depolyedAddr = require(`../deployments/${network.name}/UniswapMarketV2.json`)
const { abi:token1Abi, bytecode:token1Bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/AirToken.json');

async function main() {
  let [owner, owner2]  = await ethers.getSigners();
  const UniswapMarketV2 = await ethers.getContractFactory("UniswapMarketV2");
  const market = await UniswapMarketV2.attach(depolyedAddr.address);
  const token1Address = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
  const AirToken = await new ethers.ContractFactory(token1Abi, token1Bytecode, owner);
  const token1 = await AirToken.attach(token1Address);
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
  let amount = ethers.utils.parseUnits("1", 18);
  // 购买tokenB代币
  let tx = await market.buyToken(0, owner2.address, {value:amount});
  await tx.wait();
  console.log("buyTokenA successed");
  let result = await token1.balanceOf(owner2.address);
  console.log("owner2 tokenA balance: ", ethers.utils.formatUnits(result, 18));
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

