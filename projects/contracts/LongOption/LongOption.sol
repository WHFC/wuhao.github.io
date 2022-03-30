// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import '../openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol';

contract LongOption is ERC1155 {
    // like usdc
    address public immutable stableCurrency;
    constructor(uint256 deliveryTime, address stableToken) payable {
        stableCurrency = stableToken;
    }
}