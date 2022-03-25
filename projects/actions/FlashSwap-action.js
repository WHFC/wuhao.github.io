const { ethers } = require("hardhat");

// const depolyedAitTokenAddr = require(`../deployments/${network.name}/AirToken.json`)
// const depolyedWHTTokenAddr = require(`../deployments/${network.name}/WHToken.json`)
const depolyedFlashSwapAddr = require(`../deployments/${network.name}/FlashSwap.json`)
// const depolyedUniswapV2Router02Addr = require(`../deployments/${network.name}/UniswapV2Router02.json`)
// const factoryAddr = require(`../deployments/${network.name}/UniswapV2Factory.json`)
const { abi, bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/AirToken.json');
const { abi:FlashSwapAbi, bytecode:FlashSwapByteCode } = require('../artifacts/contracts/FlashSwap/FlashSwap.sol/FlashSwap.json');
// const { abi:routerAbi, bytecode:routerBytecode } = require('../artifacts/flattened/uniswap-v2-periphery-master/UniswapV2Router02.sol/UniswapV2Router02.json');
const { abi:pairAbi, bytecode:pairBytecode } = require('../artifacts/flattened/uniswap-v2-core-master/UniswapV2Factory.sol/UniswapV2Pair.json');

const overrides = {
  gasLimit: 3000000,
  gasPrice: 0
}

async function main() {
  let [owner, owner2]  = await ethers.getSigners();
  const AirToken = await new ethers.ContractFactory(abi, bytecode, owner);
  // const AT = await AirToken.attach(depolyedAitTokenAddr.address);
  const AT = await AirToken.attach("0xeA80ED9Bb4Cf9fc377E4346FB8588f6b5D8f3A98");
  const WHTToken = await new ethers.ContractFactory(abi, bytecode, owner);
  // const WHT = await WHTToken.attach(depolyedWHTTokenAddr.address);
  const WHT = await WHTToken.attach("0x3a81278B6C87869624ff0A1b435f59A8A4cFB713");
  // const UniswapV2Router02 = await new ethers.ContractFactory(routerAbi, routerBytecode, owner);
  // const router = await UniswapV2Router02.attach(depolyedUniswapV2Router02Addr.address);
  const FlashSwap = await new ethers.ContractFactory(FlashSwapAbi, FlashSwapByteCode, owner2);
  const flashswap = await FlashSwap.attach(depolyedFlashSwapAddr.address);
  const pair = await flashswap.v2pair();
  console.log("pair: ", pair);
  const UniswapV2Pair = await new ethers.ContractFactory(pairAbi, pairBytecode, owner2);
  const pairContract = await UniswapV2Pair.attach(pair);
  const token0 = await pairContract.token0();

  // let amount = ethers.utils.parseUnits("100000", 18);
  // let tx = await AT.approve(router.address, amount);
  // await tx.wait();
  // console.log("AirToken approve successed, amount: ", amount);
  // tx = await WHT.approve(router.address, amount);
  // await tx.wait();
  // console.log("WHTToken approve successed, amount: ", amount);
  // // 添加流动性
  // console.log("addLiquidity begin");
  // tx = await router.addLiquidity(AT.address, WHT.address, amount, amount, 0, 0, owner.address, ethers.utils.parseUnits("100", 18));
  // await tx.wait();
  // console.log("addLiquidity successed");
  console.log("owner2 AT balance: ", ethers.utils.formatUnits(await AT.balanceOf(owner2.address), 18));
  console.log("owner2 WHT balance: ", ethers.utils.formatUnits(await WHT.balanceOf(owner2.address), 18));
  let amount = ethers.utils.parseUnits("1", 18);
  console.log(ethers.utils.defaultAbiCoder.encode(['uint256'], [amount]));
  return;
  const amount0 = AT.address == token0 ? amount : 0;
  const amount1 = AT.address == token0 ? 0 : amount;
  let tx = await pairContract.swap(amount0, amount1, flashswap.address, ethers.utils.defaultAbiCoder.encode(['uint256'], [amount]), overrides);
  await tx.wait();
  console.log("swap successed, amount0: ", amount0, ", amount1: ", amount1);
  console.log("owner2 AT balance: ", ethers.utils.formatUnits(await AT.balanceOf(owner2.address), 18));
  console.log("owner2 WHT balance: ", ethers.utils.formatUnits(await WHT.balanceOf(owner2.address), 18));
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

