import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();
describe("CryptoLock", function () {
  async function deployContract() {
    const [owner, user] = await ethers.getSigners();

    const CryptoLock = await ethers.getContractFactory("CryptoLock");
    const cryptoLock = await CryptoLock.deploy();

    await cryptoLock.waitForDeployment();

    return { cryptoLock, owner, user };
  }

  it("Should deploy the contract successfully", async function () {
    const { cryptoLock } = await deployContract();

    expect(await cryptoLock.getAddress()).to.be.properAddress;
  });

  it("Should accept an ETH deposit", async function () {
    const { cryptoLock, owner } = await deployContract();

    const depositAmount = ethers.parseEther("1");
    const lockDuration = 3600;

    await cryptoLock.deposit(lockDuration, {
      value: depositAmount,
    });

    expect(await cryptoLock.deposits(owner.address))
      .to.equal(depositAmount);

    expect(await cryptoLock.unlockTime(owner.address))
      .to.be.greaterThan(0);
  });

  it("Should reject a zero ETH deposit", async function () {
    const { cryptoLock } = await deployContract();

    await expect(
      cryptoLock.deposit(3600, {
        value: 0,
      })
    ).to.be.revertedWith("Deposit must be greater than zero");
  });

  it("Should reject a zero lock duration", async function () {
    const { cryptoLock } = await deployContract();

    await expect(
      cryptoLock.deposit(0, {
        value: ethers.parseEther("1"),
      })
    ).to.be.revertedWith("Lock duration must be positive");
  });

  it("Should reject early withdrawal", async function () {
    const { cryptoLock, owner } = await deployContract();

    await cryptoLock.deposit(3600, {
      value: ethers.parseEther("1"),
    });

    await expect(
      cryptoLock.withdraw()
    ).to.be.revertedWith("Funds are still locked");

    expect(await cryptoLock.deposits(owner.address))
      .to.equal(ethers.parseEther("1"));
  });

  it("Should allow withdrawal after the lock expires", async function () {
    const { cryptoLock, owner } = await deployContract();

    const depositAmount = ethers.parseEther("1");

    await cryptoLock.deposit(3600, {
      value: depositAmount,
    });

    // Advance the local blockchain time by 1 hour
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      cryptoLock.withdraw()
    ).to.emit(cryptoLock, "Withdrawn")
      .withArgs(owner.address, depositAmount);

    expect(await cryptoLock.deposits(owner.address))
      .to.equal(0);

    expect(await cryptoLock.unlockTime(owner.address))
      .to.equal(0);
  });

  it("Should prevent withdrawal when no deposit exists", async function () {
    const { cryptoLock } = await deployContract();

    await expect(
      cryptoLock.withdraw()
    ).to.be.revertedWith("No active deposit");
  });

  it("Should prevent a second deposit before withdrawing the first", async function () {
    const { cryptoLock } = await deployContract();

    await cryptoLock.deposit(3600, {
      value: ethers.parseEther("1"),
    });

    await expect(
      cryptoLock.deposit(3600, {
        value: ethers.parseEther("1"),
      })
    ).to.be.revertedWith(
      "Existing deposit must be withdrawn first"
    );
  });
});