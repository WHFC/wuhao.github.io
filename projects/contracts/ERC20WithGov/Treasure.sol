// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.6.0 <0.8.0;
import '../v3-periphery/contracts/libraries/TransferHelper.sol';
import '../openzeppelin-contracts/contracts/access/Ownable.sol';

contract Treasure is Ownable {

    constructor() payable public {

    }

    function withdraw(address to) external onlyOwner returns (bool) {
        TransferHelper.safeTransferETH(to, address(this).balance);
        return true;
    }

    function time() external view returns (uint256) {
        return block.timestamp;
    }
}