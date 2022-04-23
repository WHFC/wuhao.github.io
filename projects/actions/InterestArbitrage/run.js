const { ethers } = require("hardhat");
const Web3 = require('web3');
const { safemoonAddr, pairAddr, toAddr, providerUrl, swapData, txFee, feePercent, excludedCheckState } = require('./config/InterestArbitrageConfig.json');
const { abi:erc20Abi, bytecode:erc20ByteCode } = require('../../artifacts/contracts/InterestArbitrageInterfaces/IERC20.sol/IERC20.json');
const { abi:pairAbi, bytecode:pairByteCode } = require('../../artifacts/contracts/InterestArbitrageInterfaces/IUniswapV2Pair.sol/IUniswapV2Pair.json');

var reserveSafemoon;
var reserveOther;
var balanceOfPairInSafemoon;
var rbalanceOfPairInSafemoon;
var rTotal;
var tTotal;
var rTotalExcluded;
var tTotalExcluded;
var token0;
var estimateGas;
let safemoon;
let pair;

async function updateReserves(_reserve0, _reserve1) {
    if (token0 == safemoonAddr)
    {
        reserveSafemoon = _reserve0;
        balanceOfPairInSafemoon = _reserve0;
        reserveOther = _reserve1;
    }
    else {
        reserveSafemoon = _reserve1;
        balanceOfPairInSafemoon = _reserve1;
        reserveOther = _reserve0;
    }
    console.log("reserves upda-to-date, now reserveSafemoon: ", reserveSafemoon, ", reserveOther: ", reserveOther);
}

async function getAmountOut(amountIn, reserveIn, reserveOut) {
    let amountInWithFee = amountIn.mul(997);
    let numerator = amountInWithFee.mul(reserveOut);
    let denominator = reserveIn.mul(1000).add(amountInWithFee);
    return numerator.div(denominator);
}

async function swap(amount0Out, amount1Out, to) {
    let tx = await pair.swap(amount0Out, amount1Out, to, '0x');
    await tx.wait();
}

async function trySwap() {
    let amountOut = await getAmountOut(balanceOfPairInSafemoon.sub(reserveSafemoon), reserveSafemoon, reserveOther);
    let gas = ethers.utils.parseUnits(estimateGas.toString(), 9);
    console.log("estimate gas: ", gas);
    if (gas.gt(amountOut)) {
        console.log("not enough interest arbitrage space");
    }
    else {
        var amount0Out;
        var amount1Out;
        if (token0 == safemoonAddr) {
            amount0Out = 0;
            amount1Out = amountOut;
        }
        else {
            amount0Out = amountOut;
            amount1Out = 0;
        }
        await swap(amount0Out, amount1Out, toAddr).then(
            () => {console.log("swap success");}
            )
            .catch((error) => {
              console.error(error);
            });
    }
}

async function updateCurrentSupply() {
    var web3 = await new Web3(Web3.givenProvider || providerUrl[network.name]);
    var rSupply = rTotal;
    var tSupply = tTotal;
    let excludedLength = await web3.eth.getStorageAt(safemoonAddr, 8);
    console.log("safemoon _excluded length: ", excludedLength);
    for (var i = 0; i < excludedLength; i++) {
        let data = web3.eth.abi.encodeParameters(['uint256'], [8]);
        let slot = ethers.utils.keccak256(data);
        var address_i = await web3.eth.getStorageAt(safemoonAddr, slot);
        console.log("_excluded[", i, "] = ", address_i);
        data = web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [address_i, 3]);
        slot = ethers.utils.keccak256(data);
        addr_i_rOwned = ethers.BigNumber.from(await web3.eth.getStorageAt(safemoonAddr, slot));
        console.log("rOwned: ", addr_i_rOwned);
        data = web3.eth.abi.encodeParameters(['bytes32', 'uint256'], [address_i, 4]);
        slot = ethers.utils.keccak256(data);
        addr_i_tOwned = ethers.BigNumber.from(await web3.eth.getStorageAt(safemoonAddr, slot));
        console.log("tOwned: ", addr_i_tOwned);
        if (addr_i_rOwned.gt(rSupply) || addr_i_tOwned.gt(tSupply)) return [0, 0];
        rSupply = rSupply.sub(addr_i_rOwned);
        tSupply = tSupply.sub(addr_i_tOwned);
    }
    if (rTotal.div(tTotal).gt(rSupply)) return [0, 0];
    return [rTotal.sub(rSupply), tTotal.sub(tSupply)];
}

