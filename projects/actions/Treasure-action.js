const { ethers } = require("hardhat");

const depolyedCompAddr = require(`../deployments/${network.name}/Comp.json`)
const depolyedGovAddr = require(`../deployments/${network.name}/GovernorAlpha.json`)
const depolyedTreasureAddr = require(`../deployments/${network.name}/Treasure.json`)
const { abi:CompAbi, bytecode:CompByteCode } = require('../artifacts/contracts/Comp/Comp.sol/Comp.json');
const { abi:GovernorAlphaAbi, bytecode:GovernorAlphaByteCode } = require('../artifacts/contracts/Comp/GovernorAlpha.sol/GovernorAlpha.json');
const { abi:TreasureAbi, bytecode:TreasureByteCode } = require('../artifacts/contracts/ERC20WithGov/Treasure.sol/Treasure.json');
const { advanceBlock,  delay1Day} = require('../scripts/delay');

const overrides = {
  gasLimit: 3000000,
  gasPrice: ethers.utils.parseUnits('9.0', 'gwei')
}

let proposeID;

var ProposalState = {
    Pending : 0,
    Active : 1,
    Canceled : 2,
    Defeated : 3,
    Succeeded : 4,
    Queued : 5,
    Expired : 6,
    Executed : 7
}

async function CompTransfer() {
  console.log("CompTransfer begin");
  let jsonRpcProvider = new ethers.providers.JsonRpcProvider();
  let owners  = await ethers.getSigners();
  const Comp = await new ethers.ContractFactory(CompAbi, CompByteCode, owners[0]);
  const comp = await Comp.attach(depolyedCompAddr.address);

  let arrayBalancePercent = [5,10,15,20];
  let totalSupply = await comp.totalSupply();
  for (let i = 0; i < arrayBalancePercent.length; ++i) {
    let balance = await comp.balanceOf(owners[i+1].address);
    let percentBalance = totalSupply.mul(arrayBalancePercent[i]).div(100);
    if (balance < percentBalance)
    {
      let tx = await comp.transfer(owners[i+1].address, percentBalance.sub(balance));
      await tx.wait();
      const _Comp = await new ethers.ContractFactory(CompAbi, CompByteCode, owners[i+1]);
      const _comp = await _Comp.attach(depolyedCompAddr.address);
      tx = await _comp.delegate(owners[i+1].address);
      await tx.wait();
    }
  }

  let tx = await comp.delegate(owners[0].address);
  await tx.wait();

  for (let i = 0; i < arrayBalancePercent.length; ++i) {
    console.log("comp balance of owner", i+1, ": ", ethers.utils.formatUnits(await comp.balanceOf(owners[i+1].address), 18));
    console.log("comp votes of owner", i+1, ": ", ethers.utils.formatUnits(await comp.getCurrentVotes(owners[i+1].address), 18));
  }
  console.log("comp balance of owner: ", ethers.utils.formatUnits(await comp.balanceOf(owners[0].address), 18));
  console.log("comp votes of owner: ", ethers.utils.formatUnits(await comp.getCurrentVotes(owners[0].address), 18));
  console.log("CompTransfer end");
}

async function Propose() {
  console.log("Propose begin");
  let [owner] = await ethers.getSigners();
  const Comp = await new ethers.ContractFactory(CompAbi, CompByteCode, owner);
  const comp = await Comp.attach(depolyedCompAddr.address);

  const Gov = await new ethers.ContractFactory(GovernorAlphaAbi, GovernorAlphaByteCode, owner);
  const gov = await Gov.attach(depolyedGovAddr.address);

  let target = [depolyedTreasureAddr.address];
  let values = ["0"];
  let signatures = ["withdraw(address)"];
  const abi = await new ethers.utils.AbiCoder();
  let callDatas = [abi.encode(['address'], [owner.address])];
  tx = await gov.propose(target, values, signatures, callDatas, "withdraw ether from treasure to owner address");
  await tx.wait();
  proposeID = (await gov.latestProposalIds(owner.address)).toNumber();
  console.log("Propose end, propose id: ", proposeID);
}

async function CastVote() {
  console.log("CastVote begin");
  let jsonRpcProvider = new ethers.providers.JsonRpcProvider();
  let owners  = await ethers.getSigners();
  const Gov = await new ethers.ContractFactory(GovernorAlphaAbi, GovernorAlphaByteCode, owners[0]);
  const gov = await Gov.attach(depolyedGovAddr.address);
  let state = await gov.state(proposeID);
  let supportArr = [false, false, true, true];
  while (state == ProposalState.Pending) {
    await advanceBlock(jsonRpcProvider);
    state = await gov.state(proposeID);
  }
  for (let i = 0; i < supportArr.length; ++i) {
    const _Gov = await new ethers.ContractFactory(GovernorAlphaAbi, GovernorAlphaByteCode, owners[i+1]);
    const _gov = await _Gov.attach(depolyedGovAddr.address);
    let tx = await _gov.castVote(proposeID, supportArr[i]);
    await tx.wait();
  }
  console.log("CastVote begin");
}

async function execute() {
  console.log("execute begin");
  let jsonRpcProvider = new ethers.providers.JsonRpcProvider();
  let [owner]  = await ethers.getSigners();
  const Gov = await new ethers.ContractFactory(GovernorAlphaAbi, GovernorAlphaByteCode, owner);
  const gov = await Gov.attach(depolyedGovAddr.address);
  const Treasure = await new ethers.ContractFactory(TreasureAbi, TreasureByteCode, owner);
  const treasure = await Treasure.attach(depolyedTreasureAddr.address);

  console.log("wait for active state finished");
  let state = await gov.state(proposeID);
  if (state >= ProposalState.Succeeded)
  {
    console.log("propose expired");
  } else {
    while (state < ProposalState.Defeated) {
      console.log("current state: ", state);
      await advanceBlock(jsonRpcProvider);
      state = await gov.state(proposeID);
    }
  }
  console.log("current state: ", state);
  let tx = await gov.queue(proposeID);
  await tx.wait();
  console.log("wait for time lock delay finished");
  let proposeInfo = await gov.proposals(proposeID);
  console.log("proposeInfo.eta: \n", proposeInfo.eta.toNumber());
  let currentTime = await treasure.time();
  while (currentTime < proposeInfo.eta) {
    console.log("current time: ", currentTime.toNumber(), ", offset: ", proposeInfo.eta.sub(currentTime).toNumber());
    await delay1Day(jsonRpcProvider);
    currentTime = await treasure.time();
  }

  let treasureEther = await owner.provider.getBalance(depolyedTreasureAddr.address);
  let ownerEther = await owner.provider.getBalance(owner.address);
  console.log("before execute treasure ether balance: ", ethers.utils.formatUnits(treasureEther, 18));
  console.log("before execute owner ether balance: ", ethers.utils.formatUnits(ownerEther, 18));
  tx = await gov.execute(proposeID);
  await tx.wait();
  treasureEther = await owner.provider.getBalance(depolyedTreasureAddr.address);
  ownerEther = await owner.provider.getBalance(owner.address);
  console.log("after execute treasure ether balance: ", ethers.utils.formatUnits(treasureEther, 18));
  console.log("after execute owner ether balance: ", ethers.utils.formatUnits(ownerEther, 18));
  console.log("execute end");
}

async function main() {
  await CompTransfer();
  await Propose();
  await CastVote();
  await execute();
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

