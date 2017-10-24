'use strict';
const expectedExceptionPromise = require("../test_util/expected_exception_testRPC_and_geth.js");

var Ownable = artifacts.require("./Ownable.sol");

contract('Ownable', accounts => {
    let contract;

    const owner   = accounts[0];
    const bob     = accounts[1];

    const gasToUse = 3000000;

    beforeEach(() => {
        return Ownable.new({ from: owner }).then(instance => contract = instance);
    });

    it('should not allow non-owner to set owner', () => {
        return expectedExceptionPromise(() => {
            return contract.setOwner(bob, { from: bob, gas: gasToUse });
        }, gasToUse);
    });


    it('should allow owner to set owner', () => {
        return contract.setOwner(bob, { from: owner }
        ).then(() => {
            return contract.owner();
        })
        .then(newOwner => {
            assert.strictEqual(newOwner, bob, "the owner was not changed")
        })
        .catch(err => {
            assert.fail(err)
        });
    });

});