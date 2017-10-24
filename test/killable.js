'use strict';
const expectedExceptionPromise = require("../test_util/expected_exception_testRPC_and_geth.js");

var Killable = artifacts.require("./Killable.sol");

contract('Killable', accounts => {
    let contract;

    const owner   = accounts[0];
    const bob     = accounts[1];

    const gasToUse = 3000000;

    beforeEach(() => {
        return Killable.new({ from: owner }).then(instance => contract = instance);
    });

    it('should not allow non-owner to kill the contract', () => {
        return expectedExceptionPromise(() => {
            return contract.kill({ from: bob, gas: gasToUse });
        }, gasToUse);
    });

    it('should allow owner to kill the contract', () => {
            return contract.kill({ from: owner }
        ).then(() => {
            return contract.killed();
        })
        .then(newKilled => {
            assert.strictEqual(newKilled, true, "the contract was not killed");
        })
        .catch(err => {
            assert.fail(err);
        });
    });

    it('should not allow the owner to emergency withdraw on a unkilled contract', () => {
        return expectedExceptionPromise(() => {
            return contract.emergencyWithdrawal({ from: owner, gas: gasToUse });
        }, gasToUse);
    });

    it('should not allow non-owner to emergency withdraw a killed contract', () => {
            return contract.kill({ from: owner }
        )
        .then(() => {
            return expectedExceptionPromise(() => {
                return contract.emergencyWithdrawal({ from: bob, gas: gasToUse });
            }, gasToUse);
        })
        .catch(err => {
            assert.fail(err);
        });
    });

    // this is failing.... but it shouldnt!!
    it('should allow owner to emergency withdraw a killed contract', () => {
            return contract.kill({ from: owner }
        )
        .then(() => {
            return contract.emergencyWithdrawal({ from: owner });
        })
        .then(() => {
            return contract.isWithdrawn();
        })
        .then(isWithdrawn => {
            assert.strictEqual(isWithdrawn, true, "the owner could not emergency withdraw");
        })
        .catch(err => {
            assert.fail(err);
        });
    });


});