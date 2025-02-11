// SPDX-License-Identifier: GPL-3
pragma solidity ^0.8.23;

interface IVineHookCenter {
    error InvalidHook();

    event UpdateOwner(address indexed oldOwner, address indexed newOwner);
    event UpdateManager(address indexed oldManager, address indexed newManager);

    event CreateID(uint256 indexed id, address creator);
    event ExamineID(uint256 indexed id, bool state);
    
    event Initialize(address indexed curator, address indexed coreLendMarket);

    struct MarketInfo{
        bool validState;
        address hook;
        address crossCenter;
        address curator;
    }

    function examine(uint256 id, bool state) external;

    function initialize(address hook) external;

    function ID() external view returns (uint256);

    function protocolFee() external view returns (uint16);

    function owner() external view returns (address);

    function manager() external view returns (address);

    function crossCenter() external view returns (address);

    function ValidToken(address) external view returns (bytes1);

    function RegisterState(address) external view returns (bytes1);

    function IdToValidHooks(uint256, uint32) external view returns(bytes32);

    function getL2Encode() external view returns(address);

    function getMarketInfo(uint256 id) external view returns (MarketInfo memory);

    function getCuratorToId(address curator) external view returns (uint256);

    function getDestHookToUser(address user, uint32 destinationDomain) external view returns(bytes32 hook);

    function getBlacklist(bytes32 hook)external view returns(bytes1 state);
    
    function getIdToAllValidHooks(uint256 id)external view returns(bytes32[] memory);
}
