'use strict';
const assertInvalidOpcode = require('../test_util/assertInvalidOpcode');

var Splitter = artifacts.require("./Splitter.sol");

contract('Splitter', function(accounts) {
    var contract;

    const evenContribution = 2200;
    const oddContribution  = 2201;

    const owner   = accounts[0];
    const bob     = accounts[1];
    const carol   = accounts[2];

    beforeEach(function() {
        return Splitter.new({ from: owner }).then(instance => contract = instance);
    });

    // Split checks
    it('should not allow split on a paused contract', () => {
            return contract.setPaused(true, { from: owner }
        )
        .then( async function() {
            try {
                await contract.split(bob, carol, {from: owner, value: evenContribution});
                assert.fail('should have failed');
            } catch(error) {
                assertInvalidOpcode(error);
            }
        })
        .catch(err => {
            assert.fail(err)
        });
    });
   
    it('should not allow split on a killed contract', () => {
            return contract.kill({ from: owner }
        )
        .then( async function() {
            try {
                await contract.split(bob, carol, {from: owner, value: evenContribution});
                assert.fail('should have failed');
            } catch(error) {
                assertInvalidOpcode(error);
            }
        })
        .catch(err => {
            assert.fail(err)
        });
    });

    it('should not allow receipient1 to be null', async function() {
        try {
            await contract.split(null, carol, {from: owner, value: evenContribution});
            assert.fail('should have failed');
        } catch(error) {
            assertInvalidOpcode(error);
        }
    });

    it('should not allow receipient2 to be null', async function() {
        try {
            await contract.split(bob, null, {from: owner, value: evenContribution});
            assert.fail('should have failed');
        } catch(error) {
            assertInvalidOpcode(error);
        }
    });

    it('should not allow receipient1 to be the same as receipient2', async function() {
        try {
            await contract.split(bob, bob, {from: owner, value: evenContribution});
            assert.fail('should have failed');
        } catch(error) {
            assertInvalidOpcode(error);
        }
    });

    it('should not allow zero split amounts', async function() {
        try {
            await contract.split(bob, carol, {from: owner, value: 0});
            assert.fail('should have failed');
        } catch(error) {
            assertInvalidOpcode(error);
        }
    });

    it('should split to the two receipients', () => {
            return contract.split(bob, carol, {from: owner, value: evenContribution}
        ).then(() => {
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
            assert.fail(err)
        });
    });

    it('should send the remainder amounts to the sender', () => {
            return contract.split(bob, carol, {from: owner, value: oddContribution}
        ).then(() => {
            return contract.recipientBalances.call(owner);
        })
        .then(ownerBalance => {
            assert.isAbove(ownerBalance.toNumber(), 0, "the sender was not sent the remainder")
        })
        .catch(err => {
            assert.fail(err)
        });
    });


    // Withdraw checks
    it('should not allow withdraw on a paused contract', () => {
            return contract.split(bob, carol, {from: owner, value: evenContribution}
        ).then(success => {
            return contract.setPaused(true, {from: owner});
        })
        .then( async function() {
            try {
                await contract.withdraw(1, {from: bob});
                assert.fail('should have failed');
            } catch(error) {
                assertInvalidOpcode(error);
            }
        })
        .catch(err => {
            assert.fail(err)
        });
    });

    it('should not allow withdraw on a killed contract', () => {
            return contract.split(bob, carol, {from: owner, value: evenContribution}
        ).then(success => {
            return contract.kill({from: owner});
        })
        .then( async function() {
            try {
                await contract.withdraw(1, {from: bob});
                assert.fail('should have failed');
            } catch(error) {
                assertInvalidOpcode(error);
            }
        })
        .catch(err => {
            assert.fail(err)
        });
    });

    it('should not allow zero withdrawal', () => {
            return contract.split(bob, carol, {from: owner, value: evenContribution}
        )
        .then( async function() {
            try {
                await contract.withdraw(0, {from: bob});
                assert.fail('should have failed');
            } catch(error) {
                assertInvalidOpcode(error);
            }
        })
        .catch(err => {
            assert.fail(err)
        });
    });

    it('should not allow over withdrawal', () => {
            return contract.split(bob, carol, {from: owner, value: evenContribution}
        )
        .then( async function() {
            try {
                await contract.withdraw(evenContribution, {from: bob});
                assert.fail('should have failed');
            } catch(error) {
                assertInvalidOpcode(error);
            }
        })
        .catch(err => {
            assert.fail(err)
        });
    });

    it('should allow a withdrawal', () => {
            return contract.split(bob, carol, {from: owner, value: evenContribution}
        )
        .then(() => {
            return contract.recipientBalances.call(bob);
        })
        .then(bobBalance => {
            return contract.withdraw(bobBalance.toString(10), {from: bob});
        })
        .then(() => {
            return contract.recipientBalances.call(bob);
        })
        .then(bobBalance => {
            assert.strictEqual(bobBalance.toNumber(), 0, "balance should be zero")
        })
        .catch(err => {
            assert.fail(err)
        });
    });

    it('should not allow reentrancy from an attacker', () => {
    });
    

});