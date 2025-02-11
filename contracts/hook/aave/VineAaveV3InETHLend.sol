// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;
import {IPool} from "../../interfaces/aaveV3/IPool.sol";
import {ITokenMessenger} from "../../interfaces/cctp/ITokenMessenger.sol";
import {IVineStruct} from "../../interfaces/IVineStruct.sol";
import {IVineEvent} from "../../interfaces/IVineEvent.sol";
import {IVineErrors} from "../../interfaces/IVineErrors.sol";
import {ICrossCenter} from "../../interfaces/ICrossCenter.sol";
import {ISharer} from "../../interfaces/ISharer.sol";
import {IVineHookCenter} from "../../interfaces/core/IVineHookCenter.sol";

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract VineAaveV3InETHLend is
    ReentrancyGuard,
    IVineStruct,
    IVineEvent,
    IVineErrors,
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

    function transferManager(address newManager)external onlyOwner{
        manager = newManager;
    }


    function setReferralCode(uint16 _referralCode) external onlyManager{
        referralCode = _referralCode;
    }

    function inEthSupply(
        address usdcPool,
        address usdc,
        uint256 amount
    ) public onlyManager {
        bytes1 state = _aaveSupply(usdcPool, usdc, amount);
        if(state != 0x01){
            revert SupplyFail(ErrorType.SupplyFail);
        }
    }

    function inEthWithdraw(
        address usdcPool,
        address ausdc,
        address usdc,
        uint256 amount
    ) external onlyManager {
        uint256 ausdcBalance=_tokenBalance(ausdc, address(this));
        uint256 withdrawAmount=amount>ausdcBalance?ausdcBalance:amount;
        bytes1 state = _aaveWithdraw(usdcPool, ausdc, usdc, withdrawAmount);
        if(state != 0x01){
            revert WithdrawFail(ErrorType.WithdrawFail);
        }
    }

    function crossUSDC(
        uint32 destinationDomain,
        uint64 sendBlock,
        address usdc,
        uint256 amount
    ) public onlyManager {
        bytes32 hook = _getValidHook(destinationDomain);
        address crossCenter = _crossCenter();
        IERC20(usdc).approve(crossCenter, amount);
        ICrossCenter(crossCenter).crossUSDC(destinationDomain, sendBlock, hook, usdc, amount);
    }

    function receiveUSDCAndETHSupply(
        IVineStruct.ReceiveUSDCAndETHSupplyParams calldata params
    ) external onlyManager {
        address crossCenter = _crossCenter();
        ICrossCenter(crossCenter).receiveUSDC(params.message, params.attestation);
        uint256 balance = _tokenBalance(params.usdc, address(this));
        if(balance == 0){
            revert ZeroBalance(ErrorType.ZeroBalance);
        }
        bytes1 supplyState = _aaveSupply(params.usdcPool, params.usdc, balance);
        if(supplyState != 0x01){
            revert SupplyFail(ErrorType.SupplyFail);
        }
    }

    function ethWithdrawAndCrossUSDC(
        IVineStruct.ETHWithdrawAndCrossUSDCParams calldata params
    ) external onlyManager {
        bytes32 hook = _getValidHook(params.destinationDomain);
        uint256 ausdcBalance=_tokenBalance(params.ausdc, address(this));
        bytes1 withdrawState = _aaveWithdraw(
            params.usdcPool,
            params.ausdc,
            params.usdc,
            ausdcBalance
        );
        if(withdrawState != 0x01){
            revert WithdrawFail(ErrorType.WithdrawFail);
        }
        uint256 balance = _tokenBalance(params.usdc, address(this));
        if (balance == 0) {
            revert ZeroBalance(ErrorType.ZeroBalance);
        }
        address crossCenter = _crossCenter();
        IERC20(params.usdc).approve(crossCenter, balance);
        ICrossCenter(crossCenter).crossUSDC(params.destinationDomain, params.inputBlock, hook, params.usdc, balance);
    }

    function _aaveSupply(
        address usdcPool,
        address usdc,
        uint256 amount
    ) private returns (bytes1 state) {
        IERC20(usdc).approve(usdcPool, amount);
        IPool(usdcPool).supply(usdc, amount, address(this), referralCode);
        state = 0x01;
    }

    function _aaveWithdraw(
        address usdcPool,
        address ausdc,
        address usdc,
        uint256 amount
    ) private returns (bytes1 state) {
        IERC20(ausdc).approve(usdcPool, amount);
        IPool(usdcPool).withdraw(usdc, amount, address(this));
        state = 0x01;
    }

    function _getValidHook(uint32 destinationDomain) private view returns(bytes32 validHook){
        validHook = IVineHookCenter(govern).getDestHookToUser(msg.sender, destinationDomain);
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

    function getTokenBalance(
        address token,
        address user
    ) external view returns (uint256 _thisTokenBalance) {
        _thisTokenBalance = _tokenBalance(token, user);
    }

}
