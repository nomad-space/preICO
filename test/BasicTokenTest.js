var NomadPreICO = artifacts.require("NomadPreICO");

contract('NomadPreICO', function(accounts) {
  it("check zero init balance", function() {
    return NomadPreICO.deployed().then(function(instance) {
      return instance.balanceOf.call(accounts[0]);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), 0, "0 wasn't in the first account");
    });
  });

    it("check setExchangeRate", function() {
      return NomadPreICO.deployed().then(function(instance) {
        return instance.setExchangeRate.call(111);
      }).then(function(result) {
        assert.equal(instance.valueOf(), 111, "0 wasn't in the first account");
      });
    });
  });