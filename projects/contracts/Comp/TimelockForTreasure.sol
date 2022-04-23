pragma solidity ^0.5.16;

import "./Timelock.sol";

contract TimelockForTreasure is Timelock {
    constructor(address admin_, uint delay_) Timelock(admin_, delay_) public {
    }

    function harnessSetPendingAdmin(address pendingAdmin_) public {
        require(msg.sender == admin, "TimelockForTreasure::harnessSetPendingAdmin: must call from admin");
        this.setPendingAdmin(pendingAdmin_);
    }
}
