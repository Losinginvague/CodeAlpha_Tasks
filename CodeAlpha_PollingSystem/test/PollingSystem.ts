import { expect } from "chai";
import { network } from "hardhat";

const connection = await network.connect();
const { ethers, networkHelpers } = connection;

describe("PollingSystem", function () {
  async function createSamplePoll(pollingSystem: any) {
    await pollingSystem.createPoll(
      "Favorite Language",
      ["Solidity", "JavaScript", "Python"],
      3600 // 1 hour duration
    );
  }

  it("should create a poll correctly", async function () {
    const PollingSystem = await ethers.getContractFactory("PollingSystem");
    const pollingSystem = await PollingSystem.deploy();

    await createSamplePoll(pollingSystem);

    const details = await pollingSystem.getPollDetails(0);
    expect(details.title).to.equal("Favorite Language");
    expect(details.options).to.deep.equal(["Solidity", "JavaScript", "Python"]);

    expect(await pollingSystem.pollCount()).to.equal(1n);
  });

  it("should allow voting and count votes correctly", async function () {
    const [, voter1, voter2] = await ethers.getSigners();

    const PollingSystem = await ethers.getContractFactory("PollingSystem");
    const pollingSystem = await PollingSystem.deploy();

    await createSamplePoll(pollingSystem);

    await pollingSystem.connect(voter1).vote(0, 0); // votes for "Solidity"
    await pollingSystem.connect(voter2).vote(0, 0); // also votes for "Solidity"

    const voteCount = await pollingSystem.getVoteCount(0, 0);
    expect(voteCount).to.equal(2n);
  });

  it("should prevent double voting from the same address", async function () {
    const [, voter1] = await ethers.getSigners();

    const PollingSystem = await ethers.getContractFactory("PollingSystem");
    const pollingSystem = await PollingSystem.deploy();

    await createSamplePoll(pollingSystem);

    await pollingSystem.connect(voter1).vote(0, 0);

    await expect(
      pollingSystem.connect(voter1).vote(0, 1)
    ).to.be.revertedWith("You have already voted in this poll");
  });

  it("should reject voting on an invalid option index", async function () {
    const [, voter1] = await ethers.getSigners();

    const PollingSystem = await ethers.getContractFactory("PollingSystem");
    const pollingSystem = await PollingSystem.deploy();

    await createSamplePoll(pollingSystem);

    await expect(
      pollingSystem.connect(voter1).vote(0, 99)
    ).to.be.revertedWith("Invalid option index");
  });

  it("should reject voting after the poll has ended", async function () {
    const [, voter1] = await ethers.getSigners();

    const PollingSystem = await ethers.getContractFactory("PollingSystem");
    const pollingSystem = await PollingSystem.deploy();

    // Create a poll with a very short duration (1 second)
    await pollingSystem.createPoll("Quick Poll", ["Yes", "No"], 1);

    // Fast-forward time past the poll's end time
    await networkHelpers.time.increase(2);

    await expect(
      pollingSystem.connect(voter1).vote(0, 0)
    ).to.be.revertedWith("Voting period has ended");
  });

  it("should correctly determine the winner after the poll ends", async function () {
    const [, voter1, voter2, voter3] = await ethers.getSigners();

    const PollingSystem = await ethers.getContractFactory("PollingSystem");
    const pollingSystem = await PollingSystem.deploy();

    // Give it a longer duration so multiple votes can happen safely within it
    await pollingSystem.createPoll("Best Framework", ["Hardhat", "Foundry"], 3600);

    await pollingSystem.connect(voter1).vote(0, 0); // Hardhat
    await pollingSystem.connect(voter2).vote(0, 0); // Hardhat
    await pollingSystem.connect(voter3).vote(0, 1); // Foundry

    // Fast-forward well PAST the 3600-second duration
    await networkHelpers.time.increase(3700);

    const [winningOption, winningVoteCount] = await pollingSystem.getWinner(0);
    expect(winningOption).to.equal("Hardhat");
    expect(winningVoteCount).to.equal(2n);
  });

  it("should reject getting the winner before the poll ends", async function () {
    const PollingSystem = await ethers.getContractFactory("PollingSystem");
    const pollingSystem = await PollingSystem.deploy();

    await createSamplePoll(pollingSystem);

    await expect(pollingSystem.getWinner(0)).to.be.revertedWith(
      "Poll is still ongoing"
    );
  });
});