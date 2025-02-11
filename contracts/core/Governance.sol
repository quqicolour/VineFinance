// SPDX-License-Identifier: GPL-3
pragma solidity ^0.8.23;

import {IGovernance} from "../interfaces/core/IGovernance.sol";
import {IERC20} from "../interfaces/IERC20.sol";

contract Governance is IGovernance {

    uint256 public ID;

    bytes1 private immutable ZEROBYTES1;
    bytes32 private immutable ZEROBYTES32;
    uint16 public protocolFee = 1000; ///  fee rate = protocolFee / 10000
    address public owner;
    address public manager;
    address public feeManager;
    address public Caller;
    address public protocolFeeReceiver;
    address public crossCenter;
    address private l2Encode;

    constructor(address _owner, address _manager, address _feeManager, address _caller)
    {
        owner = _owner;
        manager = _manager;
        feeManager = _feeManager;
        Caller = _caller;
    }

    mapping(address => bytes1) public ValidToken;
    mapping(bytes32 => bytes1) private Blacklist;
    
    mapping(uint256 => MarketInfo) private IdToMarketInfo;
    mapping(address => uint256) private CuratorToId;
    mapping(address => bytes1) public RegisterState;
    mapping(uint256 => bytes1) public InitializeState;

    mapping(uint256 => mapping(uint32 => bytes32)) public IdToValidHooks;
    mapping(uint256 => bytes32[]) private IdToAllValidHooks;

    modifier onlyOwner() {
        require(msg.sender == owner, "Non owner");
        _;
    }

    modifier onlyManager() {
        require(msg.sender == manager, "Non manager");
        _;
    }

    modifier onlyCaller() {
        require(msg.sender == Caller);
        _;
    }

    function changeOwner(address _newOwner) external onlyOwner {
        address oldOwner = owner;
        owner = _newOwner;
        emit UpdateOwner(oldOwner, _newOwner);
    }

    function changeManager(address _newManager) external onlyOwner {
        address oldManager = manager;
        manager = _newManager;
        emit UpdateManager(oldManager, _newManager);
    }
    
    function changeCaller(address _newCaller) external onlyCaller {
        Caller = _newCaller;
    }

    function changeFeeManager(address _newFeeManager) external onlyOwner {
        address oldFeeManager = feeManager;
        feeManager = _newFeeManager;
        emit UpdateFeeManager(oldFeeManager, _newFeeManager);
    }

    function changeProtocolFeeReceiver(
        address _newProtocolFeeReceiver
    ) external onlyOwner {
        address oldProtocolFeeReceiver = protocolFeeReceiver;
        protocolFeeReceiver = _newProtocolFeeReceiver;
        emit UpdateProtocolFeeReceiver(
            oldProtocolFeeReceiver,
            _newProtocolFeeReceiver
        );
    }

    function changeProtocolFee(uint16 _newProtocolFee) external onlyOwner {
        require(_newProtocolFee <= 5000);
        uint16 oldProtocolFee = protocolFee;
        protocolFee = _newProtocolFee;
        emit UpdateProtocolFee(oldProtocolFee, _newProtocolFee);
    }

    function changeCrossCenter(address _crossCenter) external onlyManager{
        crossCenter = _crossCenter;
    }

    function changeL2Encode(address _l2Encode) external onlyManager{
        l2Encode = _l2Encode;
    }

    function batchSetValidTokens(
        address[] calldata tokens,
        bytes1[] calldata states
    ) external onlyManager {
        unchecked{
            for (uint256 i; i < tokens.length; i++) {
                ValidToken[tokens[i]] = states[i];
            }
        }
    }

    function batchSetBlacklists(
        bytes32[] calldata hooks,
        bytes1[] calldata states
    ) external onlyManager {
        unchecked {
            for(uint256 i; i< hooks.length; i++){
                Blacklist[hooks[i]] = states[i];
            }
        }
    }
    
    function batchSetValidHooks(
        uint32 destinationDomain,
        bytes32[] calldata hooks
    ) external {
        address currentUser = msg.sender;
        uint256 id = CuratorToId[currentUser];
        require(currentUser == IdToMarketInfo[id].curator, "Not a curator");
        unchecked{
            for (uint256 i; i < hooks.length; i++) {
                IdToValidHooks[id][destinationDomain] = hooks[i];
                IdToAllValidHooks[id].push(hooks[i]);
            }
        }
    }

    function skim(address token) external onlyManager{
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance>0, "Zero");
        IERC20(token).transfer(protocolFeeReceiver, balance);
    }
    
    function examine(uint256 id, bool state) external onlyCaller {
        IdToMarketInfo[id].validState = state;
        emit ExamineID(id, state);
    }

    //Register and get vetted to become a curator
    function register(uint16 _feeRate, uint64 _bufferTime, uint64 _endTime, address _feeReceiver) external {
        address currentUser = msg.sender; 
        require(RegisterState[currentUser] == ZEROBYTES1, "Already register");
        require(_feeReceiver != address(0), "Invalid feeReceiver");
        require(_feeRate <= 5000,"Fee rate > 5000");
        require(crossCenter != address(0), "CrossCenter zero address");
        uint64 currentTime = uint64(block.timestamp);
        uint64 bufferTime =  _bufferTime + currentTime;
        uint64 endTime = _endTime + currentTime;
        uint64 bufferLimit = bufferTime + 1 days;
        require(_bufferTime > 3600 && endTime >= bufferLimit, "Invalid time"); 
        address _protocolFeeReceiver;
        if(protocolFeeReceiver == address(0)){
            _protocolFeeReceiver = address(this);
        }else{
            _protocolFeeReceiver = protocolFeeReceiver;
        }
        IdToMarketInfo[ID] = MarketInfo({
            validState: true,
            curatorFee: _feeRate,
            protocolFee: protocolFee,
            bufferTime: bufferTime,
            endTime: endTime,
            coreLendMarket: address(0),
            crossCenter: crossCenter,
            feeReceiver: _feeReceiver,
            protocolFeeReceiver: _protocolFeeReceiver,
            curator: currentUser
        });
        CuratorToId[currentUser] = ID;
        RegisterState[currentUser] = 0x01;
        ID++;
        emit CreateID(ID, currentUser);
    }

    function initialize(address coreLendMarket) external{
        uint256 id = CuratorToId[msg.sender];
        require(IdToMarketInfo[id].validState, "Invalid id");
        require(InitializeState[id] == ZEROBYTES1, "Already initialize");
        IdToMarketInfo[id].coreLendMarket = coreLendMarket;
        InitializeState[id] = 0x01;
        emit Initialize(msg.sender, coreLendMarket);
    }

    function getDestHookToUser(address user, uint32 destinationDomain) external view returns(bytes32 hook){
        uint256 id = CuratorToId[user];
        require(IdToMarketInfo[id].validState, "Invalid id");
        bytes32 thisHook = IdToValidHooks[id][destinationDomain];
        if(thisHook == ZEROBYTES32){
            revert InvalidHook();
        }else{
            hook = thisHook;
        }
    }

    function curatorChangeFeeReceiver(address _feeReceiver) external {
        uint256 id = CuratorToId[msg.sender];
        require(IdToMarketInfo[id].validState);
        require(IdToMarketInfo[id].feeReceiver != address(0), "Invalid feeReceiver");
        IdToMarketInfo[id].feeReceiver = _feeReceiver;
    }

    function getCuratorToId(address curator) public view returns (uint256) {
        uint256 id = CuratorToId[curator];
        require(IdToMarketInfo[id].validState, "Invalid id");
        return id;
    }

    function getBlacklist(bytes32 hook)external view returns(bytes1 state){
        state = Blacklist[hook];
    }

    function getL2Encode() external view returns(address){
        require(l2Encode != address(0), "Zero address");
        return l2Encode;
    }

    function getMarketInfo(
        uint256 id
    ) external view returns (MarketInfo memory) {
        return IdToMarketInfo[id];
    }

    function getIdToAllValidHooks(uint256 id)external view returns(bytes32[] memory){
        return IdToAllValidHooks[id];
    }
    
}
