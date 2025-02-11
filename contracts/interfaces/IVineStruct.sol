// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

interface IVineStruct{
    struct UserSupplyInfo{
        uint64 supplyTime;
        uint64 pledgeAmount;
    }

    struct L2WithdrawAndCrossUSDCParams{
        uint32 destinationDomain;
        uint64 inputBlock;
        address l2Pool;
        address ausdc;
        address usdc;
    }

    struct ETHWithdrawAndCrossUSDCParams{
        uint32 destinationDomain;
        uint64 inputBlock;
        address usdcPool;
        address ausdc;
        address usdc;
    }

    
    struct ReceiveUSDCAndETHSupplyParams{
        bytes message;
        bytes attestation;
        address usdcPool;
        address usdc;
    }
    
    struct ReceiveUSDCAndL2SupplyParams{
        bytes message;
        bytes attestation;
        address usdc;
        address l2Pool;
    }


}