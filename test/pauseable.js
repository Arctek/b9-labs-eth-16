'use strict';
const expectedExceptionPromise = require("../test_util/expected_exception_testRPC_and_geth.js");

var Pauseable = artifacts.require("./Pauseable.sol");

contract('Pauseable', accounts => {
    let contract;

    const owner   = accounts[0];
    const bob     = accounts[1];

    const gasToUse = 3000000;

    beforeEach(() => {
        return Pauseable.new({ from: owner }).then(instance => contract = instance);
    });

    it('should not allow non-owner to pause', () => {
        return expectedExceptionPromise(() => {
            return contract.setPaused(true, { from: bob, gas: gasToUse });
        }, gasToUse);
    });

    it('should allow owner to pause', () => {
            return contract.setPaused(true, { from: owner }
        ).then(() => {
            return contract.paused();
        })
        .then(newPaused => {
            assert.strictEqual(newPaused, true, "paused was not changed");
        })
        .catch(err => {
            assert.fail(err);
        });
    });
});