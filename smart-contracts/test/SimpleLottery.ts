import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

describe("SimpleLottery", function () {
  /**
   * Deploys the SimpleLottery contract with some initial setup
   * @returns {Object} Object containing the deployed contract, accounts and necessary clients
   */
  async function deploySimpleLotteryFixture() {
    const [owner, participant1, participant2, participant3] =
      await hre.viem.getWalletClients();

    const contractInstance = await hre.viem.deployContract("SimpleLottery");

    const publicClient = await hre.viem.getPublicClient();

    return {
      contractInstance,
      owner,
      participant1,
      participant2,
      participant3,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { contractInstance, owner } = await loadFixture(
        deploySimpleLotteryFixture
      );

      expect(await contractInstance.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should start with zero balance", async function () {
      const { contractInstance, publicClient } = await loadFixture(
        deploySimpleLotteryFixture
      );

      expect(
        await publicClient.getBalance({
          address: contractInstance.address,
        })
      ).to.equal(0n);

      expect(await contractInstance.read.getLotteryBalance()).to.equal(0n);
    });
  });

  describe("Deposits", function () {
    it("Should accept exactly 1 ether deposits", async function () {
      const { contractInstance, participant1, publicClient } =
        await loadFixture(deploySimpleLotteryFixture);

      const lotteryAsParticipant = await hre.viem.getContractAt(
        "SimpleLottery",
        contractInstance.address,
        { client: { wallet: participant1 } }
      );

      const depositAmount = parseEther("1");
      const hash = await lotteryAsParticipant.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Check contract balance
      expect(await contractInstance.read.getLotteryBalance()).to.equal(
        depositAmount
      );

      // Check participant was added
      const participants = await contractInstance.read.participants([0]);
      expect(participants).to.equal(getAddress(participant1.account.address));
    });

    it("Should reject deposits that are not exactly 1 ether", async function () {
      const { contractInstance, participant1 } = await loadFixture(
        deploySimpleLotteryFixture
      );

      const lotteryAsParticipant = await hre.viem.getContractAt(
        "SimpleLottery",
        contractInstance.address,
        { client: { wallet: participant1 } }
      );

      // Test with less than 1 ether
      await expect(
        lotteryAsParticipant.write.deposit({ value: parseEther("0.5") })
      ).to.be.rejectedWith("Deposit must be exactly 1 ether");

      // Test with more than 1 ether
      await expect(
        lotteryAsParticipant.write.deposit({ value: parseEther("1.5") })
      ).to.be.rejectedWith("Deposit must be exactly 1 ether");
    });

    it("Should allow multiple participants to deposit", async function () {
      const {
        contractInstance,
        participant1,
        participant2,
        participant3,
        publicClient,
      } = await loadFixture(deploySimpleLotteryFixture);

      const depositAmount = parseEther("1");

      // Participant 1 deposits
      const lotteryAsParticipant1 = await hre.viem.getContractAt(
        "SimpleLottery",
        contractInstance.address,
        { client: { wallet: participant1 } }
      );
      const hash1 = await lotteryAsParticipant1.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      // Participant 2 deposits
      const lotteryAsParticipant2 = await hre.viem.getContractAt(
        "SimpleLottery",
        contractInstance.address,
        { client: { wallet: participant2 } }
      );
      const hash2 = await lotteryAsParticipant2.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash2 });

      // Participant 3 deposits
      const lotteryAsParticipant3 = await hre.viem.getContractAt(
        "SimpleLottery",
        contractInstance.address,
        { client: { wallet: participant3 } }
      );
      const hash3 = await lotteryAsParticipant3.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash3 });

      // Check contract balance
      expect(await contractInstance.read.getLotteryBalance()).to.equal(
        depositAmount * 3n
      );
    });
  });

  describe("Selecting Winner", function () {
    it("Should not allow selecting winner with less than 3 participants", async function () {
      const { contractInstance, participant1, participant2, publicClient } =
        await loadFixture(deploySimpleLotteryFixture);

      const depositAmount = parseEther("1");

      // Add 1 participant
      const lotteryAsParticipant1 = await hre.viem.getContractAt(
        "SimpleLottery",
        contractInstance.address,
        { client: { wallet: participant1 } }
      );
      const hash1 = await lotteryAsParticipant1.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      // Try to select winner with 1 participant
      await expect(contractInstance.write.selectWinner()).to.be.rejectedWith(
        "Participants are not enough"
      );

      // Add second participant
      const lotteryAsParticipant2 = await hre.viem.getContractAt(
        "SimpleLottery",
        contractInstance.address,
        { client: { wallet: participant2 } }
      );
      const hash2 = await lotteryAsParticipant2.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash2 });

      // Try to select winner with 2 participants
      await expect(contractInstance.write.selectWinner()).to.be.rejectedWith(
        "Participants are not enough"
      );
    });

    it("Should allow owner to select winner with 3+ participants", async function () {
      const {
        contractInstance,
        owner,
        participant1,
        participant2,
        participant3,
        publicClient,
      } = await loadFixture(deploySimpleLotteryFixture);

      const depositAmount = parseEther("1");

      // Add 3 participants
      const lotteryAsParticipant1 = await hre.viem.getContractAt(
        "SimpleLottery",
        contractInstance.address,
        { client: { wallet: participant1 } }
      );
      const hash1 = await lotteryAsParticipant1.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      const lotteryAsParticipant2 = await hre.viem.getContractAt(
        "SimpleLottery",
        contractInstance.address,
        { client: { wallet: participant2 } }
      );
      const hash2 = await lotteryAsParticipant2.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash2 });

      const lotteryAsParticipant3 = await hre.viem.getContractAt(
        "SimpleLottery",
        contractInstance.address,
        { client: { wallet: participant3 } }
      );
      const hash3 = await lotteryAsParticipant3.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash3 });

      // Get initial balances of participants
      const initialBalances = await Promise.all(
        [participant1, participant2, participant3].map(async (p) => {
          return await publicClient.getBalance({
            address: getAddress(p.account.address),
          });
        })
      );

      // Select winner
      const selectWinnerHash = await contractInstance.write.selectWinner();
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: selectWinnerHash,
      });

      // Check contract balance is now zero
      expect(await contractInstance.read.getLotteryBalance()).to.equal(0n);

      // Check participants list is reset
      expect(await contractInstance.read.participants([0])).to.have.lengthOf(0);

      // Check one of the participants received the funds
      const finalBalances = await Promise.all(
        [participant1, participant2, participant3].map(async (p) => {
          return await publicClient.getBalance({
            address: getAddress(p.account.address),
          });
        })
      );

      // Calculate gas costs for each participant
      const gasCosts = [participant1, participant2, participant3].map(
        (p, i) => {
          // Only the winner's transaction will have gas costs from the transfer
          return p.account.address === receipt.from
            ? receipt.gasUsed * receipt.effectiveGasPrice
            : 0n;
        }
      );

      // Check which participant received the winnings (3 ether minus gas)
      const winnerIndex = finalBalances.findIndex(
        (balance, i) => balance + gasCosts[i] > initialBalances[i]
      );

      expect(winnerIndex).to.be.gte(0);
      expect(winnerIndex).to.be.lte(2);

      // Verify the winner received approximately 3 ether (minus gas)
      expect(
        finalBalances[winnerIndex] +
          gasCosts[winnerIndex] -
          initialBalances[winnerIndex]
      ).to.be.closeTo(parseEther("3"), parseEther("0.1"));
    });
  });
});
