// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

import '../v3-periphery/contracts/libraries/SqrtPriceMathPartial.sol';

contract UniswapV3AmountCalcTest {
    
    function getAmount0(
        uint160 sqrtRatioAX96,
        uint160 sqrtRatioBX96,
        uint128 liquidity,
        bool roundUp
        ) external pure returns (uint256) {
        return SqrtPriceMathPartial.getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, roundUp);
    }

    function getAmount1(
        uint160 sqrtRatioAX96,
        uint160 sqrtRatioBX96,
        uint128 liquidity,
        bool roundUp
        ) external pure returns (uint256) {
        return SqrtPriceMathPartial.getAmount1Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, roundUp);
    }
}