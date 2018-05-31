pragma solidity ^0.4.23;

import './openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import './openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol';
import './openzeppelin-solidity/contracts/ownership/Ownable.sol';
import './gnosis/MultiSigWallet/contracts/MultiSigWallet.sol';

contract NomadPreICO is
    StandardToken, 
    Ownable, 
    DetailedERC20("preNSP", "NOMAD SPACE NETWORK preICO TOKEN", 18)
    , MultiSigWallet
{
    using SafeMath for uint256;

    //TODO проверить, что не смогу записывать в данные переменные
    uint256 public StartDate     = 1527811200;       // 01 June 2018 00:00:00 UTC
    uint256 public EndDate       = 1538351999;       // 30 September 2018 г., 23:59:59
    uint256 public ExchangeRate  = 762000000000000000000; // 762*10*10^18
    uint256 public hardCap       = 5000000*ExchangeRate; // $5M
    uint256 public softCap       = 1000000*ExchangeRate; // $1M

    //TODO Check test comment
    uint256 public onlyTestTimestamp = 0;
    function onlyTestSetTimestamp(uint256 newTimestamp) public {
        onlyTestTimestamp = newTimestamp;
    }

    //TODO Check test comment
    function getTimestamp() public view returns (uint256) {
        //return block.timestamp;
        if (onlyTestTimestamp!=0) {return onlyTestTimestamp; } else {return block.timestamp;}
    }

    function setExchangeRate(uint256 newExchangeRate) 
        onlyOwner 
        public
    {
        require(getTimestamp() < StartDate);
        ExchangeRate = newExchangeRate;
        hardCap      = 5000000*ExchangeRate;
        softCap      = 1000000*ExchangeRate;
    }

    address[] senders;
    mapping(address => uint256) sendersCalcTokens;
    mapping(address => uint256) sendersEth;

    function getSenders          (               ) public view returns (address[]) {return senders                   ;}
    function getSendersCalcTokens(address _sender) public view returns (uint256 )  {return sendersCalcTokens[_sender];}
    function getSendersEth       (address _sender) public view returns (uint256)   {return sendersEth       [_sender];}

    function () payable public {
        require(msg.value > 0); 
        require(getTimestamp() >= StartDate);
        require(getTimestamp() <= EndDate);
        require(Eth2USD(address(this).balance) <= hardCap);
        
        sendersEth[msg.sender] = sendersEth[msg.sender].add(msg.value);
        sendersCalcTokens[msg.sender] = sendersCalcTokens[msg.sender].add( Eth2preNSP(msg.value) );

        for (uint i=0; i<senders.length; i++) 
            if (senders[i] == msg.sender) return;
        senders.push(msg.sender);        
    }

    bool public mvpExists = false;
    bool public softCapOk = false;

    function setMvpExists(bool _mvpExists) 
        public 
        onlyWallet 
    { mvpExists = _mvpExists; }
    
    function checkSoftCapOk() public { 
        require(!softCapOk);
        if( softCap <= Eth2USD(address(this).balance) ) softCapOk = true;
    }

    address public withdrawalAddress;
    function setWithdrawalAddress (address _withdrawalAddress) public onlyWallet { 
        withdrawalAddress = _withdrawalAddress;
    }
    
    function release() public onlyWallet {
        releaseETH();
        releaseTokens();
    }

    function releaseETH() public onlyWallet {
        if(address(this).balance > 0 && softCapOk && mvpExists)
            address(withdrawalAddress).transfer(address(this).balance);
    }

    function releaseTokens() public onlyWallet {
        if(softCapOk && mvpExists)
            for (uint i=0; i<senders.length; i++)
                releaseTokens4Sender(i);
    }

    function releaseTokens4Sender(uint senderNum) public onlyWallet {
        address sender = senders[senderNum];
        uint256 tokens = sendersCalcTokens[sender];
        if (tokens>0) {
            sendersCalcTokens[sender] = 0;
            mint(sender, tokens);
        }
    }

    function mint(address _to, uint256 _amount) internal {
        totalSupply_ = totalSupply_.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        emit Transfer(address(0), _to, _amount);
    }

    function returnEth() public onlyWallet {
        require(getTimestamp() > EndDate);
        require(!softCapOk || !mvpExists);
        
        for (uint i=0; i<senders.length; i++)
            returnEth4Sender(i);
    }

    function returnEth4Sender(uint senderNum) public onlyWallet {
        require(getTimestamp() > EndDate);
        require(!softCapOk || !mvpExists);
        
        address sender = senders[senderNum];
        sendersEth[sender] = 0;
        address(sender).transfer(sendersEth[sender]);
    }

    function GetTokenPriceCents() public view returns (uint256) {
        require(getTimestamp() >= StartDate);
        require(getTimestamp() <= EndDate);
        if( (getTimestamp() >= 1527811200)&&(getTimestamp() < 1530403200) ) return 4; // June 
        else                   
        if( (getTimestamp() >= 1530403200)&&(getTimestamp() < 1533081600) ) return 5; // July
        else
        if( (getTimestamp() >= 1533081600)&&(getTimestamp() < 1535760000) ) return 6; // August 
        else
        if( (getTimestamp() >= 1535760000)&&(getTimestamp() < 1538352000) ) return 8; // September
        else revert();
    }

    function Eth2USD(uint256 _wei) public view returns (uint256) {
        return _wei*ExchangeRate;
    }

    function Eth2preNSP(uint256 _wei) public view returns (uint256) {
        return Eth2USD(_wei)*100/GetTokenPriceCents();
    }
}