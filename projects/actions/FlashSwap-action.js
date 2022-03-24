const { ethers } = require("hardhat");

const depolyedAitTokenAddr = require(`../deployments/${network.name}/AirToken.json`)
const depolyedWHTTokenAddr = require(`../deployments/${network.name}/WHToken.json`)
const depolyedFlashSwapAddr = require(`../deployments/${network.name}/FlashSwap.json`)
const depolyedUniswapV2Router02Addr = require(`../deployments/${network.name}/UniswapV2Router02.json`)
const factoryAddr = require(`../deployments/${network.name}/UniswapV2Factory.json`)
const { abi, bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/AirToken.json');
const { abi:FlashSwapAbi, bytecode:FlashSwapByteCode } = require('../artifacts/contracts/FlashSwap/FlashSwap.sol/FlashSwap.json');
const { abi:routerAbi, bytecode:routerBytecode } = require('../artifacts/flattened/uniswap-v2-periphery-master/UniswapV2Router02.sol/UniswapV2Router02.json');

async function main() {
  let [owner, owner2]  = await ethers.getSigners();
  const AirToken = await new ethers.ContractFactory(abi, bytecode, owner);
  const AT = await AirToken.attach(depolyedAitTokenAddr.address);
  const WHTToken = await new ethers.ContractFactory(abi, bytecode, owner);
  const WHT = await WHTToken.attach(depolyedWHTTokenAddr.address);
  const UniswapV2Router02 = await new ethers.ContractFactory(routerAbi, routerBytecode, owner);
  const router = await UniswapV2Router02.attach(depolyedUniswapV2Router02Addr.address);
  const FlashSwap = await new ethers.ContractFactory(FlashSwapAbi, FlashSwapByteCode, owner);
  const flashswap = await FlashSwap.attach(depolyedFlashSwapAddr.address);

  let amount = ethers.utils.parseUnits("100000", 18);
  let tx = await AT.approve(router.address, amount);
  await tx.wait();
  console.log("AirToken approve successed, amount: ", amount);
  tx = await WHT.approve(router.address, amount);
  await tx.wait();
  console.log("WHTToken approve successed, amount: ", amount);

  // 添加流动性
  console.log("addLiquidity begin");
  tx = await router.addLiquidity(AT.address, WHT.address, amount, amount, 0, 0, owner.address, ethers.utils.parseUnits("100", 18));
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

