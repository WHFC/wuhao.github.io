const { ethers } = require("hardhat");
const Web3 = require('web3');
const { safemoonAddr, pairAddr, toAddr, swapContractAddr, providerUrl, swapData, txFee, feePercent, excludedCheckState } = require('./config/InterestArbitrageConfig.json');
const { abi:erc20Abi, bytecode:erc20ByteCode } = require('../../artifacts/contracts/HecoSwap/IERC20.sol/IERC20.json');
const { abi:pairAbi, bytecode:pairByteCode } = require('../../artifacts/contracts/HecoSwap/IUniswapV2Pair.sol/IUniswapV2Pair.json');
const { abi:hecoSwapAbi, bytecode:hecoSwapByteCode } = require('../../artifacts/contracts/HecoSwap/HecoSwap.sol/HecoSwap.json');
const { getAddress } = require("@ethersproject/address");

var reserveSafemoon;
var reserveOther;
var balanceOfPairInSafemoon;
var rbalanceOfPairInSafemoon;
var rTotal;
var tTotal;
var rTotalExcluded;
var tTotalExcluded;
var token0;
var safemoonOwner;
var safemoonDecimals;
var estimateGas;
var estimateGasCount = 10;
let safemoon;
let pair;
let hecoSwap;
let lastTransferBlockNumber = 0;
var subscription;
var transferFuncSelector = "0xa9059cbb";

const overrides = {
    gasLimit: ethers.utils.parseUnits('500000', 0),
    gasPrice: ethers.utils.parseUnits('2.75', 'gwei')
  }

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
    console.log("reserves update-to-data, now reserveSafemoon: ", ethers.utils.formatUnits(reserveSafemoon, safemoonDecimals)
        , ", reserveOther: ", ethers.utils.formatUnits(reserveOther, safemoonDecimals));
}

async function getAmountOut(amountIn, reserveIn, reserveOut) {
    let amountInWithFee = amountIn.mul(997);
    let numerator = amountInWithFee.mul(reserveOut);
    let denominator = reserveIn.mul(1000).add(amountInWithFee);
    return numerator.div(denominator);
}

async function swap(amount0Out, amount1Out, to) {
    let tx = await pair.swap(amount0Out, amount1Out, to, '0x', overrides);
    await tx.wait();
}

async function swapUseContract() {
    var gasFee = ethers.BigNumber.from('1').mul(94783).mul(overrides.gasPrice).mul(103).div(100);
    let tx = await hecoSwap.trySwap(safemoonAddr, pairAddr, toAddr, gasFee, overrides);
    await tx.wait();
}

