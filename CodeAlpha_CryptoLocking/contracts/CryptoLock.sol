// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CryptoLock {
    // Stores the amount deposited by each user
    mapping(address => uint256) public deposits;

    // Stores the time when each user's funds can be withdrawn
    mapping(address => uint256) public unlockTime;

    // Events for tracking deposits and withdrawals
    event Deposited(
        address indexed user,
        uint256 amount,
        uint256 unlockTime
    );

    event Withdrawn(
        address indexed user,
        uint256 amount
    );

    // Deposit Ether and lock it for a specified duration
    function deposit(uint256 _lockDuration) external payable {
        require(msg.value > 0, "Deposit must be greater than zero");
        require(_lockDuration > 0, "Lock duration must be positive");

        // This version supports one active deposit per address.
        require(
            deposits[msg.sender] == 0,
            "Existing deposit must be withdrawn first"
        );

        deposits[msg.sender] = msg.value;
        unlockTime[msg.sender] = block.timestamp + _lockDuration;

        emit Deposited(
            msg.sender,
            msg.value,
            unlockTime[msg.sender]
        );
    }

    // Withdraw funds after the lock period ends
    function withdraw() external {
        require(deposits[msg.sender] > 0, "No active deposit");
        require(
            block.timestamp >= unlockTime[msg.sender],
            "Funds are still locked"
        );

        uint256 amount = deposits[msg.sender];

        // Clear the state before transferring Ether
        deposits[msg.sender] = 0;
        unlockTime[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");

        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    // Returns the remaining lock time
    function getRemainingLockTime()
        external
        view
        returns (uint256)
    {
        if (block.timestamp >= unlockTime[msg.sender]) {
            return 0;
        }

        return unlockTime[msg.sender] - block.timestamp;
    }
}