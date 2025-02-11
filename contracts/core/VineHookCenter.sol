// SPDX-License-Identifier: GPL-3
pragma solidity ^0.8.23;

import {IVineHookCenter} from "../interfaces/core/IVineHookCenter.sol";

contract VineHookCenter is IVineHookCenter {
    uint256 public ID;

    bytes1 private immutable ZEROBYTES1;
    bytes32 private immutable ZEROBYTES32;
    uint16 public protocolFee = 1000; ///  fee rate = protocolFee / 10000
    address public owner;
    address public manager;
    address public Caller;
    address public protocolFeeReceiver;
    address public crossCenter;
    address private l2Encode;

    constructor(address _owner, address _manager, address _caller)
    {
        owner = _owner;
        manager = _manager;
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
    
    function examine(uint256 id, bool state) external onlyCaller {
        IdToMarketInfo[id].validState = state;
        emit ExamineID(id, state);
    }

    //Register and get vetted to become a curator
    function register() external {
        address currentUser = msg.sender; 
        require(RegisterState[currentUser] == ZEROBYTES1, "Already register");
        require(crossCenter != address(0), "CrossCenter zero address");
        IdToMarketInfo[ID] = MarketInfo({
            validState: true,
            hook: address(0),
            crossCenter: crossCenter,
            curator: currentUser
        });
        CuratorToId[currentUser] = ID;
        RegisterState[currentUser] = 0x01;
        ID++;
        emit CreateID(ID, currentUser);
    }

    function initialize(address hook) external{
        uint256 id = CuratorToId[msg.sender];
        require(IdToMarketInfo[id].validState, "Invalid id");
        require(InitializeState[id] == ZEROBYTES1, "Already initialize");
        IdToMarketInfo[id].hook = hook;
        InitializeState[id] = 0x01;
        emit Initialize(msg.sender, hook);
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