async function trySwap(blockNumber) {
    let amountOut = await getAmountOut(balanceOfPairInSafemoon.sub(reserveSafemoon), reserveSafemoon, reserveOther);
    if (amountOut > 0)
    {
        console.log("estimate gas begin");
        // estimateGas = await estimateSwapGas().then(
        await estimateContractTrySwapGas().then(
            (gas) => {
                console.log("estimate gas end, gas: ", gas);
                estimateGas = gas;
                // if (0 == estimateGas)
                // {
                //     estimateGasCount = 10;
                //     return;
                // }
                var _estimateGas = ethers.BigNumber.from('1').mul(gas).mul(overrides.gasPrice).div(1000000000).mul(103).div(100);
                ++estimateGasCount;
                let _gas = ethers.utils.parseUnits(_estimateGas.toString(), 9);
                console.log("estimate gas: ", ethers.utils.formatUnits(_gas, 18)
                    , ", calc amount out: ", ethers.utils.formatUnits(amountOut, 18)
                    , ", amountOut - estimateGas =", ethers.utils.formatUnits(amountOut.sub(_gas), 18));
                if (_gas.gt(amountOut)) {
                    console.log("not enough interest arbitrage space");
                }
                else {
                    if (blockNumber == lastTransferBlockNumber)
                    {
                        console.log("same bloknumber");
                        return;
                    }
                    lastTransferBlockNumber = blockNumber;
                    console.log("receive Transfer in block number:", blockNumber, "trySwap");
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
                    // await swap(amount0Out, amount1Out, toAddr).then(
                    swapUseContract().then(
                        () => {
                            console.log("swap success");
                            console.log("try resync pair and safemoon params begin");
                            updateReservesInPair().then(() => {
                                updateSafemoonParams().then(() => {
                                    console.log("resync pair and safemoon params finished");
                                });
                            })
                            .catch((error) => {
                              console.error(error);
                              console.log("resync pair and safemoon params fail");
                            });
                        }
                        )
                        .catch((error) => {
                          console.error(error);
                          console.log("try resync pair and safemoon params begin");
                          updateReservesInPair().then(() => {
                              updateSafemoonParams().then(() => {
                                  console.log("resync pair and safemoon params finished");
                              });
                          })
                          .catch((error) => {
                            console.error(error);
                            console.log("resync pair and safemoon params fail");
                          });
                        });
                }
            }
            ).catch((error) => {
            console.error(error);
            return;
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
    rOldBalance = balanceOfPairInSafemoon.mul(rTotal.sub(rTotalExcluded)).div(tTotal.sub(tTotalExcluded));
    rAmount = amount.mul(rTotal.sub(rTotalExcluded)).div(tTotal.sub(tTotalExcluded));
    _txFee = rAmount.mul(txFee).div(feePercent);
    // console.log("old: ", ethers.utils.formatUnits(rOldBalance, safemoonDecimals)
    //     , ethers.utils.formatUnits(tTotal, safemoonDecimals)
    //     , ethers.utils.formatUnits(tTotalExcluded, safemoonDecimals)
    //     , ethers.utils.formatUnits(rTotal, safemoonDecimals)
    //     , ethers.utils.formatUnits(rTotalExcluded, safemoonDecimals)
    //     , ethers.utils.formatUnits(_txFee, safemoonDecimals));
    rTotal = rTotal.sub(_txFee);
    tOldBalance = balanceOfPairInSafemoon;
    balanceOfPairInSafemoon = rOldBalance.mul(tTotal.sub(tTotalExcluded)).div(rTotal.sub(rTotalExcluded));
    // console.log("old: ", ethers.utils.formatUnits(rOldBalance, safemoonDecimals)
    //     , ethers.utils.formatUnits(tTotal, safemoonDecimals)
    //     , ethers.utils.formatUnits(tTotalExcluded, safemoonDecimals)
    //     , ethers.utils.formatUnits(rTotal, safemoonDecimals)
    //     , ethers.utils.formatUnits(rTotalExcluded, safemoonDecimals)
    //     , ethers.utils.formatUnits(_txFee, safemoonDecimals));
    console.log("old balance: ", ethers.utils.formatUnits(tOldBalance, safemoonDecimals)
        , ", new balance: ", ethers.utils.formatUnits(balanceOfPairInSafemoon, safemoonDecimals)
        , ", 多余的: ", ethers.utils.formatUnits(balanceOfPairInSafemoon.sub(reserveSafemoon), safemoonDecimals));
}

async function updateSafemoonStorages() {
    var web3;
    // if (network.name == "hecoChain") {
    //     web3 = await new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider('ws://remotenode.com:8546'));
    // }
    // else 
    {
        web3 = await new Web3(Web3.givenProvider || providerUrl[network.name]);
    }
    tTotal = ethers.BigNumber.from(await web3.eth.getStorageAt(safemoonAddr, 9));
    console.log("tTotal update-to-data: ", ethers.utils.formatUnits(tTotal, safemoonDecimals));
    rTotal = ethers.BigNumber.from(await web3.eth.getStorageAt(safemoonAddr, 10));
    console.log("rTotal update-to-data: ", ethers.utils.formatUnits(rTotal, safemoonDecimals));
    let data = web3.eth.abi.encodeParameters(['address','uint256'], [pairAddr, 3]);
    let slot = ethers.utils.keccak256(data);
    rbalanceOfPairInSafemoon = ethers.BigNumber.from(await web3.eth.getStorageAt(safemoonAddr, slot));
    console.log("rbalance of pair use get storage: ", ethers.utils.formatUnits(rbalanceOfPairInSafemoon, safemoonDecimals));
    console.log("owner: ", await web3.eth.getStorageAt(safemoonAddr, 0));
    safemoonOwner = "0x0000000000000000000000000000000000000000";
    // safemoonOwner = ethers.utils.getAddress(ethers.BigNumber.from(await web3.eth.getStorageAt(safemoonAddr, 0)).toHexString());
    console.log("get safemoon owner: ", safemoonOwner);
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

async function estimateContractTrySwapGas() {
    return 94783;
    if (estimateGasCount < 10)
        return estimateGas;
    estimateGasCount = 0;
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
        name: 'trySwap',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'safemoon'
        },{
            type: 'address',
            name: 'pair'
        },{
            type: 'address',
            name: 'to'
        },{
            type: 'uint256',
            name: 'pirce'
        }]
    }, [safemoonAddr, pairAddr, toAddr, 0]);
    console.log(_data);
    let gas = await web3.eth.estimateGas({
        to: swapContractAddr,
        data: _data
    });
    console.log("swap gas: ", gas);
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
    else if (decodedData.args.from == safemoonOwner) {
        console.log("transfer from safemoon owner");
    }
    else if (decodedData.args.to == safemoonOwner) {
        console.log("transfer to safemoon owner");
    }
    // else if (decodedData.args.from == ExcludedFromFee) {   // TODO: 从_isExcludedFromFee的地址转账，或转账给_isExcludedFromFee的地址，是不会有手续费产生的，也就没有分红
    //     console.log("transfer to pair");
    // }
    // TODO 从_excluded转账或转给_excluded地址，应该会对目前版本的线下计算产生影响，导致计算pair余额增长不准确。使用线上合约套利或者将_excluded全部获取到线下另作处理
    else {
        await calcCurrentBalanceOfPairInSafemoon(decodedData.args.value);
        console.log("after calculate, balanceOfPairInSafemoon: ", ethers.utils.formatUnits(balanceOfPairInSafemoon, safemoonDecimals)
            , ", reserveSafemoon: ", ethers.utils.formatUnits(reserveSafemoon, safemoonDecimals));
        if (balanceOfPairInSafemoon > reserveSafemoon) {
            console.log("try swap begin");
            trySwap(event.blockNumber).then(() => {
                console.log("try swap end");
            });
        }
    }
    console.log("receive safemoon Transfer event end");
}

