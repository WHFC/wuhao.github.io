// SPDX-License-Identifier: MIT

pragma solidity =0.6.6;

import '../uniswap-v2-periphery-master/contracts/interfaces/IUniswapV2Router01.sol';
import '../openzeppelin-contracts/contracts/token/ERC20/SafeERC20.sol';
import '../uniswap-v2-periphery-master/contracts/libraries/TransferHelper.sol';

contract UniswapMarketV2 {
    using SafeERC20 for IERC20;
    // ropsten
    // address private constant router = 0xd507f9CA60a809358E1F0B88209DAE311cff74Fc;
    // address private constant WETH = 0x211848E6fe90c84099Ab46cD92b00cAa6952f4d5;
    // address private constant A = 0x12930419877125535D5F30E7eDB24eD204F6A735;
    // address private constant B = 0x8bBf5E921Dc75B3b8bA949F6cfF64ED250435F29;
    address private constant router = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;
    address private constant WETH = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
    address private constant token = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;

    // msg.sender先调用tokenA的approve，授权给market合约amount数额
    function addLiquidity(
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to
    )
        external
        payable
        returns (uint amountToken, uint amountETH, uint liquidity)
    {
        require(address(0) != to, "UniswapMarket: address to invalid");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amountTokenDesired);
        IERC20(token).safeApprove(router, amountTokenDesired);
        (amountToken, amountETH, liquidity) = IUniswapV2Router01(router).addLiquidityETH{value:msg.value}(token, amountTokenDesired, amountTokenMin, amountETHMin, to, block.timestamp);
        // refund dust eth, if any
        if (msg.value > amountETH) TransferHelper.safeTransferETH(msg.sender, msg.value - amountETH);
        else if (amountTokenDesired > amountToken) IERC20(token).safeTransferFrom(address(this), msg.sender, amountTokenDesired - amountToken);
    }

    function buyToken(
        uint256 amountOutMin,
        address to
    ) external payable returns (uint[] memory amounts) {
        address[] memory path = new address[] (2);
        path[0] = WETH;
        path[1] = token;
        amounts = IUniswapV2Router01(router).swapExactETHForTokens{value:msg.value}(amountOutMin, path, to, block.timestamp);
    }
}