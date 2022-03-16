// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '../uniswap-v2-periphery-master/contracts/interfaces/IUniswapV2Router02.sol';

contract UniswapMarket {
    // ropsten
    // address private constant router = 0xd507f9CA60a809358E1F0B88209DAE311cff74Fc;
    // address private constant WETH = 0x211848E6fe90c84099Ab46cD92b00cAa6952f4d5;
    // address private constant A = 0x12930419877125535D5F30E7eDB24eD204F6A735;
    // address private constant B = 0x8bBf5E921Dc75B3b8bA949F6cfF64ED250435F29;
    address private constant router = 0x7874d94b8f9E2a28FCceCE404666C984f33a82b8;
    address private constant WETH = 0xB25f1f0B4653b4e104f7Fbd64Ff183e23CdBa582;
    address private constant A = 0x19a0870a66B305BE9917c0F14811C970De18E6fC;
    address private constant B = 0xfB72aAdB17a855D27A68B565ee0a84CB30A387e4;
    mapping(address => mapping(address => uint256)) public tokenBalances;

    function depositTokenA(uint256 amount) external returns (bool) {
        return depositToken(A, amount);
    }

    function depositTokenB(uint256 amount) external returns (bool result) {
        return depositToken(B, amount);
    }
    
    function addLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) external returns (uint amountA, uint amountB, uint liquidity) {
        require(tokenBalances[A][msg.sender] >= amountADesired, "UniswapMarket: not enough tokenA");
        require(tokenBalances[B][msg.sender] >= amountBDesired, "UniswapMarket: not enough tokenB");
        tokenBalances[A][msg.sender] -= amountADesired;
        tokenBalances[B][msg.sender] -= amountBDesired;
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory payload = abi.encodeWithSignature("addLiquidity(address,address,uint,uint,uint,uint,address,uint)"
        , A
        , B
        , amountADesired
        , amountBDesired
        , amountAMin
        , amountBMin
        , to
        , deadline);
        assembly {
            let result := call(gas(), router, 0, add(payload, 0x20), mload(payload), 0, 0)

            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 { revert(0, returndatasize()) }
            default { 
                amountA := mload(0)
                amountB := mload(0x20)
                liquidity := mload(0x40)
            }
        }
    }

    function buyTokenA(
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) external returns (uint[] memory amounts) {
        return buyToken(B, A, amountIn, amountOutMin, to);
    }

    function buyTokenB(
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) external returns (uint[] memory amounts) {
        return buyToken(A, B, amountIn, amountOutMin, to);
    }

    function depositToken(address token, uint256 amount) internal returns (bool result) {
        bytes memory payload = abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amount);
        assembly {
            let _result := call(gas(), token, 0, add(payload, 0x20), mload(payload), 0, 0)

            returndatacopy(0, 0, returndatasize())

            switch _result
            // delegatecall returns 0 on error.
            case 0 { revert(0, returndatasize()) }
            default { 
                result := mload(0)
            }
        }
        tokenBalances[token][msg.sender] += amount;
    }

    function buyToken(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin, address to) internal returns (uint[] memory) {
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory payload = abi.encodeWithSignature("swapExactTokensForTokens(uint,uint,address[],address,uint)", amountIn, amountOutMin, [tokenIn, tokenOut], to, deadline);
        assembly {
            let result := delegatecall(gas(), router, add(payload, 0x20), mload(payload), 0, 0)

            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 { revert(0, returndatasize()) }
            default { 
                return(0, returndatasize())
            }
        }
    }
}