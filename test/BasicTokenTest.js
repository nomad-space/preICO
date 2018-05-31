var NomadPreICO = artifacts.require("NomadPreICO");
const utils = require('../contracts/gnosis/MultiSigWallet/test/javascript/utils.js');


const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }
      resolve(res);
    })
  );

const getBalance = (account, at) => promisify(cb => web3.eth.getBalance(account, at, cb));

contract('NomadPreICO', function(accounts) {

  let instance;
  let owner = accounts[0];

  beforeEach(async () => {
    instance = await NomadPreICO.deployed();
  })

  it("check init owner", async () => {
    let result = await instance.owner()
    assert.equal(result.valueOf(), accounts[0], "owner != accounts[0]");
  });

  it("check zero init balance", async () => {
    let balance = await instance.balanceOf.call(accounts[0]);
    assert.equal(balance.valueOf(), 0, "0 wasn't in the first account");
  });

  it("check setExchangeRate ownerOnly", async () => {
    try {
      let result = await instance.setExchangeRate.call({from: accounts[1]}, 111);
      assert.equal(result.toString(), owner);
    } catch (e) {
      //console.log(`${accounts[1]} is not owner`);
    }
  });

  it("check setExchangeRate before startTime", async () => {
    await instance.setExchangeRate(111);
    let result =  await instance.ExchangeRate();    
    assert.equal(result.valueOf(), 111, "setExchangeRate don't set 111");
  });

  it("check hardMintable and softMintable", async () => {
    await instance.setExchangeRate(1);

    let hardCap =  await instance.hardCap();
    assert.equal(hardCap.valueOf(), 5000000, "hardCap != 5000000");

    let softCap =  await instance.softCap();
    assert.equal(softCap.valueOf(), 1000000, "softCap != 1000000");
  });

  it("check setExchangeRate after startTime", async () => {
      await instance.onlyTestSetTimestamp(1527811200+1);
    try {
      let result = await instance.setExchangeRate(222);
      assert(false, "setExchangeRate must don't work after startTime");
    } catch (error) {
      let e = error.toString();
      if(e.indexOf("invalid opcode") == -1 && e.indexOf("revert") == -1) assert(false, e);
    }
  });

  it("init TotalSupply is zero", async () => {
    let totalSupply_ =  await instance.totalSupply();
    assert.equal(totalSupply_.valueOf(), 0, "init totalSupply != 0");
  });

  it("price depending on the month", async () => {
    let price = 0;

    await instance.onlyTestSetTimestamp(1527811199); // 31 May 2018 г., 23:59:59
    try {
      price =  await instance.GetTokenPriceCents();
      assert(false, "Мay price difined");
    } catch (error) {
      let e = error.toString();
      if(e.indexOf("invalid opcode") == -1 && e.indexOf("revert") == -1) assert(false, e);
    }

    await instance.onlyTestSetTimestamp(1527811200); // 1 June 2018 г., 00:00:00
    price =  await instance.GetTokenPriceCents();
    assert.equal(price.valueOf(), 4, "June price not 4 cents");

    await instance.onlyTestSetTimestamp(1530403200); // 1 July 2018 г., 00:00:00
    price =  await instance.GetTokenPriceCents();
    assert.equal(price.valueOf(), 5, "July price not 5 cents");

    await instance.onlyTestSetTimestamp(1533081600); // 1 August  2018 г., 00:00:00
    price =  await instance.GetTokenPriceCents();
    assert.equal(price.valueOf(), 6, "June price not 6 cents");

    await instance.onlyTestSetTimestamp(1535760000); // 1 September  2018 г., 00:00:00
    price =  await instance.GetTokenPriceCents();
    assert.equal(price.valueOf(), 8, "June price not 8 cents");

    await instance.onlyTestSetTimestamp(1538352000); // 1 October 2018 г., 00:00:00
    try {
      price =  await instance.GetTokenPriceCents();
      assert(false, "October price difined");
    } catch (error) {
      let e = error.toString();
      if(e.indexOf("invalid opcode") == -1 && e.indexOf("revert") == -1) assert(false, e);
    }
  });

  it("Eth2preNSP check", async () => {
    let price = 0;
    await instance.onlyTestSetTimestamp(1527811199); // 31 May 2018 г., 23:59:59
    await instance.setExchangeRate(777);

    await instance.onlyTestSetTimestamp(1527811200); // 1 June 2018 г., 00:00:00
    preNSP = await instance.Eth2preNSP(1*10**18);
    assert.equal(preNSP.valueOf(), 777/0.04*10**18, "calc preNSP count error");

    await instance.onlyTestSetTimestamp(1530403200); // 1 July 2018 г., 00:00:00
    preNSP = await instance.Eth2preNSP(1*10**18);
    assert.equal(preNSP.valueOf(), 777/0.05*10**18, "calc preNSP count error");

    await instance.onlyTestSetTimestamp(1533081600); // 1 August  2018 г., 00:00:00
    preNSP = await instance.Eth2preNSP(1*10**18);
    assert.equal(preNSP.valueOf(), 777/0.06*10**18, "calc preNSP count error");

    await instance.onlyTestSetTimestamp(1535760000); // 1 September  2018 г., 00:00:00
    preNSP = await instance.Eth2preNSP(1*10**18);
    assert.equal(preNSP.valueOf(), 777/0.08*10**18, "calc preNSP count error");
  });

  it("payable check", async () => {
    let price = 0;
    await instance.onlyTestSetTimestamp(1527811199); // 31 May 2018 г., 23:59:59
    await instance.setExchangeRate(777);

    let senders = await instance.getSenders();
    assert.equal(senders.length, 0, "init senders is zero");

    try {
      await instance.sendTransaction({from: accounts[0], value: 1});
      assert(false, "payable at May");
    } catch (error) {
      let e = error.toString();
      if(e.indexOf("invalid opcode") == -1 && e.indexOf("revert") == -1) assert(false, "payable at May" + e);
    }

    senders = await instance.getSenders();
    assert.equal(senders.length, 0, "don't write senders on error");
    
  
    await instance.onlyTestSetTimestamp(1527811200); // 1 June 2018 г., 00:00:00
    await instance.sendTransaction({from: accounts[0], value: 1});

    senders               = await instance.getSenders();
    let sendersCalcTokens = await instance.getSendersCalcTokens(senders[0]);
    let sendersEth        = await instance.getSendersEth(senders[0]);

    assert.equal(senders.length, 1, "write first sender");
    assert.equal(sendersCalcTokens, 1*777/0.04, "calc tokens for first pay");
    assert.equal(sendersEth       , 1, "calc ETH for first pay");

    await instance.sendTransaction({from: accounts[0], value: 2});

    senders           = await instance.getSenders();
    sendersCalcTokens = await instance.getSendersCalcTokens(senders[0]);
    sendersEth        = await instance.getSendersEth(senders[0]);

    assert.equal(senders.length, 1, "write same sender");
    assert.equal(sendersCalcTokens, 3*777/0.04, "calc tokens for first pay");
    assert.equal(sendersEth       , 3, "calc ETH for first pay");    
//=======================
  await instance.sendTransaction({from: accounts[1], value: 4});
  await instance.sendTransaction({from: accounts[1], value: 6});

  senders           = await instance.getSenders();
  sendersCalcTokens = await instance.getSendersCalcTokens(senders[1]);
    sendersEth        = await instance.getSendersEth(senders[1]);

    assert.equal(senders.length, 2, "write same sender");
    assert.equal(sendersCalcTokens, 10*777/0.04, "calc tokens for first pay");
    assert.equal(sendersEth       , 10, "calc ETH for first pay");    
    //==================
    sendersCalcTokens = await instance.getSendersCalcTokens(senders[0]);
    sendersEth        = await instance.getSendersEth(senders[0]);

    assert.equal(sendersCalcTokens, 3*777/0.04, "calc tokens for first pay");
    assert.equal(sendersEth       , 3, "calc ETH for first pay");
    
    assert.equal( (await getBalance(instance.address)).valueOf(), 1+2+10, "balance and sendTransaction don't equal");
  });

  it("onlyWallet in setMvpExists from owner", async () => {
    assert.equal(await instance.mvpExists(), false, "init false");

    try {
      await instance.setMvpExists(true);
      assert(false, "onlyWallet not work setMvpExists");    
    } catch (error) {
      let e = error.toString();
      if(e.indexOf("invalid opcode") == -1 && e.indexOf("revert") == -1) assert(false, "payable at May" + e);
    }
  });

  it("onlyWallet in setMvpExists from multiWallet", async () => {
    assert.equal(await instance.mvpExists(), false, "init false");

    const setMvpExistsEncoded = instance.setMvpExists.request(true).params[0].data;
    //console.log(setMvpExistsEncoded);
    const transactionId = utils.getParamFromTxEvent(
      await instance.submitTransaction(instance.address, 0, setMvpExistsEncoded, {from: accounts[0]}), 
    'transactionId', null, 'Submission');

    assert.equal(await instance.mvpExists(), true, "init false");
  });

  it("set setWithdrawalAddress from not owner", async () => {
    const setWithdrawalAddressEncoded = instance.setWithdrawalAddress.request(accounts[8]).params[0].data;
    //console.log(setWithdrawalAddressEncoded);
    try{
      const transactionId = utils.getParamFromTxEvent(
        await instance.submitTransaction(instance.address, 0, setWithdrawalAddressEncoded, {from: accounts[1]}), 
      'transactionId', null, 'Submission');
      
      assert(false, "can  setWithdrawalAddress from not owner");    

    } catch (error) {
      let e = error.toString();
      if(e.indexOf("invalid opcode") == -1 && e.indexOf("revert") == -1) assert(false, " setWithdrawalAddress from not owner exception" + e);
    }
  });

  it("set setWithdrawalAddress from owner", async () => {
    const setWithdrawalAddressEncoded = instance.setWithdrawalAddress.request(accounts[9]).params[0].data;
    //console.log(setWithdrawalAddressEncoded);
    const transactionId = utils.getParamFromTxEvent(
      await instance.submitTransaction(instance.address, 0, setWithdrawalAddressEncoded, {from: accounts[0]}), 
    'transactionId', null, 'Submission');

    assert.equal(await instance.withdrawalAddress(), accounts[9], "init false");
  });

  it("check checkSoftCapOk", async () => {
    assert.equal(await instance.softCapOk(), false, "init softCapOk is true");
    await instance.checkSoftCapOk();
    assert.equal(await instance.softCapOk(), false, "checkSoftCapOk set softCapOk==true with not softCap");
    await instance.onlyTestSetTimestamp(1527811200-1);
    await instance.setExchangeRate(1);
    await instance.onlyTestSetTimestamp(1527811200+1);
    await instance.sendTransaction({from: accounts[0], value: 1000000});
    await instance.checkSoftCapOk();
    assert.equal(await instance.softCapOk(), true, "checkSoftCapOk don't set softCapOk==true with softCap");
  });

  //TODO проверить, что mvpExists не работает без голосования

  it("releaseETH from not owner", async () => {    
    try{
      const releaseETHEncoded = instance.releaseETH.request().params[0].data;
      const transactionId = utils.getParamFromTxEvent(
        await instance.submitTransaction(instance.address, 0, releaseETHEncoded, {from: accounts[9]}), 
      'transactionId', null, 'Submission');
      assert(false, "onlyWallet not work for releaseETH");    
    } catch (error) {
      let e = error.toString();
      if(e.indexOf("invalid opcode") == -1 && e.indexOf("revert") == -1) assert(false, "releaseETH " + e);
    }
  });

  it("releaseETH from owner", async () => {
    var contractBalance          = (await getBalance(  instance.address                    )).toNumber();
    //console.log("contractBalance="+contractBalance);
    var withdrawalAddressBalance = (await getBalance(  await instance.withdrawalAddress()  )).toNumber();
    //console.log("withdrawalAddressBalance="+withdrawalAddressBalance);
    
    const releaseETHEncoded = instance.releaseETH.request().params[0].data;
    //console.log(releaseETHEncoded);
    const transactionId = utils.getParamFromTxEvent(
      await instance.submitTransaction(instance.address, 0, releaseETHEncoded, {from: accounts[0]}), 
    'transactionId', null, 'Submission');

    var withdrawalAddressBalanceAfter = (await getBalance(  await instance.withdrawalAddress()  )).toNumber();
    //console.log("withdrawalAddressBalanceAfter="+withdrawalAddressBalanceAfter);

    assert.equal(contractBalance+withdrawalAddressBalance, withdrawalAddressBalanceAfter, "balance after release not rigth");
  });

  

  // перевести 1 ETH
  
});