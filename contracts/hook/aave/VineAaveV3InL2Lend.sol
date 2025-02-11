// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {IVineStruct} from "../../interfaces/IVineStruct.sol";
import {IVineEvent} from "../../interfaces/IVineEvent.sol";
import {ISharer} from "../../interfaces/ISharer.sol";
import {IL2Pool} from "../../interfaces/aaveV3/IL2Pool.sol";
import {IL2Encode} from "../../interfaces/aaveV3/IL2Encode.sol";
import {ICrossCenter} from "../../interfaces/ICrossCenter.sol";
import {IVineHookCenter} from "../../interfaces/core/IVineHookCenter.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract VineAaveV3InL2Lend is
    IVineStruct,
    IVineEvent,
    ISharer
{
    using SafeERC20 for IERC20;
    
    address public factory;
    address public govern;
    address public owner;
    address public manager;

    uint16 private referralCode;

    constructor(address _govern, address _owner, address _manager) {
        factory = msg.sender;
        govern = _govern;
        owner = _owner;
        manager = _manager;
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    modifier onlyManager() {
        _checkManager();
        _;
    }

    function transferOwner(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    function transferManager(address newManager) external onlyOwner {
        manager = newManager;
    }

    function setReferralCode(uint16 _referralCode) external onlyManager {
        referralCode = _referralCode;
    }

    function inL2Supply(
        address l2Pool,
        address usdc,
        uint256 amount
    ) external onlyManager {
        bytes1 state = _l2Deposite(l2Pool, usdc, amount);
        require(state == 0x01, "Supply fail");
    }

    function inL2Withdraw(
        address l2Pool,
        address ausdc,
        uint256 ausdcAmount
    ) external onlyManager {
        uint256 ausdcBalance = _tokenBalance(ausdc, address(this));
        require(ausdcBalance != 0, "Zero balance");
        address l2Encode = _getL2Encode();
        bytes32 encodeMessage = IL2Encode(l2Encode).encodeWithdrawParams(
            ausdc,
            ausdcAmount
        );
        IERC20(ausdc).approve(l2Pool, ausdcAmount);
        IL2Pool(l2Pool).withdraw(encodeMessage);
    }

    function crossUSDC(
        uint32 destinationDomain,
        uint64 sendBlock,
        address usdc,
        uint256 amount
    ) public onlyManager {
        bytes32 hook = _getValidHook(destinationDomain);
        uint256 balance = _tokenBalance(usdc, address(this));
        require(balance != 0, "Zero balance");
        address crossCenter = _crossCenter();
        IERC20(usdc).approve(crossCenter, amount);
        ICrossCenter(crossCenter).crossUSDC(
            destinationDomain,
            sendBlock,
            hook,
            usdc,
            amount
        );
    }

    function receiveUSDCAndL2Supply(
        IVineStruct.ReceiveUSDCAndL2SupplyParams calldata params
    ) external onlyManager {
        address crossCenter = _crossCenter();
        ICrossCenter(crossCenter).receiveUSDC(
            params.message,
            params.attestation
        );
        uint256 balance = _tokenBalance(params.usdc, address(this));
        require(balance != 0, "Zero balance");
        bytes1 depositeState = _l2Deposite(params.l2Pool, params.usdc, balance);
        require(depositeState == 0x01, "Supply fail");
    }

    function l2WithdrawAndCrossUSDC(
        IVineStruct.L2WithdrawAndCrossUSDCParams calldata params
    ) external onlyManager {
        bytes32 hook = _getValidHook(params.destinationDomain);
        bytes1 l2withdrawState = _l2Withdraw(params.l2Pool, params.ausdc);
        require(l2withdrawState == 0x01, "Withdraw fail");
        uint256 balance = _tokenBalance(params.usdc, address(this));
        require(balance != 0, "Zero balance");
        address crossCenter = _crossCenter();
        IERC20(params.usdc).approve(crossCenter, balance);
        ICrossCenter(crossCenter).crossUSDC(
            params.destinationDomain,
            params.inputBlock,
            hook,
            params.usdc,
            balance
        );
    }

    function _l2Deposite(
        address l2Pool,
        address usdc,
        uint256 amount
    ) private returns (bytes1) {
        IERC20(usdc).approve(l2Pool, amount);
        address l2Encode = _getL2Encode();
        bytes32 encodeMessage = IL2Encode(l2Encode).encodeSupplyParams(
            usdc,
            amount,
            referralCode
        );
        IL2Pool(l2Pool).supply(encodeMessage);
        emit L2Supply(amount);
        return 0x01;
    }

    function _l2Withdraw(
        address l2Pool,
        address ausdc
    ) private returns (bytes1) {
        uint256 ausdcBalance = _tokenBalance(ausdc, address(this));
        address l2Encode = _getL2Encode();
        bytes32 encodeMessage = IL2Encode(l2Encode).encodeWithdrawParams(
            ausdc,
            ausdcBalance
        );
        IERC20(ausdc).approve(l2Pool, ausdcBalance);
        uint256 usdcAmount = IL2Pool(l2Pool).withdraw(encodeMessage);
        emit L2withdraw(usdcAmount, ausdcBalance);
        return 0x01;
    }

    function _tokenBalance(
        address token,
        address user
    ) private view returns (uint256 _thisTokenBalance) {
        _thisTokenBalance = IERC20(token).balanceOf(user);
    }

    function _checkOwner() internal view {
        require(msg.sender == owner, "Non owner");
    }

    function _checkManager() internal view {
        require(msg.sender == manager, "Non manager");
    }

    function _crossCenter() private view returns(address crossCenter){
        crossCenter = IVineHookCenter(govern).crossCenter();
    }

    function _getL2Encode()private view returns(address _l2Encode){
        _l2Encode = IVineHookCenter(govern).getL2Encode();
    }

    function _getValidHook(uint32 destinationDomain) private view returns(bytes32 validHook){
        validHook = IVineHookCenter(govern).getDestHookToUser(msg.sender, destinationDomain);
    }

    function getTokenBalance(
        address token,
        address user
    ) external view returns (uint256 _thisTokenBalance) {
        _thisTokenBalance = _tokenBalance(token, user);
    }
    
}
