// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PollingSystem {
    struct Poll {
        string title;
        string[] options;
        uint256 endTime;
        mapping(uint256 => uint256) votesPerOption; // option index => vote count
        mapping(address => bool) hasVoted;
        bool exists;
    }

    // Poll ID => Poll data
    mapping(uint256 => Poll) private polls;
    uint256 public pollCount;

    event PollCreated(uint256 indexed pollId, string title, uint256 endTime);
    event VoteCast(uint256 indexed pollId, address indexed voter, uint256 optionIndex);

    // Creates a new poll with a title, a list of options, and a voting duration (in seconds)
    function createPoll(string memory title, string[] memory options, uint256 durationInSeconds) public {
        require(options.length >= 2, "Poll needs at least 2 options");
        require(durationInSeconds > 0, "Duration must be greater than 0");

        uint256 pollId = pollCount;
        Poll storage newPoll = polls[pollId];

        newPoll.title = title;
        newPoll.options = options;
        newPoll.endTime = block.timestamp + durationInSeconds;
        newPoll.exists = true;

        pollCount++;

        emit PollCreated(pollId, title, newPoll.endTime);
    }

    // Casts a vote for a specific option in a specific poll
    function vote(uint256 pollId, uint256 optionIndex) public {
        Poll storage poll = polls[pollId];

        require(poll.exists, "Poll does not exist");
        require(block.timestamp < poll.endTime, "Voting period has ended");
        require(!poll.hasVoted[msg.sender], "You have already voted in this poll");
        require(optionIndex < poll.options.length, "Invalid option index");

        poll.hasVoted[msg.sender] = true;
        poll.votesPerOption[optionIndex] += 1;

        emit VoteCast(pollId, msg.sender, optionIndex);
    }

    // Returns the winning option's index and its vote count, after the poll has ended
    function getWinner(uint256 pollId) public view returns (string memory winningOption, uint256 winningVoteCount) {
        Poll storage poll = polls[pollId];

        require(poll.exists, "Poll does not exist");
        require(block.timestamp >= poll.endTime, "Poll is still ongoing");

        uint256 winningIndex = 0;
        uint256 highestVotes = 0;

        for (uint256 i = 0; i < poll.options.length; i++) {
            if (poll.votesPerOption[i] > highestVotes) {
                highestVotes = poll.votesPerOption[i];
                winningIndex = i;
            }
        }

        return (poll.options[winningIndex], highestVotes);
    }

    // Helper: view a poll's basic details (structs with mappings can't be returned directly)
    function getPollDetails(uint256 pollId) public view returns (string memory title, string[] memory options, uint256 endTime) {
        Poll storage poll = polls[pollId];
        require(poll.exists, "Poll does not exist");
        return (poll.title, poll.options, poll.endTime);
    }

    // Helper: check how many votes a specific option currently has
    function getVoteCount(uint256 pollId, uint256 optionIndex) public view returns (uint256) {
        Poll storage poll = polls[pollId];
        require(poll.exists, "Poll does not exist");
        require(optionIndex < poll.options.length, "Invalid option index");
        return poll.votesPerOption[optionIndex];
    }
}