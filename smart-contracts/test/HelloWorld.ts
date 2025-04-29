import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

describe("HelloWorld", function () {

  /**
   * Sets up a fixture to reuse the same configuration across multiple tests
   * A fixture is a pre-configured set of resources that creates a consistent
   * environment for running multiple tests without duplicating code
   * 
   * @returns {Object} Object containing the deployed contract, accounts and necessary clients
   */
  async function deployHelloWorldFixture() {

    // Fake wallets - owner and two other
    const [owner, otherAccount, thirdAccount] =
      await hre.viem.getWalletClients();

    // Deploy the contract with 1 ETH initial value
    const initialAmount = parseEther("1");
    const helloWorld = await hre.viem.deployContract("HelloWorld", [], {
      value: initialAmount,
    });

    // Get a public client to interact with the blockchain and query state
    const publicClient = await hre.viem.getPublicClient();

    // Return all objects needed for testing
    return {
      helloWorld,      // Deployed contract instance
      initialAmount,   // Amount of ETH sent to the contract (1 ETH)
      owner,           // Account that deployed the contract
      otherAccount,    // Second account for testing
      thirdAccount,    // Third account for testing
      publicClient,    // Client for querying the blockchain
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { helloWorld, owner } = await loadFixture(deployHelloWorldFixture);

      expect(await helloWorld.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should have the correct initial balance", async function () {
      const { helloWorld, initialAmount, publicClient } = await loadFixture(
        deployHelloWorldFixture
      );

      expect(
        await publicClient.getBalance({
          address: helloWorld.address,
        })
      ).to.equal(initialAmount);

      expect(await helloWorld.read.getContractBalance()).to.equal(
        initialAmount
      );
    });
  });

  describe("Deposits", function () {
    it("Should allow deposits and update balances correctly", async function () {
      const { helloWorld, otherAccount, publicClient, initialAmount } =
        await loadFixture(deployHelloWorldFixture);

      const depositAmount = parseEther("0.5");

      // Verificar saldo inicial
      expect(
        await helloWorld.read.balances([
          getAddress(otherAccount.account.address),
        ])
      ).to.equal(0n);

      // Fazer um depósito e verificar o evento
      const helloWorldAsOtherAccount = await hre.viem.getContractAt(
        "HelloWorld",
        helloWorld.address,
        { client: { wallet: otherAccount } }
      );

      const hash = await helloWorldAsOtherAccount.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Verificar se o evento foi emitido corretamente
      const depositEvents = await helloWorld.getEvents.Deposit();
      expect(depositEvents).to.have.lengthOf(1);
      expect(depositEvents[0].args.amount).to.equal(depositAmount);
      expect(depositEvents[0].args.from).to.equal(
        getAddress(otherAccount.account.address)
      );

      // Verificar saldo atualizado do usuário
      expect(
        await helloWorld.read.balances([
          getAddress(otherAccount.account.address),
        ])
      ).to.equal(depositAmount);

      // Verificar saldo do contrato
      expect(await helloWorld.read.getContractBalance()).to.equal(
        initialAmount + depositAmount
      );
    });

    it("Should fail if deposit amount is zero", async function () {
      const { helloWorld, otherAccount } = await loadFixture(
        deployHelloWorldFixture
      );

      const helloWorldAsOtherAccount = await hre.viem.getContractAt(
        "HelloWorld",
        helloWorld.address,
        { client: { wallet: otherAccount } }
      );

      // Tentar fazer um depósito de zero e verificar se falha
      await expect(
        helloWorldAsOtherAccount.write.deposit({ value: 0n })
      ).to.be.rejectedWith("Deposit must be greater than zero");
    });

    it("Should handle multiple deposits from the same user", async function () {
      const { helloWorld, otherAccount, publicClient } = await loadFixture(
        deployHelloWorldFixture
      );

      const depositAmount1 = parseEther("0.3");
      const depositAmount2 = parseEther("0.7");
      const totalDeposit = depositAmount1 + depositAmount2;

      const helloWorldAsOtherAccount = await hre.viem.getContractAt(
        "HelloWorld",
        helloWorld.address,
        { client: { wallet: otherAccount } }
      );

      // Fazer dois depósitos
      const hash1 = await helloWorldAsOtherAccount.write.deposit({
        value: depositAmount1,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      const hash2 = await helloWorldAsOtherAccount.write.deposit({
        value: depositAmount2,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash2 });

      // Verificar saldo combinado
      expect(
        await helloWorld.read.balances([
          getAddress(otherAccount.account.address),
        ])
      ).to.equal(totalDeposit);
    });

    it("Should handle deposits from multiple users", async function () {
      const {
        helloWorld,
        otherAccount,
        thirdAccount,
        publicClient,
        initialAmount,
      } = await loadFixture(deployHelloWorldFixture);

      const depositAmount1 = parseEther("0.3");
      const depositAmount2 = parseEther("0.7");

      // Configurar contratos para diferentes usuários
      const helloWorldAsOtherAccount = await hre.viem.getContractAt(
        "HelloWorld",
        helloWorld.address,
        { client: { wallet: otherAccount } }
      );

      const helloWorldAsThirdAccount = await hre.viem.getContractAt(
        "HelloWorld",
        helloWorld.address,
        { client: { wallet: thirdAccount } }
      );

      // Fazer depósitos de diferentes endereços
      const hash1 = await helloWorldAsOtherAccount.write.deposit({
        value: depositAmount1,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      const hash2 = await helloWorldAsThirdAccount.write.deposit({
        value: depositAmount2,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash2 });

      // Verificar saldos individuais
      expect(
        await helloWorld.read.balances([
          getAddress(otherAccount.account.address),
        ])
      ).to.equal(depositAmount1);
      expect(
        await helloWorld.read.balances([
          getAddress(thirdAccount.account.address),
        ])
      ).to.equal(depositAmount2);

      // Verificar saldo do contrato
      expect(await helloWorld.read.getContractBalance()).to.equal(
        initialAmount + depositAmount1 + depositAmount2
      );
    });
  });

  describe("Withdrawals", function () {
    it("Should allow withdrawals and update balances correctly", async function () {
      const { helloWorld, otherAccount, publicClient } = await loadFixture(
        deployHelloWorldFixture
      );

      // Primeiro depositamos ETH
      const depositAmount = parseEther("0.5");
      const helloWorldAsOtherAccount = await hre.viem.getContractAt(
        "HelloWorld",
        helloWorld.address,
        { client: { wallet: otherAccount } }
      );

      const depositHash = await helloWorldAsOtherAccount.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash: depositHash });

      // Verificar saldo antes da retirada
      expect(
        await helloWorld.read.balances([
          getAddress(otherAccount.account.address),
        ])
      ).to.equal(depositAmount);

      // Obter saldo da conta antes da retirada
      const initialBalance = await publicClient.getBalance({
        address: getAddress(otherAccount.account.address),
      });

      // Executar retirada
      const withdrawHash = await helloWorldAsOtherAccount.write.withdraw();
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: withdrawHash,
      });

      // Verificar se o evento foi emitido
      const withdrawalEvents = await helloWorld.getEvents.Withdrawal();
      expect(withdrawalEvents).to.have.lengthOf(1);
      expect(withdrawalEvents[0].args.amount).to.equal(depositAmount);
      expect(withdrawalEvents[0].args.to).to.equal(
        getAddress(otherAccount.account.address)
      );

      // Verificar se o saldo foi zerado
      expect(
        await helloWorld.read.balances([
          getAddress(otherAccount.account.address),
        ])
      ).to.equal(0n);

      // Verificar se o ETH foi realmente transferido para o usuário
      const finalBalance = await publicClient.getBalance({
        address: getAddress(otherAccount.account.address),
      });

      // O ETH foi transferido se o saldo final menos o saldo inicial é aproximadamente igual ao valor do depósito,
      // considerando o custo do gás
      const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;

      // Verificamos se o saldo mudou dentro do esperado
      // Para BigInt, usamos operadores matemáticos diretos ao invés de greaterThan
      expect(finalBalance + gasUsed > initialBalance).to.be.true;
    });

    it("Should fail to withdraw if user has no balance", async function () {
      const { helloWorld, otherAccount } = await loadFixture(
        deployHelloWorldFixture
      );

      const helloWorldAsOtherAccount = await hre.viem.getContractAt(
        "HelloWorld",
        helloWorld.address,
        { client: { wallet: otherAccount } }
      );

      // Tentar sacar sem ter saldo
      await expect(
        helloWorldAsOtherAccount.write.withdraw()
      ).to.be.rejectedWith("You have no funds to withdraw");
    });
  });

  describe("View functions", function () {
    it("Should correctly return contract balance", async function () {
      const { helloWorld, otherAccount, publicClient, initialAmount } =
        await loadFixture(deployHelloWorldFixture);

      // Saldo inicial deve ser 1 ETH
      expect(await helloWorld.read.getContractBalance()).to.equal(
        initialAmount
      );

      // Adicionar mais ETH
      const depositAmount = parseEther("2.0");
      const helloWorldAsOtherAccount = await hre.viem.getContractAt(
        "HelloWorld",
        helloWorld.address,
        { client: { wallet: otherAccount } }
      );

      const hash = await helloWorldAsOtherAccount.write.deposit({
        value: depositAmount,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // Novo saldo deve ser 3 ETH
      expect(await helloWorld.read.getContractBalance()).to.equal(
        initialAmount + depositAmount
      );
    });
  });
});
