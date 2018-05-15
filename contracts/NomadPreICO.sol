pragma solidity ^0.4.23;

import './openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import './openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol';
import './openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract NomadPreICO is 
    StandardToken, 
    Ownable, 
    DetailedERC20("preNSP", "Nomad Space preICO token", 18)
{
    using SafeMath for uint256;

    //TODO проверить, что не смогу записывать в данные переменные
    uint256 public StartDate     = 1527811200;       // 01 July 2018 00:00:00 UTC
    uint256 public EndDate       = 1538351999;       // 30 September 2018 г., 23:59:59
    uint256 public ExchangeRate  = 762000000000000000000; // 762*10^18
    uint256 public maxMintable   = 5000000*ExchangeRate; // $5M
    uint256 public softMintable  = 1000000*ExchangeRate; // $1M

    uint256 public onlyTestTimestamp = 0;
    function onlyTestSetTimestamp(uint256 newTimestamp) public {
        onlyTestTimestamp = newTimestamp;
    }

    function getTimestamp() public view returns (uint256) {
        //return block.timestamp;
        if (onlyTestTimestamp!=0) {return onlyTestTimestamp; } else {return onlyTestTimestamp;}
    }

    // TODO test
    function setExchangeRate(uint256 newExchangeRate) onlyOwner public {
        require(getTimestamp() < StartDate);
        ExchangeRate = newExchangeRate;
        maxMintable  = 5000000*ExchangeRate;
        softMintable = 1000000*ExchangeRate;
    }

    //выводить можно начиная с soft
    //начислить токены для preSaleAbab и бонусы
    
    function () payable public {
        require(msg.value>0);
        require(getTimestamp() > StartDate);
        require(getTimestamp() < EndDate);
        uint256 amount = msg.value * ExchangeRate;
        uint256 totalSupply_ = totalSupply_ + amount;
        require(totalSupply_ <= maxMintable);
    
        totalSupply_ = totalSupply_.add(amount);
        balances[msg.sender] = balances[msg.sender].add(amount);
        emit Transfer(address(0), msg.sender, amount);
        address(owner).transfer(msg.value);
    }
}