async function parseSyncEvent(event) {
    console.log("receive pair Sync event begin");
    const SyncEvent = new ethers.utils.Interface(["event Sync(uint112 reserve0, uint112 reserve1)"]);
    let decodedData = SyncEvent.parseLog(event);
    console.log("reserve0:" + decodedData.args.reserve0);
    console.log("reserve1:" + decodedData.args.reserve1);
    updateReserves(decodedData.args.reserve0, decodedData.args.reserve1);
    console.log("receive pair Sync event end");
}

async function updateReservesInPair() {
    let results = await pair.getReserves();
    console.log("getReserves end: ", ethers.utils.formatUnits(results[0], safemoonDecimals), ethers.utils.formatUnits(results[1], safemoonDecimals));
    await updateReserves(results[0], results[1]);
}

async function updateSafemoonParams() {
    await updateSafemoonStorages();
    balanceOfPairInSafemoon = await safemoon.balanceOf(pairAddr);
    console.log("balance of pair: ", ethers.utils.formatUnits(balanceOfPairInSafemoon, safemoonDecimals));
}

async function initialize() {
    console.log("initialize begin");
    console.log("current network: ", network.name);
    console.log("txFee: ", txFee
        , ", feePercent: ", feePercent);
    let [owner, owner2]  = await ethers.getSigners();
    const Safemoon = await new ethers.ContractFactory(erc20Abi, erc20ByteCode, owner);
    safemoon = await Safemoon.attach(safemoonAddr);
    const UniswapV2Pair = await new ethers.ContractFactory(pairAbi, pairByteCode, owner);
    pair = await UniswapV2Pair.attach(pairAddr);
    const HecoSwap = await new ethers.ContractFactory(hecoSwapAbi, hecoSwapByteCode, owner);
    hecoSwap = await HecoSwap.attach(swapContractAddr);
    
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

    console.log("get safemoon decimals begin");
    safemoonDecimals = ethers.utils.formatUnits(await safemoon.decimals(), 0);
    console.log("get safemoon decimals end: ", safemoonDecimals);

    console.log("init reserves begin");
    await updateReservesInPair();
    console.log("init reserves finished");

    console.log("updateSafemoonStorages begin");
    await updateSafemoonParams();
    console.log("updateSafemoonStorages end");
    // tTotal = await safemoon.totalSupply();
    // rTotal = await safemoon.reflectionFromToken(tTotal, false);

    console.log("updateCurrentSupply begin");
    let res = await updateCurrentSupply();
    rTotalExcluded = res[0];
    tTotalExcluded = res[1];
    console.log("updateCurrentSupply end, rTotalExcluded: ", ethers.utils.formatUnits(rTotalExcluded, safemoonDecimals)
        , "tTotalExcluded: ", ethers.utils.formatUnits(tTotalExcluded, safemoonDecimals));

    // 本地测试预测的gas
    // console.log("estimate gas begin");
    // estimateGas = await estimateSwapGas();
    // console.log("estimate gas end, gas: ", estimateGas);
    // console.log("initialize finished");
    estimateGas = 0;//95000*overrides.gasPrice/1000000000;//148229;
}

