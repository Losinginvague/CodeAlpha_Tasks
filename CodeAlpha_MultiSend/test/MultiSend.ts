import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MultiSend", function () {
  it("should split Ether equally among recipients", async function () {
    const [sender, recipient1, recipient2, recipient3] = await ethers.getSigners();

    const MultiSend = await ethers.getContractFactory("MultiSend");
    const multiSend = await MultiSend.deploy();

    const recipients = [recipient1.address, recipient2.address, recipient3.address];
    const totalSent = ethers.parseEther("3"); // 3 ETH total, 1 ETH each

    const balanceBefore = await ethers.provider.getBalance(recipient1.address);

    await multiSend.connect(sender).multiSend(recipients, { value: totalSent });

    const balanceAfter = await ethers.provider.getBalance(recipient1.address);
    const expectedShare = totalSent / BigInt(recipients.length);

    expect(balanceAfter - balanceBefore).to.equal(expectedShare);
  });

  it("should revert with an empty recipient list", async function () {
    const MultiSend = await ethers.getContractFactory("MultiSend");
    const multiSend = await MultiSend.deploy();

    await expect(
      multiSend.multiSend([], { value: ethers.parseEther("1") })
    ).to.be.revertedWith("Recipient list is empty");
  });

  it("should revert when no Ether is sent", async function () {
    const [, recipient1] = await ethers.getSigners();

    const MultiSend = await ethers.getContractFactory("MultiSend");
    const multiSend = await MultiSend.deploy();

    await expect(
      multiSend.multiSend([recipient1.address], { value: 0 })
    ).to.be.revertedWith("Must send some Ether");
  });
});