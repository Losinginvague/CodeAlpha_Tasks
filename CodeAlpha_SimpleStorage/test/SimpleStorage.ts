import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("SimpleStorage", function () {

  it("should increment and decrement correctly", async function () {
    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    const simpleStorage = await SimpleStorage.deploy();

    expect(await simpleStorage.storedValue()).to.equal(0n);

    await simpleStorage.increment();
    expect(await simpleStorage.storedValue()).to.equal(1n);

    await simpleStorage.decrement();
    expect(await simpleStorage.storedValue()).to.equal(0n);
  });

  it("should revert decrement below zero", async function () {
    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    const simpleStorage = await SimpleStorage.deploy();

    await expect(simpleStorage.decrement()).to.be.revertedWith(
      "Value is already 0, cannot decrement"
    );
  });

});