async function calcCurrentBalanceOfPairInSafemoon(amount) {
    rOldBalance = balanceOfPairInSafemoon.mul(rTotal.sub(rTotalExcluded).div(tTotal.sub(tTotalExcluded)));
    _txFee = amount.mul(txFee).div(feePercent);
    rTotal = rTotal.sub(_txFee);
    tOldBalance = balanceOfPairInSafemoon;
    balanceOfPairInSafemoon = rOldBalance.mul(tTotal.sub(tTotalExcluded).div(rTotal.sub(rTotalExcluded)));
}

async function updateSafemoonStorages() {
    var web3 = await new Web3(Web3.givenProvider || providerUrl[network.name]);
    tTotal = ethers.BigNumber.from(await web3.eth.getStorageAt(safemoonAddr, 9));
    console.log("tTotal: ", tTotal);
    rTotal = ethers.BigNumber.from(await web3.eth.getStorageAt(safemoonAddr, 10));
    console.log("rTotal: ", rTotal);
    let data = web3.eth.abi.encodeParameters(['address','uint256'], [pairAddr, 3]);
    let slot = ethers.utils.keccak256(data);
    rbalanceOfPairInSafemoon = ethers.BigNumber.from(await web3.eth.getStorageAt(safemoonAddr, slot));
    console.log("rbalance of pair use get storage: ", rbalanceOfPairInSafemoon);
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 0));      // _owner
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 1));      // _previousOwner
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 2));      // _lockTime
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 3));      // _rOwned
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 4));      // _tOwned
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 5));      // _allowances
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 6));      // _isExcludedFromFee
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 7));      // _isExcluded
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 8));      // _excluded
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 9));      // _tTotal
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 10));     // _rTotal
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 11));     // _tFeeTotal
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 12));     // _name
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 13));     // _symbol
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 14));     // _decimals
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 15));     // _taxFee
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 16));     // _previousTaxFee
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 17));     // _liquidityFee
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 18));     // _previousLiquidityFee
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 19));     // inSwapAndLiquify/swapAndLiquifyEnabled
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 20));     // _maxTxAmount
    // console.log(await web3.eth.getStorageAt(safemoonAddr, 21));     // numTokensSellToAddToLiquidity
}

async function estimateSwapGas() {
    // let abi = await new ethers.utils.AbiCoder();
    // let _data = abi.encode(["bytes", "bytes", "bytes", "address", "bytes"], ['0x022c0d9f', 0x100, 0x200, owner.address, []]);
    // console.log(_data);
    // let HDWalletProvider = require('truffle-hdwallet-provider')
    // let terms = 'truly state fruit rug decide riot shy lake apple orphan october dinosaur'
    // let netIp = 'https://ropsten.infura.io/v3/4c25a49808354c5480f97d4c82117ee4'
    // let provider = new HDWalletProvider(terms, netIp)
    // var web3 = await new Web3(provider);
    var amount0Out;
    var amount1Out;
    console.log("balance: ", balanceOfPairInSafemoon, ", reserve: ", reserveSafemoon, ", amountIn: ", balanceOfPairInSafemoon.sub(reserveSafemoon));
    var out = await getAmountOut(balanceOfPairInSafemoon.sub(reserveSafemoon), reserveSafemoon, reserveOther);
    if (token0 == safemoonAddr) {
        amount0Out = 0;
        amount1Out = out;
    }
    else {
        amount0Out = out;
        amount1Out = 0;
    }
    console.log("amount0Out: ", amount0Out, ", amount1Out: ", amount1Out);
    console.log("provider url: ", providerUrl[network.name]);
    var web3 = await new Web3(Web3.givenProvider || providerUrl[network.name]);
    let _data = web3.eth.abi.encodeFunctionCall({
        name: 'swap',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: 'amount0Out'
        },{
            type: 'uint256',
            name: 'amount1Out'
        },{
            type: 'address',
            name: 'to'
        },{
            type: 'bytes',
            name: 'data'
        }]
    }, [amount0Out, amount1Out.toString(), toAddr, '0x']);
    console.log(_data);
    let gas = await web3.eth.estimateGas({
        to: pairAddr,
        data: _data
    });
    return gas;
}

async function parseTransferEvent(event) {
    console.log("receive safemoon Transfer event begin");
    let [owner]  = await ethers.getSigners();
    const TransferEvent = new ethers.utils.Interface(["event Transfer(address indexed from, address indexed to, uint value)"]);
    let decodedData = TransferEvent.parseLog(event);
    console.log("from:" + decodedData.args.from);
    console.log("to:" + decodedData.args.to);
    console.log("value:" + decodedData.args.value.toString());
    if (decodedData.args.from == pairAddr) {
        // TODO: 可能有人误操作往pair里面单独转账，没有调用mint接口提供流动性，此时是可以赶在用户反应过来之前套利的
        console.log("transfer from pair");
    }
    else if (decodedData.args.to == pairAddr) {
        console.log("transfer to pair");
    }
    else {
        await calcCurrentBalanceOfPairInSafemoon(decodedData.args.value);
        console.log("after calculate");
        if (balanceOfPairInSafemoon > reserveSafemoon) {
            trySwap();
        }
    }
    console.log("receive safemoon Transfer event end");
}

