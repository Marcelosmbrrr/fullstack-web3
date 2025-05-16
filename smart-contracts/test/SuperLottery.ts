import { expect } from "chai";
import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

describe("SuperLottery", function () {
  async function deployLotteryFixture() {
    const [owner, account1, account2, account3, account4] =
      await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const lottery = await hre.viem.deployContract("SuperLottery");

    return {
      lottery,
      owner,
      account1,
      account2,
      account3,
      account4,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { lottery, owner } = await loadFixture(deployLotteryFixture);
      expect(await lottery.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should initialize with WAITING_NEW_ROUND status", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      expect(await lottery.read.round_status()).to.equal(0); // WAITING_NEW_ROUND
    });

    it("Should have correct constants", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      expect(await lottery.read.ENTRY_VALUE()).to.equal(parseEther("1"));
      expect(await lottery.read.MAX_PARTICIPANTS()).to.equal(1000n);
      expect(await lottery.read.ROUND_TIME_DURATION()).to.equal(
        24n * 60n * 60n
      );
      expect(await lottery.read.TIME_INTERVAL_BETWEEN_ROUNDS()).to.equal(
        60n * 60n
      );
    });
  });

  describe("Round Management", function () {
    it("Should allow starting a new round with correct conditions", async function () {
      const { lottery, account1 } = await loadFixture(deployLotteryFixture);

      await lottery.write.startNextRound({ account: account1.account });

      expect(await lottery.read.round_status()).to.equal(1); // RUNNING
      expect(await lottery.read.round_count()).to.equal(1n);
      expect(await lottery.read.last_round_initializer_address()).to.equal(
        getAddress(account1.account.address)
      );
    });

    it("Should prevent starting a new round too soon", async function () {
      const { lottery, account1, account2 } = await loadFixture(
        deployLotteryFixture
      );

      await lottery.write.startNextRound({ account: account1.account });

      // Try to start immediately - should fail
      await expect(
        lottery.write.startNextRound({ account: account2.account })
      ).to.be.rejectedWith("Current round not completed");
    });

    it("Should prevent same initializer in consecutive rounds", async function () {
      const { lottery, account1 } = await loadFixture(deployLotteryFixture);

      await lottery.write.startNextRound({ account: account1.account });

      // Fast forward to allow new round
      // 24h (round duration) + 1h (last and next round interval)
      await time.increase(60 * 60 * 24 + 60 * 60);

      // Try to start with same initializer - should fail
      await expect(
        lottery.write.startNextRound({ account: account1.account })
      ).to.be.rejectedWith("Cant repeat initializer");
    });
  });

  describe("Participation", function () {
    it("Should allow participation with correct ETH amount", async function () {
      const { lottery, account1, account2 } = await loadFixture(
        deployLotteryFixture
      );

      await lottery.write.startNextRound({ account: account1.account });

      await lottery.write.deposit({
        account: account2.account,
        value: parseEther("1"),
      });

      expect(await lottery.read.getCurrentRoundParticipantsCount()).to.equal(
        1n
      );
      expect(await lottery.read.round_participants([0n])).to.equal(
        getAddress(account2.account.address)
      );
    });

    it("Should prevent participation with wrong ETH amount", async function () {
      const { lottery, account1, account2 } = await loadFixture(
        deployLotteryFixture
      );

      await lottery.write.startNextRound({ account: account1.account });

      await expect(
        lottery.write.deposit({
          account: account2.account,
          value: parseEther("0.5"),
        })
      ).to.be.rejectedWith("Exactly 1 MON required");
    });

    it("Should prevent duplicate participation", async function () {
      const { lottery, account1, account2 } = await loadFixture(
        deployLotteryFixture
      );

      await lottery.write.startNextRound({ account: account1.account });

      await lottery.write.deposit({
        account: account2.account,
        value: parseEther("1"),
      });

      await expect(
        lottery.write.deposit({
          account: account2.account,
          value: parseEther("1"),
        })
      ).to.be.rejectedWith("Already participating");
    });

    it("Should emit LotteryFull when max participants reached", async function () {
      // Note: Testing with MAX_PARTICIPANTS would be expensive, consider reducing for tests
      // or using a test-specific version of the contract
    });
  });

  describe("Winner Selection", function () {
    it("Should select winner and distribute funds correctly", async function () {
      const { lottery, owner, account1, account2, account3, publicClient } =
        await loadFixture(deployLotteryFixture);

      // Start round
      await lottery.write.startNextRound({ account: account1.account });

      // Get initial balances
      const initialOwnerBalance = await publicClient.getBalance({
        address: getAddress(owner.account.address),
      });
      const initialAccount2Balance = await publicClient.getBalance({
        address: getAddress(account2.account.address),
      });

      // Participate
      // This only participant will be the winner
      await lottery.write.deposit({
        account: account2.account,
        value: parseEther("1"),
      });

      // Fast forward to end round (24h)
      await time.increase(60 * 60 * 24);

      // Select winner (account3 is the finalizer)
      const tx = await lottery.write.selectWinner({
        account: account3.account,
      });
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      // Check winner and rewards
      const winner = await lottery.read.last_round_winner();
      expect(winner).to.equal(getAddress(account2.account.address));

      // Check rewards distribution
      const finalOwnerBalance = await publicClient.getBalance({
        address: getAddress(owner.account.address),
      });
      const finalAccount2Balance = await publicClient.getBalance({
        address: getAddress(account2.account.address),
      });

      // Owner should get 1% (0.01 ETH)
      expect(finalOwnerBalance - initialOwnerBalance).to.equal(
        parseEther("0.01")
      );

      // Winner should get ~98% (0.98 ETH minus gas)
      expect(finalAccount2Balance - initialAccount2Balance).to.be.closeTo(
        parseEther("0.98"),
        parseEther("0.01")
      );

      // Refatorar: incluir verificação do prêmio para o initializer e finalizer

      // Check status changed
      expect(await lottery.read.round_status()).to.equal(0); // WAITING_NEW_ROUND
    });

    it("Should prevent selecting winner before round ends", async function () {
      const { lottery, account1, account2, account3 } = await loadFixture(
        deployLotteryFixture
      );

      await lottery.write.startNextRound({ account: account1.account });
      await lottery.write.deposit({
        account: account2.account,
        value: parseEther("1"),
      });

      await expect(
        lottery.write.selectWinner({ account: account3.account })
      ).to.be.rejectedWith("24h not passed");
    });

    it("Should prevent selecting winner with no participants", async function () {
      const { lottery, account1, account3 } = await loadFixture(
        deployLotteryFixture
      );

      await lottery.write.startNextRound({ account: account1.account });
      await time.increase(24 * 60 * 60);

      await expect(
        lottery.write.selectWinner({ account: account3.account })
      ).to.be.rejectedWith("No participants");
    });

    it("Should prevent same finalizer in consecutive rounds", async function () {
      const { lottery, owner, account1, account2, account3, publicClient } =
        await loadFixture(deployLotteryFixture);

      // First round
      await lottery.write.startNextRound({ account: account1.account });
      await lottery.write.deposit({
        account: account2.account,
        value: parseEther("1"),
      });
      await time.increase(24 * 60 * 60);
      await lottery.write.selectWinner({ account: account3.account });

      // Second round
      await time.increase(60 * 60);
      await lottery.write.startNextRound({ account: account2.account });
      await lottery.write.deposit({
        account: account1.account,
        value: parseEther("1"),
      });
      await time.increase(24 * 60 * 60);

      // Try to select with same finalizer - should fail
      await expect(
        lottery.write.selectWinner({ account: account3.account })
      ).to.be.rejectedWith("Cant repeat finalizer");
    });
  });

  describe("forceResetRound", function () {
    it("Should allow owner to reset a round with no participants after 24h", async function () {
      const { lottery, owner, account1 } = await loadFixture(
        deployLotteryFixture
      );

      await lottery.write.startNextRound({ account: account1.account });
      await time.increase(60 * 60 * 24);

      // Directly call forceResetRound without trying to selectWinner first
      await lottery.write.forceResetRound({ account: owner.account });

      expect(await lottery.read.round_status()).to.equal(0);
    });

    it("Should prevent non-owners from resetting", async function () {
      const { lottery, account1, account2 } = await loadFixture(
        deployLotteryFixture
      );

      await lottery.write.startNextRound({ account: account1.account });
      await time.increase(60 * 60 * 24);

      await expect(
        lottery.write.forceResetRound({ account: account2.account })
      ).to.be.rejectedWith("Only owner");
    });

    it("Should prevent reset when participants exist", async function () {
      const { lottery, owner, account1, account2 } = await loadFixture(
        deployLotteryFixture
      );

      await lottery.write.startNextRound({ account: account1.account });
      await lottery.write.deposit({
        account: account2.account,
        value: parseEther("1"),
      });
      await time.increase(60 * 60 * 24);

      await expect(
        lottery.write.forceResetRound({ account: owner.account })
      ).to.be.rejectedWith("Participants exist");
    });

    it("Should prevent reset before 24h", async function () {
      const { lottery, owner, account1 } = await loadFixture(
        deployLotteryFixture
      );

      await lottery.write.startNextRound({ account: account1.account });
      await time.increase(60 * 60 * 12); // 12h

      await expect(
        lottery.write.forceResetRound({ account: owner.account })
      ).to.be.rejectedWith("24h not passed");
    });

    it("Should emit RoundForceReset event", async function () {
      const { lottery, owner, account1, publicClient } = await loadFixture(
        deployLotteryFixture
      );

      await lottery.write.startNextRound({ account: account1.account });
      await time.increase(60 * 60 * 24);

      const tx = await lottery.write.forceResetRound({
        account: owner.account,
      });
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      // Verifica o evento
      const events = await lottery.getEvents.RoundForceReset();
      expect(events).to.have.lengthOf(1);
      expect(events[0].args.round).to.equal(1n);
      expect(events[0].args.resetBy).to.equal(
        getAddress(owner.account.address)
      );
    });
  });

  describe("View Functions", function () {
    it("Should return correct time left for round", async function () {
      const { lottery, account1 } = await loadFixture(deployLotteryFixture);

      await lottery.write.startNextRound({ account: account1.account });

      const timeLeft = await lottery.read.getTimeLeftToCloseCurrentRound();
      expect(timeLeft).to.be.closeTo(24 * 60 * 60, 5); // ~24 hours
    });

    it("Should return correct time left for new round", async function () {
      const { lottery, account1, account2, publicClient } = await loadFixture(
        deployLotteryFixture
      );

      await lottery.write.startNextRound({ account: account1.account });
      await lottery.write.deposit({
        account: account2.account,
        value: parseEther("1"),
      });
      await time.increase(24 * 60 * 60);
      await lottery.write.selectWinner({ account: account1.account });

      const timeLeft = await lottery.read.getTimeLeftToAllowNewRound();
      expect(timeLeft).to.be.closeTo(60 * 60, 5); // ~1 hour
    });

    it("Should return correct round status", async function () {
      const { lottery, account1 } = await loadFixture(deployLotteryFixture);

      expect(await lottery.read.getIsRoundRunning()).to.be.false;

      await lottery.write.startNextRound({ account: account1.account });
      expect(await lottery.read.getIsRoundRunning()).to.be.true;
    });
  });
});
