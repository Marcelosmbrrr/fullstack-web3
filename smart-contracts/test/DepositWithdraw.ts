import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

describe("DepositWithdraw", function () {
  /**
   * Sets up a fixture to reuse the same configuration across multiple tests
   * A fixture is a pre-configured set of resources
   *
   * @returns {Object} Object containing the deployed contract, accounts and necessary clients
   */
  async function deployDepositWithdrawFixture() {
    const [owner, account2, account3] = await hre.viem.getWalletClients();

    const initialAmount = parseEther("1");
    const contractInstance = await hre.viem.deployContract(
      "DepositWithdraw",
      [],
      {
        value: initialAmount,
      }
    );

    const publicClient = await hre.viem.getPublicClient();

    return {
      contractInstance,
      initialAmount,
      owner,
      account2,
      account3,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { contractInstance, owner } = await loadFixture(
        deployDepositWithdrawFixture
      );

      expect(await contractInstance.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should have the correct initial balance", async function () {
      const { contractInstance, initialAmount, publicClient } =
        await loadFixture(deployDepositWithdrawFixture);

      expect(
        await publicClient.getBalance({
          address: contractInstance.address,
        })
      ).to.equal(initialAmount);

      expect(await contractInstance.read.getContractBalance()).to.equal(
        initialAmount
      );
    });
  });

  describe("Deposits", function () {
    it("Should allow deposits and update balances correctly", async function () {
      const { contractInstance, account2, publicClient, initialAmount } =
        await loadFixture(deployDepositWithdrawFixture);

      const depositAmount = parseEther("0.5");

      // Verificar saldo inicial
      expect(
        await contractInstance.read.balances([
          getAddress(account2.account.address),
        ])
      ).to.equal(0n);

      // Fazer um depósito e verificar o evento
      const depositWithdrawAsOtherAccount = await hre.viem.getContractAt(
        "DepositWithdraw",
        contractInstance.address,
        { client: { wallet: account2 } }
      );

      const hash = await depositWithdrawAsOtherAccount.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Verificar se o evento foi emitido corretamente
      const depositEvents = await contractInstance.getEvents.Deposit();
      expect(depositEvents).to.have.lengthOf(1);
      expect(depositEvents[0].args.amount).to.equal(depositAmount);
      expect(depositEvents[0].args.from).to.equal(
        getAddress(account2.account.address)
      );

      // Verificar saldo atualizado do usuário
      expect(
        await contractInstance.read.balances([
          getAddress(account2.account.address),
        ])
      ).to.equal(depositAmount);

      // Verificar saldo do contrato
      expect(await contractInstance.read.getContractBalance()).to.equal(
        initialAmount + depositAmount
      );
    });

    it("Should fail if deposit amount is zero", async function () {
      const { contractInstance, account2 } = await loadFixture(
        deployDepositWithdrawFixture
      );

      const depositWithdrawAsOtherAccount = await hre.viem.getContractAt(
        "DepositWithdraw",
        contractInstance.address,
        { client: { wallet: account2 } }
      );

      // Tentar fazer um depósito de zero e verificar se falha
      await expect(
        depositWithdrawAsOtherAccount.write.deposit({ value: 0n })
      ).to.be.rejectedWith("Must be greater than zero");
    });

    it("Should handle multiple deposits from the same user", async function () {
      const { contractInstance, account2, publicClient } = await loadFixture(
        deployDepositWithdrawFixture
      );

      const depositAmount1 = parseEther("0.3");
      const depositAmount2 = parseEther("0.7");
      const totalDeposit = depositAmount1 + depositAmount2;

      const depositWithdrawAsOtherAccount = await hre.viem.getContractAt(
        "DepositWithdraw",
        contractInstance.address,
        { client: { wallet: account2 } }
      );

      // Fazer dois depósitos
      const hash1 = await depositWithdrawAsOtherAccount.write.deposit({
        value: depositAmount1,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      const hash2 = await depositWithdrawAsOtherAccount.write.deposit({
        value: depositAmount2,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash2 });

      // Verificar saldo combinado
      expect(
        await contractInstance.read.balances([
          getAddress(account2.account.address),
        ])
      ).to.equal(totalDeposit);
    });

    it("Should handle deposits from multiple users", async function () {
      const {
        contractInstance,
        account2,
        account3,
        publicClient,
        initialAmount,
      } = await loadFixture(deployDepositWithdrawFixture);

      const depositAmount1 = parseEther("0.3");
      const depositAmount2 = parseEther("0.7");

      // Configurar contratos para diferentes usuários
      const depositWithdrawAsOtherAccount = await hre.viem.getContractAt(
        "DepositWithdraw",
        contractInstance.address,
        { client: { wallet: account2 } }
      );

      const depositWithdrawAsThirdAccount = await hre.viem.getContractAt(
        "DepositWithdraw",
        contractInstance.address,
        { client: { wallet: account3 } }
      );

      // Fazer depósitos de diferentes endereços
      const hash1 = await depositWithdrawAsOtherAccount.write.deposit({
        value: depositAmount1,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      const hash2 = await depositWithdrawAsThirdAccount.write.deposit({
        value: depositAmount2,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash2 });

      // Verificar saldos individuais
      expect(
        await contractInstance.read.balances([
          getAddress(account2.account.address),
        ])
      ).to.equal(depositAmount1);
      expect(
        await contractInstance.read.balances([
          getAddress(account3.account.address),
        ])
      ).to.equal(depositAmount2);

      // Verificar saldo do contrato
      expect(await contractInstance.read.getContractBalance()).to.equal(
        initialAmount + depositAmount1 + depositAmount2
      );
    });
  });

  describe("Withdrawals", function () {
    it("Should allow withdrawals and update balances correctly", async function () {
      const { contractInstance, account2, publicClient } = await loadFixture(
        deployDepositWithdrawFixture
      );

      // Primeiro depositamos ETH
      const depositAmount = parseEther("0.5");
      const depositWithdrawAsOtherAccount = await hre.viem.getContractAt(
        "DepositWithdraw",
        contractInstance.address,
        { client: { wallet: account2 } }
      );

      const depositHash = await depositWithdrawAsOtherAccount.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash: depositHash });

      // Verificar saldo antes da retirada
      expect(
        await contractInstance.read.balances([
          getAddress(account2.account.address),
        ])
      ).to.equal(depositAmount);

      // Obter saldo da conta antes da retirada
      const initialBalance = await publicClient.getBalance({
        address: getAddress(account2.account.address),
      });

      // Executar retirada
      const withdrawHash = await depositWithdrawAsOtherAccount.write.withdraw();
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: withdrawHash,
      });

      // Verificar se o evento foi emitido
      const withdrawalEvents = await contractInstance.getEvents.Withdrawal();
      expect(withdrawalEvents).to.have.lengthOf(1);
      expect(withdrawalEvents[0].args.amount).to.equal(depositAmount);
      expect(withdrawalEvents[0].args.to).to.equal(
        getAddress(account2.account.address)
      );

      // Verificar se o saldo foi zerado
      expect(
        await contractInstance.read.balances([
          getAddress(account2.account.address),
        ])
      ).to.equal(0n);

      // Verificar se o ETH foi realmente transferido para o usuário
      const finalBalance = await publicClient.getBalance({
        address: getAddress(account2.account.address),
      });

      // O ETH foi transferido se o saldo final menos o saldo inicial é aproximadamente igual ao valor do depósito,
      // considerando o custo do gás
      const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;

      // Verificamos se o saldo mudou dentro do esperado
      // Para BigInt, usamos operadores matemáticos diretos ao invés de greaterThan
      expect(finalBalance + gasUsed > initialBalance).to.be.true;
    });

    it("Should fail to withdraw if user has no balance", async function () {
      const { contractInstance, account2 } = await loadFixture(
        deployDepositWithdrawFixture
      );

      const depositWithdrawAsOtherAccount = await hre.viem.getContractAt(
        "DepositWithdraw",
        contractInstance.address,
        { client: { wallet: account2 } }
      );

      // Tentar sacar sem ter saldo
      await expect(
        depositWithdrawAsOtherAccount.write.withdraw()
      ).to.be.rejectedWith("No funds");
    });
  });

  describe("View functions", function () {
    it("Should correctly return contract balance", async function () {
      const { contractInstance, account2, publicClient, initialAmount } =
        await loadFixture(deployDepositWithdrawFixture);

      // Saldo inicial deve ser 1 ETH
      expect(await contractInstance.read.getContractBalance()).to.equal(
        initialAmount
      );

      // Adicionar mais ETH
      const depositAmount = parseEther("2.0");
      const depositWithdrawAsOtherAccount = await hre.viem.getContractAt(
        "DepositWithdraw",
        contractInstance.address,
        { client: { wallet: account2 } }
      );

      const hash = await depositWithdrawAsOtherAccount.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Novo saldo deve ser 3 ETH
      expect(await contractInstance.read.getContractBalance()).to.equal(
        initialAmount + depositAmount
      );
    });
  });

  describe("getDepositedAmount", function () {
    it("Should return zero for account with no deposits", async function () {
      const { contractInstance, account2 } = await loadFixture(
        deployDepositWithdrawFixture
      );

      const depositWithdrawAsOtherAccount = await hre.viem.getContractAt(
        "DepositWithdraw",
        contractInstance.address,
        { client: { wallet: account2 } }
      );

      const depositedAmount =
        await depositWithdrawAsOtherAccount.read.getDepositedAmount(
          [account2.account.address],
          { account: account2.account.address }
        );

      expect(depositedAmount).to.equal(0n);
    });

    it("Should return correct deposited amount", async function () {
      const { contractInstance, account2, publicClient } = await loadFixture(
        deployDepositWithdrawFixture
      );

      const depositAmount = parseEther("1");

      const otherAccountContractConnection = await hre.viem.getContractAt(
        "DepositWithdraw",
        contractInstance.address,
        { client: { wallet: account2 } }
      );

      const hash = await otherAccountContractConnection.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const depositedAmount =
        await otherAccountContractConnection.read.getDepositedAmount(
          [account2.account.address],
          { account: account2.account.address }
        );

      expect(depositedAmount).to.equal(depositAmount);
    });

    it("Should return zero after withdrawal", async function () {
      const { contractInstance, account2, publicClient } = await loadFixture(
        deployDepositWithdrawFixture
      );

      const depositAmount = parseEther("1.0");

      const depositWithdrawAsOtherAccount = await hre.viem.getContractAt(
        "DepositWithdraw",
        contractInstance.address,
        { client: { wallet: account2 } }
      );

      // Make deposit
      const depositHash = await depositWithdrawAsOtherAccount.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash: depositHash });

      // Withdraw all funds
      const withdrawHash = await depositWithdrawAsOtherAccount.write.withdraw();
      await publicClient.waitForTransactionReceipt({ hash: withdrawHash });

      const depositedAmount =
        await depositWithdrawAsOtherAccount.read.getDepositedAmount(
          [account2.account.address],
          { account: account2.account.address }
        );

      // Check deposited amount is zero
      expect(depositedAmount).to.equal(0n);
    });
  });
});