async function parseSyncEvent(event) {
    console.log("receive pair Sync event begin");
    const SyncEvent = new ethers.utils.Interface(["event Transfer(uint112 reserve0, uint112 reserve1)"]);
    let decodedData = SyncEvent.parseLog(event);
    console.log("reserve0:" + decodedData.args.reserve0);
    console.log("reserve1:" + decodedData.args.reserve1);
    updateReserves(decodedData.args.reserve0, decodedData.args.reserve1);
    console.log("receive pair Sync event end");
}

async function initialize() {
    console.log("initialize begin");
    console.log("current network: ", network.name);
    let [owner, owner2]  = await ethers.getSigners();
    const Safemoon = await new ethers.ContractFactory(erc20Abi, erc20ByteCode, owner);
    safemoon = await Safemoon.attach(safemoonAddr);
    const UniswapV2Pair = await new ethers.ContractFactory(pairAbi, pairByteCode, owner);
    pair = await UniswapV2Pair.attach(pairAddr);
    
    console.log("check pair is exclude begin");
    if (0 == excludedCheckState)
    {
        /* TODO: 
        先将配置文件中的excludedCheckState值更改为3，表示该safemoon不支持isExcludedFromReward接口
        */
        let isExcluded = await safemoon.isExcludedFromReward(pairAddr);
        console.log("pair is exclude from safemoon: ", isExcluded);
        /* TODO: 
        pair未被排除分红，更改配置文件里面的excludedCheckState值为1
        被排除分红，更改值为2
        */
        if (isExcluded)
        {
            return;
        }
    }
    else if (2 == excludedCheckState) {
        console.log("pair is excluded from safemoon");
        return;
    }
    else if (3 == excludedCheckState) {
        console.log("safemoon not support isExcludedFromReward function");
        return;
    }
    console.log("check pair is exclude finished");
    console.log("token0 update begin");
    token0 = await pair.token0();
    console.log("token0 update finished, token0: ", token0);

    console.log("init reserves begin");
    let results = await pair.getReserves();
    console.log("getReserves returns: ", results);
    updateReserves(results[0], results[1]);
    console.log("init reserves finished");

    console.log("updateSafemoonStorages begin");
    await updateSafemoonStorages();
    balanceOfPairInSafemoon = await safemoon.balanceOf(pairAddr);
    console.log("balance of pair: ", balanceOfPairInSafemoon);
    console.log("updateSafemoonStorages end");
    // tTotal = await safemoon.totalSupply();
    // rTotal = await safemoon.reflectionFromToken(tTotal, false);

    console.log("updateCurrentSupply begin");
    let res = await updateCurrentSupply();
    rTotalExcluded = res[0];
    tTotalExcluded = res[1];
    console.log("updateCurrentSupply end, rTotalExcluded: ", rTotalExcluded, "tTotalExcluded: ", tTotalExcluded);

    // 本地测试预测的gas
    // console.log("estimate gas begin");
    // estimateGas = await estimateSwapGas();
    // console.log("estimate gas end, gas: ", estimateGas);
    // console.log("initialize finished");
    estimateGas = 148229;
}

async function listenTransferEvent() {
    let filter = safemoon.filters.Transfer()
    ethers.provider.on(filter, (event) => {
        parseTransferEvent(event, db);
    })
}

async function listenSyncEvent() {
    let filter = pair.filters.Transfer()
    ethers.provider.on(filter, (event) => {
        parseSyncEvent(event);
    })
}

async function bigNumberTest() {
    var web3 = await new Web3(Web3.givenProvider || providerUrl[network.name]);
    let data = web3.eth.abi.encodeParameters(['address','uint256'], [pairAddr, 3]);
    let slot = ethers.utils.keccak256(data);
    rbalanceOfPairInSafemoon = ethers.BigNumber.from(await web3.eth.getStorageAt(safemoonAddr, slot));
    console.log(rbalanceOfPairInSafemoon);
}

async function testFunction() {

    // estimateGas = await estimateSwapGas();
    // console.log(estimateGas);

    // await updateSafemoonStorages();
    // let res = await updateCurrentSupply();
    // console.log(res);
    // console.log("rSupply: ", ethers.utils.formatUnits(res[0], 10), ", tSupply: ", ethers.utils.formatUnits(res[1], 10));
    // await bigNumberTest();
}

async function main() {
    await initialize();
    // await listenTransferEvent();
    // await listenSyncEvent();

    await testFunction();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });