// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import {ERC1155} from '../openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol';
import {Ownable} from '../openzeppelin-contracts/contracts/access/Ownable.sol';
import {ERC1155Holder} from '../openzeppelin-contracts/contracts/token/ERC1155/ERC1155Holder.sol';
import {TransferHelper} from '../openzeppelin-contracts/contracts/utils/TransferHelper.sol';

contract LongOption is ERC1155, Ownable, ERC1155Holder {
    // address public constant USDC = 0x5B8B635c2665791cf62fe429cB149EaB42A3cEd8;
    address public immutable USDC;
    uint256 public immutable deliveryTime;
    uint256 public immutable subjectMatterOfETH;
    uint256 public immutable subjectMatterOfUSDC;
    uint256 public immutable price;
    uint256 public totalID;

    // 交割时间之前才支持购买期权
    modifier beforeDeliveryTime() {
        require(block.timestamp < deliveryTime, "LongOption: not before delivery time");
        _;
    }

    // 交割当天才能行使权力
    modifier inDeliveryTime() {
        require(block.timestamp >= deliveryTime && block.timestamp < deliveryTime + 1 days, "LongOption: not in delivery time");
        _;
    }

    // 交割日期之后，才能赎回所有未售出的ETH
    modifier afterDeliveryTime() {
        require(block.timestamp >= deliveryTime + 1 days, "LongOption: not after delivery time");
        _;
    }

    constructor(uint256 _deliveryDays, uint256 _subjectMatterOfETH, uint256 _subjectMatterOfUSDC, uint256 _price, address _USDC) public ERC1155("") payable {
        deliveryTime = block.timestamp.add(_deliveryDays.mul(1 days));
        subjectMatterOfETH = _subjectMatterOfETH;
        subjectMatterOfUSDC = _subjectMatterOfUSDC;
        price = _price;
        USDC = _USDC;
        uint256 count = msg.value.div(_subjectMatterOfETH);
        _mint(msg.sender, totalID++, count, new bytes(0));
        setApprovalForAll(address(this), true);
        if (msg.value.sub(count.mul(_subjectMatterOfETH)) > 0) {
            TransferHelper.safeTransferETH(msg.sender, msg.value.sub(count.mul(_subjectMatterOfETH)));
        }
    }

    function buyOption(address to, uint256 id, uint256 amountOfUSDC) external beforeDeliveryTime returns (bool) {
        uint256 amount = amountOfUSDC.div(price);
        require(amount > 0, "LongOption: zero of amount");
        require(balanceOf(owner(), id) >= amount, "LongOption: out of balance");
        TransferHelper.safeTransferFrom(USDC, msg.sender, owner(), amount.mul(price));
        this.safeTransferFrom(owner(), to, id, amount, new bytes(0));
        return true;
    }

    function delivery(address to, uint256 id, uint256 amountOfUSDC) external inDeliveryTime returns (bool) {
        uint256 amount = amountOfUSDC.div(subjectMatterOfUSDC);
        require(amount > 0, "LongOption: zero of amount");
        require(balanceOf(msg.sender, id) >= amount, "out of balance");
        TransferHelper.safeTransferFrom(USDC, msg.sender, owner(), amount.mul(subjectMatterOfUSDC));
        _burn(msg.sender, id, amount);
        TransferHelper.safeTransferETH(to, amount.mul(subjectMatterOfETH));
        return true;
    }

    function redeem(address to, uint256 id) external afterDeliveryTime onlyOwner returns (bool) {
        uint256 amount = balanceOf(owner(), id);
        _burn(owner(), id, amount);
        TransferHelper.safeTransferETH(to, amount.mul(subjectMatterOfETH));
    }

    function time() external view returns (uint256) {
        return block.timestamp;
    }
}