// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

library VineLib {

    function _feeAmount(
        uint16 _feeRate,
        uint64 _depositeTotalAmount,
        uint256 _finallyTokenAmount
    )internal pure returns (uint256 _earnAmount){
        if(_finallyTokenAmount >= _depositeTotalAmount + 10000){
            _earnAmount = (_finallyTokenAmount - _depositeTotalAmount) * _feeRate / 10000; 
        }else{
            _earnAmount = 0;
        }
    }

    function _getUserFinallyAmount(
        uint16 _curatorFee,
        uint16 _protocolFee,
        uint64 _userSupplyAmount,
        uint64 _depositeTotalAmount,
        uint256 _userShareAmount,
        uint256 _finallyTokenAmount,
        uint256 _totalSupply
    ) internal pure returns (uint256 _finallyAmount) {
        if (_finallyTokenAmount <= _depositeTotalAmount) {
            if(_finallyTokenAmount == 0){
                _finallyAmount = 0;
            }else{
                _finallyAmount =
                (_userSupplyAmount * _finallyTokenAmount) /
                _depositeTotalAmount;
            }
        } else {
            _finallyAmount =
                _userSupplyAmount +
                (_userShareAmount * (_finallyTokenAmount - _depositeTotalAmount) * (10000 - _curatorFee - _protocolFee)) 
                / 10000 / _totalSupply;
        }
    }
}