async function listenTransferEvent() {
    console.log("exec listen safemoon Transfer event begin");
    let filter = safemoon.filters.Transfer()
    ethers.provider.on(filter, (event) => {
        parseTransferEvent(event);
    })
    console.log("exec listen safemoon Transfer event end");
}

async function listenSyncEvent() {
    console.log("exec listen pair Sync event begin");
    let filter = pair.filters.Sync()
    ethers.provider.on(filter, (event) => {
        parseSyncEvent(event);
    })
    console.log("exec listen pair Sync event end");
}

async function parsePendingTransaction(transaction) {
    if (transaction.hasOwnProperty("to")
    && transaction.hasOwnProperty("gasPrice")
    && transaction.hasOwnProperty("input")){
        var to = transaction.to;
        var input = transaction.input;
        var gasPrice = transaction.gasPrice;
        // console.log("to: ", to, ", gasPrice: ", gasPrice, ", input: ", input);
        if (ethers.utils.getAddress(to) == safemoonAddr) {
            console.log("parsePendingTransaction, input: ", input);
            var func = await input.slice(0, 10);
            if (transferFuncSelector == func) {
                console.log("receive transfer pending transaction");
                await setGasPrice(gasPrice);
                var last64Char = "0x" + await input.slice(74);
                console.log("last 64 char: ", last64Char);
                var value = ethers.BigNumber.from(last64Char);
                console.log("value: ", ethers.utils.formatUnits(value, 9));
                await calcCurrentBalanceOfPairInSafemoon(value);
                console.log("after calculate, balanceOfPairInSafemoon: ", ethers.utils.formatUnits(balanceOfPairInSafemoon, safemoonDecimals)
                    , ", reserveSafemoon: ", ethers.utils.formatUnits(reserveSafemoon, safemoonDecimals));
                if (balanceOfPairInSafemoon > reserveSafemoon) {
                    console.log("try swap begin");
                    trySwap(transaction.blockNumber).then(() => {
                        console.log("try swap end");
                    });
                }
            }
        }
    }
}

