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

    function deposit(uint256 amount) external {
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer from error");
        depositors[msg.sender] = depositors[msg.sender].add(amount);
    }

    function withdraw(uint256 amount) external {
        depositors[msg.sender] = depositors[msg.sender].sub(amount, "withdraw amount exceeds balance");
        require(IERC20(token).transfer(msg.sender, amount), "Transfer from error");
    }

    function balanceOf(address depositor) external view returns (uint256) {
        return depositors[depositor];
    }
}