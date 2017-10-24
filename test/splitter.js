'use strict';
const expectedExceptionPromise = require("../test_util/expected_exception_testRPC_and_geth.js");

var Splitter = artifacts.require("./Splitter.sol");

contract('Splitter', accounts => {
    let contract;

    const evenContribution = 2200;
    const oddContribution  = 2201;

    const owner   = accounts[0];
    const bob     = accounts[1];
    const carol   = accounts[2];

    const gasToUse = 3000000;

    beforeEach(() => {
        return Splitter.new({ from: owner }).then(instance => contract = instance);
    });

    // Split checks
    it('should not allow split on a paused contract', () => {
            return contract.setPaused(true, { from: owner }
        )
        .then(() => {
            return expectedExceptionPromise(() => {
                return contract.split(bob, carol, { from: owner, gas: gasToUse, value: evenContribution });
            }, gasToUse);
        })
        .catch(err => {
            assert.fail(err);
        });
    });
   
    it('should not allow split on a killed contract', () => {
            return contract.kill({ from: owner }
        )
        .then(() => {
            return expectedExceptionPromise(() => {
                return contract.split(bob, carol, { from: owner, gas: gasToUse, value: evenContribution });
            }, gasToUse);
        })
        .catch(err => {
            assert.fail(err);
        });
    });

    it('should not allow receipient1 to be null', () => {
        return expectedExceptionPromise(() => {
            return contract.split(null, carol, { from: owner, gas: gasToUse, value: evenContribution });
        }, gasToUse);
    });

    it('should not allow receipient2 to be null', () => {
        return expectedExceptionPromise(() => {
            return contract.split(bob, null, { from: owner, gas: gasToUse, value: evenContribution });
        }, gasToUse);
    });

    it('should not allow receipient1 to be the same as receipient2', () => {
        return expectedExceptionPromise(() => {
            return contract.split(bob, bob, { from: owner, gas: gasToUse, value: evenContribution });
        }, gasToUse);
    });

    it('should not allow zero split amounts', () => {
        return expectedExceptionPromise(() => {
            return contract.split(bob, carol, { from: owner, gas: gasToUse, value: 0 });
        }, gasToUse);
    });

    it('should split to the two receipients', () => {
            return contract.split(bob, carol, { from: owner, value: evenContribution }
        )
        .then(() => {
            return contract.recipientBalances.call(bob);
        })
        .then(bobBalance => {
            assert.isAbove(bobBalance.toNumber(), 0, "the funds were not split")
            return contract.recipientBalances.call(carol);
        })
        .then(carolBalance => {
            assert.isAbove(carolBalance.toNumber(), 0, "the funds were not split")
        })
        .catch(err => {
            assert.fail(err);
        });
    });

    it('should send the remainder amounts to the sender', () => {
            return contract.split(bob, carol, { from: owner, value: oddContribution }
        )
        .then(() => {
            return contract.recipientBalances.call(owner);
        })
        .then(ownerBalance => {
            assert.isAbove(ownerBalance.toNumber(), 0, "the sender was not sent the remainder")
        })
        .catch(err => {
            assert.fail(err);
        });
    });


    // Withdraw checks
    it('should not allow withdraw on a paused contract', () => {
            return contract.split(bob, carol, { from: owner, value: evenContribution }
        )
        .then(success => {
            return contract.setPaused(true, { from: owner });
        })
        .then(() => {
            return expectedExceptionPromise(() => {
                return contract.withdraw(1, { from: bob, gas: gasToUse });
            }, gasToUse);
        })
        .catch(err => {
            console.log(err)
            assert.fail(err);
        });
    });

    it('should not allow withdraw on a killed contract', () => {
            return contract.split(bob, carol, { from: owner, value: evenContribution }
        )
        .then(success => {
            return contract.kill({from: owner});
        })
        .then(() => {
            return expectedExceptionPromise(() => {
                return contract.withdraw(1, { from: bob, gas: gasToUse });
            }, gasToUse);
        })
        .catch(err => {
            assert.fail(err);
        });
    });

    it('should not allow zero withdrawal', () => {
            return contract.split(bob, carol, { from: owner, value: evenContribution }
        )
        .then(() => {
            return expectedExceptionPromise(() => {
                return contract.withdraw(0, { from: bob, gas: gasToUse });
            }, gasToUse);
        })
        .catch(err => {
            assert.fail(err);
        });
    });

    it('should not allow over withdrawal', () => {
            return contract.split(bob, carol, { from: owner, value: evenContribution }
        )
        .then(() => {
            return expectedExceptionPromise(() => {
                return contract.withdraw(evenContribution, { from: bob, gas: gasToUse });
            }, gasToUse);
        })
        .catch(err => {
            assert.fail(err);
        });
    });

    it('should allow a withdrawal', () => {
            return contract.split(bob, carol, { from: owner, value: evenContribution }
        )
        .then(() => {
            return contract.recipientBalances.call(bob);
        })
        .then(bobBalance => {
            return contract.withdraw(bobBalance.toString(10), { from: bob });
        })
        .then(() => {
            return contract.recipientBalances.call(bob);
        })
        .then(bobBalance => {
            assert.strictEqual(bobBalance.toNumber(), 0, "balance should be zero")
        })
        .catch(err => {
            assert.fail(err);
        });
    });
});