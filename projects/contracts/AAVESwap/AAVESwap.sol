pragma solidity 0.8.10;
import '../aave-v3-core/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol';
import '../uniswap-v2-core-master/contracts/interfaces/IUniswapV2Callee.sol';
import '../uniswap-v2-core-master/contracts/interfaces/IUniswapV2Pair.sol';
import '../uniswap-v2-periphery-master/contracts/interfaces/IUniswapV2Router01.sol';
import '../uniswap-v2-periphery-master/contracts/libraries/UniswapV2Library.sol';
import './UniswapV3FromKovan/IV3SwapRouter.sol';
import '../uniswap-v2-core-master/contracts/interfaces/IERC20.sol';
import '../v3-periphery/contracts/libraries/TransferHelper.sol';
// import './AAVEV3FromRinkeby/IPoolAddressesProvider.sol';

contract AAVESwap is FlashLoanSimpleReceiverBase {
    IUniswapV2Router01 public constant v2router = IUniswapV2Router01(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);   // v2router on rinkeby
    IV3SwapRouter public constant v3router = IV3SwapRouter(0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45);          // v3router on rinkeby
    IPoolAddressesProvider public constant poolAddressProvider = IPoolAddressesProvider(0xA55125A90d75a95EC00130E8E8C197dB5641Eb19); // pool address provider on rinkeby
    address public constant DAI = 0x2Ec4c6fCdBF5F9beECeB1b51848fc2DB1f3a26af;                  // DAI on rinkeby
    address public constant WHT = 0x322ACc3d2a82c1D44e30263DD31A3A5A60F1D327;                 // WHT on rinkeby

    constructor() FlashLoanSimpleReceiverBase(poolAddressProvider) {
    }

    function flashloan(uint256 value) external returns (bool) {
        POOL.flashLoanSimple(address(this), DAI, value, abi.encode(uint256(value)), 0);
        uint256 balance = IERC20(DAI).balanceOf(address(this));
        require(balance > 0, "invalid flashloan");
        TransferHelper.safeTransfer(DAI, msg.sender, balance);
        return true;
    }

    function executeOperation(
    address asset,
    uint256 amount,
    uint256 premium,
    address initiator,
    bytes calldata params
  ) external returns (bool) {
        require(DAI == asset, "only receive DAI");
        require(amount > 0, "invalid amount");
        // 将收到的DAI授权给uniswap v2 router
        TransferHelper.safeApprove(DAI, address(v2router), amount);
        address[] memory path = new address[](2);
        path[0] = DAI;
        path[1] = WHT;
        // 在v2router中，使用DAI兑换token0
        uint256 amountOut1 = v2router.swapExactTokensForTokens(amount, 0, path, address(this), block.timestamp+2000)[1];
        // 将对话的otken0授权给uniswap v3 router
        TransferHelper.safeApprove(WHT, address(v3router), amountOut1);
        // 在v3router中兑换DAI
        uint256 amountOut2 = v3router.exactInputSingle(IV3SwapRouter.ExactInputSingleParams({
            tokenIn:WHT,
            tokenOut:DAI,
            fee:3000,
            recipient:address(this),
            amountIn:amountOut1,
            amountOutMinimum:0,
            sqrtPriceLimitX96:0
        }));
        // 需要偿还的总额为借出的amount + 手续费premium
        uint256 debt = amount + premium;
        require(amountOut2 >= debt, "amount lower than debt");
        (uint minTokens) = abi.decode(params, (uint256));
        require(minTokens >= amountOut2 - debt, "not enough rewards");
        // 将多余的DAI转给交易发起人
        TransferHelper.safeTransfer(DAI, initiator, amountOut2 - debt);
        // 将需要偿还债务的DAI授权给POOL
        TransferHelper.safeApprove(DAI, msg.sender, debt);
        return true;
  }
}