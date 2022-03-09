// SPDX-License-Identifier: MIT

import "./ERC20.sol";

pragma solidity >=0.6.0 <0.8.0;

contract WHERC20Token is ERC20 {
    address private owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner can call this function");
        _;
    }
    
    constructor() ERC20("WH Token", "WHT") public {
        owner = msg.sender;
    }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }
}