async function setGasPrice(gasPrice) {
    console.log("transfer gas: ", gasPrice);
    var _gasPrice = ethers.BigNumber.from('1').mul(gasPrice);
    // if (_gasPrice.lt(ethers.utils.parseUnits('2.76', 9))) {
    //     _gasPrice = _gasPrice.add(ethers.utils.parseUnits("0.1", 9));
    // }
    if (_gasPrice.lt(ethers.utils.parseUnits('2.25', 9)))
    {
        _gasPrice = ethers.utils.parseUnits('2.25', 9);
    }
    if (_gasPrice.gt(ethers.utils.parseUnits('3.0', 9)))
    {
        _gasPrice = ethers.utils.parseUnits('3.0', 9);
    }
    if (!overrides.gasPrice.eq(_gasPrice)) {
        console.log("update gasPirce old: ", ethers.utils.formatUnits(overrides.gasPrice, 9), ", new: ", ethers.utils.formatUnits(_gasPrice, 9));
        overrides.gasPrice = _gasPrice;
    }
}

async function listenPendingTransactions() {
    console.log("exec listen pending transaction begin");
    var web3;
    // if (network.name == "hecoChain") {
    //     web3 = await new Web3(Web3.givenProvider || await new Web3.providers.HttpProvider(providerUrl[network.name]));
    // }
    // else 
    {
        web3 = await new Web3(Web3.givenProvider || providerUrl[network.name]);
    }
    subscription = web3.eth.subscribe('pendingTransactions', (error, result) => {
        if (!error)
        {
            web3.eth.getTransaction(result)
            .then((transaction) => {
                if (!transaction) {
                    console.log("getTransaction return null, hash: ", result);
                    return;
                }
                parsePendingTransaction(transaction);
                // var to = transaction.to;
                // var gasPrice = transaction.gasPrice;
                // var input = transaction.input;
                // console.log("to: ", to, ", gasPrice: ", gasPrice, ", input: ", input);
                // setGasPrice(gasPrice).then(() => {
                //     parsePendingTransaction(to, input).then(() => {
                //     })
                //     .catch((error) => {
                //         console.log("parsePendingTransaction fail");
                //     });
                // }).catch((error) => {
                //     console.log("parse transaction gasPrice fail");
                // });
            })
            .catch((error) => {
                console.log("parse transaction fail");
            });
            }
    })
    // .on("data", function(transactionHash){
    //     web3.eth.getTransaction(transactionHash)
    //     .then(function (transaction) {
    //         var to = transaction.to;
    //         var gasPrice = transaction.gasPrice;
    //         var input = transaction.input;
    //         console.log("to: ", to, ", gasPrice: ", gasPrice, ", input: ", input);
    //         setGasPrice(gasPrice).then(() => {
    //             parsePendingTransaction(to, input).then(() => {
    //             })
    //             .catch((error) => {
    //                 console.log("parsePendingTransaction fail");
    //             });
    //         }).catch((error) => {
    //             console.log("parse transaction gasPrice fail");
    //         });
    //     })
    //     .catch((error) => {
    //         console.log("parse transaction fail");
    //     });
    // });
    console.log("exec listen pending transaction end");
}

async function bigNumberTest() {
    var web3 = await new Web3(Web3.givenProvider || providerUrl[network.name]);
    let data = web3.eth.abi.encodeParameters(['address','uint256'], [pairAddr, 3]);
    let slot = ethers.utils.keccak256(data);
    rbalanceOfPairInSafemoon = ethers.BigNumber.from(await web3.eth.getStorageAt(safemoonAddr, slot));
    console.log(rbalanceOfPairInSafemoon);
}

async function testFunction() {
    // setGasPrice(ethers.utils.parseUnits('2.76', 9));
    // var _estimateGas = ethers.BigNumber.from('1').mul(94783).mul(overrides.gasPrice).mul(103).div(100);
    // console.log("trySwap price param: ", ethers.utils.formatUnits(_estimateGas, 18));

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
    await listenTransferEvent();
    await listenSyncEvent();
    // await listenPendingTransactions();

    // await testFunction();
}

main()