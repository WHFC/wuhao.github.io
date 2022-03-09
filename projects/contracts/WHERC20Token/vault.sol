// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
import "./math/SafeMath.sol";
import "./IERC20.sol";

contract vault {
    using SafeMath for uint256;
    address owner;
    address token;
    mapping(address => uint256) depositors;
    
    constructor(address erc20_token) public {
        owner = msg.sender;
        token = erc20_token;
    }

    function deposit(uint256 amount) public {
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer from error");
        depositors[msg.sender] = depositors[msg.sender].add(amount);
    }

    function withdraw(uint256 amount) {
        _balances[sender] = _balances[sender].sub(amount, "withdraw amount exceeds balance");
        require(IERC20(token).transferFrom(address(this), msg.sender, amount), "Transfer from error");
    }
}