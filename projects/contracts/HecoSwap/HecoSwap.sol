// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "../uniswap-v2-periphery-master/contracts/libraries/UniswapV2Library.sol";
import "../uniswap-v2-core-master/contracts/interfaces/IUniswapV2Pair.sol";
import "../uniswap-v2-core-master/contracts/interfaces/IERC20.sol";

contract HecoSwap {
    constructor() {
    }

    function trySwap(address safemoon, address pair, address to, uint256 pirce) external returns (uint256 result) {
        uint256 amountOut;
        uint256 amountOut0;
        uint256 amountOut1;
        {
            uint256 reserve0;
            uint256 reserve1;
            address token0 = IUniswapV2Pair(pair).token0();
            uint256 balance = IERC20(safemoon).balanceOf(pair);
            (reserve0, reserve1, ) = IUniswapV2Pair(pair).getReserves();
            uint256 reserveSafemoon = token0 == safemoon ? reserve0 : reserve1;
            uint256 reserveOther = token0 == safemoon ? reserve1 : reserve0;
            uint256 amountIn = balance - reserveSafemoon;
            require(amountIn > 0, "not enough amountIn");
            amountOut = UniswapV2Library.getAmountOut(amountIn, reserveSafemoon, reserveOther);
            require(amountOut > pirce, "not enough interest arbitrage space");
            amountOut0 = token0 == safemoon ? 0 : amountOut;
            amountOut1 = token0 == safemoon ? amountOut : 0;
        }
        IUniswapV2Pair(pair).swap(amountOut0, amountOut1, to, new bytes(0));
        return amountOut;
    }
}