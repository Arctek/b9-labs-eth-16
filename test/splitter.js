'use strict';

const Splitter = artifacts.require("./Splitter.sol");

import { default as Promise } from 'bluebird';

if (typeof web3.eth.getBlockPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

web3.eth.getTransactionReceiptMined = require("../test_util/getTransactionReceiptMined.js");
web3.eth.expectedPayableExceptionPromise = require("../test_util/expectedPayableExceptionPromise.js");
web3.eth.expectedExceptionPromise = require("../test_util/expectedExceptionPromise.js");
web3.eth.makeSureAreUnlocked = require("../test_util/makeSureAreUnlocked.js");
web3.eth.makeSureHasAtLeast = require("../test_util/makeSureHasAtLeast.js");

contract('Splitter', accounts => {
    const gasToUse = 3000000;

    const evenContribution = (Math.floor(Math.random() * 100000) + 1) * 2;
    const oddContribution  = evenContribution + 1;

    let owner, bob, carol;

    before("should prepare accounts", function() {
        assert.isAtLeast(accounts.length, 3, "should have at least 3 accounts");
        owner = accounts[0];
        bob   = accounts[1];
        carol = accounts[2];

        return web3.eth.makeSureAreUnlocked([owner, bob, carol])
            .then(() => web3.eth.makeSureHasAtLeast(owner, [bob, carol], evenContribution * 10))
            .then(txObject => web3.eth.getTransactionReceiptMined(txObject));
    });
    
    beforeEach(() => {
        return Splitter.new({ from: owner }).then(instance => contract = instance);
    });

    // Split checks
    it('should not allow split on a paused contract', () => {
            return contract.setPaused(true, { from: owner }
        )
        .then(() => {
            return web3.eth.expectedExceptionPromise(() => {
                return contract.split(bob, carol, { from: owner, gas: gasToUse, value: evenContribution });
            }, gasToUse);
        });
    });
   
    it('should not allow split on a killed contract', () => {
            return contract.setPaused(true, { from: owner }
        )
        .then(() => {
            return contract.kill({ from: owner });
        })
        .then(() => {
            return web3.eth.expectedExceptionPromise(() => {
                return contract.split(bob, carol, { from: owner, gas: gasToUse, value: evenContribution });
            }, gasToUse);
        });
    });

    it('should not allow recipient1 to be null', () => {
        return web3.eth.expectedExceptionPromise(() => {
            return contract.split(null, carol, { from: owner, gas: gasToUse, value: evenContribution });
        }, gasToUse);
    });

    it('should not allow recipient2 to be null', () => {
        return web3.eth.expectedExceptionPromise(() => {
            return contract.split(bob, null, { from: owner, gas: gasToUse, value: evenContribution });
        }, gasToUse);
    });

    it('should not allow recipient1 to be the same as recipient2', () => {
        return web3.eth.expectedExceptionPromise(() => {
            return contract.split(bob, bob, { from: owner, gas: gasToUse, value: evenContribution });
        }, gasToUse);
    });

    it('should not allow zero split amounts', () => {
        return web3.eth.expectedExceptionPromise(() => {
            return contract.split(bob, carol, { from: owner, gas: gasToUse, value: 0 });
        }, gasToUse);
    });

    it('should split to the two recipients', () => {
            return contract.split(bob, carol, { from: owner, value: evenContribution }
        )
        .then(txObject => {
            asertEventLogSplit(txObject, owner, bob, carol);

            return contract.recipientBalances.call(bob);
        })
        .then(bobBalance => {
            assert.strictEqual(bobBalance.toNumber(), evenContribution / 2, "the funds were not split for bob")
            return contract.recipientBalances.call(carol);
        })
        .then(carolBalance => {
            assert.strictEqual(carolBalance.toNumber(), evenContribution / 2, "the funds were not split for carol")
        });
    });

    it('should attribute the remainder amount to the sender', () => {
            let quotientContribution = oddContribution - 1;

            return contract.split(bob, carol, { from: owner, value: oddContribution }
        )
        .then(txObject => {
            asertEventLogSplit(txObject, owner, bob, carol);

            return contract.recipientBalances.call(owner);
        })
        .then(ownerBalance => {
            assert.strictEqual(ownerBalance.toNumber(), 1, "the sender was not attributed the remainder")
        })
        .then(() => {
            return contract.recipientBalances.call(bob);
        })
        .then(bobBalance => {
            assert.strictEqual(bobBalance.toNumber(), quotientContribution / 2, "the funds were not split for bob")
        })
        .then(() => {
            return contract.recipientBalances.call(carol);
        })
        .then(carolBalance => {
            assert.strictEqual(carolBalance.toNumber(), quotientContribution / 2, "the funds were not split for carol")
        });
    });


    // Withdraw checks upon having split
    describe("Receipients have a split balance", () => {
        beforeEach(() => {
            return contract.split(bob, carol, { from: owner, value: evenContribution })
                .then(txObject => { asertEventLogSplit(txObject, owner, bob, carol); });
        });

        it('should not allow withdraw on a paused contract', () => {
                return contract.setPaused(true, { from: owner }
            )
            .then(() => {
                return web3.eth.expectedExceptionPromise(() => {
                    return contract.withdraw({ from: bob, gas: gasToUse });
                }, gasToUse);
            });
        });

        it('should not allow withdraw on a killed contract', () => {
                return contract.setPaused(true, { from: owner }
            )
            .then(() => {
                return contract.kill({ from: owner });
            })
            .then(() => {
                return web3.eth.expectedExceptionPromise(() => {
                    return contract.withdraw({ from: bob, gas: gasToUse });
                }, gasToUse);
            });
        });

        it('should allow a withdrawal', () => {
                let bobContractBalance;
                let bobAccountBalance;
                let gasCost;
                let gasUsed;

                return web3.eth.getBalancePromise(bob)
            .then(accountBalance => {
                bobAccountBalance = accountBalance;

                return contract.recipientBalances.call(bob);
            })
            .then(contractBalance => {
                bobContractBalance = contractBalance;
                return contract.withdraw({ from: bob });
            })
            .then(txObject => {
                asertEventLogWithdraw(txObject, bob, bobContractBalance);

                gasUsed = txObject.receipt.gasUsed;

                return web3.eth.getTransaction(txObject.tx)
            })
            .then(tx => {
                gasCost = tx.gasPrice.times(gasUsed);

                return web3.eth.getBalancePromise(bob);
            })
            .then(accountBalance => {
                let expectedAccountBalance = bobAccountBalance.plus(bobContractBalance).minus(gasCost);

                assert.strictEqual(expectedAccountBalance.equals(accountBalance), true, "the withdrawn amount was incorrect");

                return contract.recipientBalances.call(bob);
            })
            .then(contractBalance => {
                assert.strictEqual(contractBalance.toNumber(), 0, "contract balance should be zero");                
            });
        });

        it('should not allow a double withdrawal', () => {
                let bobContractBalance;

                return contract.recipientBalances.call(bob)
            .then(contractBalance => {
                bobContractBalance = contractBalance;
                return contract.withdraw({ from: bob });
            })
            .then(txObject => {
                asertEventLogWithdraw(txObject, bob, bobContractBalance);

                return contract.recipientBalances.call(bob);
            })
            .then(() => {
                return web3.eth.expectedExceptionPromise(() => {
                    return contract.withdraw({ from: bob, gas: gasToUse });
                }, gasToUse);
            })

        });
    });
});

function asertEventLogSplit(txObject, sender, recipient1, recipient2) {
    assert.equal(txObject.logs.length, 1, "should have received 1 event");

    assert.strictEqual(
        txObject.logs[0].args.sender,
        sender,
        "should be sender");
    assert.strictEqual(
        txObject.logs[0].args.recipient1,
        recipient1,
        "should be recipient1");
    assert.strictEqual(
        txObject.logs[0].args.recipient2,
        recipient2,
        "should be recipient2");
    
    assert.equal(txObject.receipt.logs[0].topics.length, 4, "should have 4 topics");
}

function asertEventLogWithdraw(txObject, recipient, withdrawAmount) {
    assert.equal(txObject.logs.length, 1, "should have received 1 event");

    assert.strictEqual(
        txObject.logs[0].args.recipient,
        recipient,
        "should be recipient");
    assert.strictEqual(
        txObject.logs[0].args.withdrawAmount.toString(10),
        withdrawAmount.toString(10),
        "should be expected withdraw amount");
    
    assert.equal(txObject.receipt.logs[0].topics.length, 2, "should have 2 topics");
}