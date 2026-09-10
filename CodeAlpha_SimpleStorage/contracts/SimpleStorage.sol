// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 public storedValue;

    event ValueChanged(uint256 newValue, string action);

    constructor() {
        storedValue = 0;
    }

    function increment() public {
        storedValue += 1;
        emit ValueChanged(storedValue, "increment");
    }

    function decrement() public {
        require(storedValue > 0, "Value is already 0, cannot decrement");
        storedValue -= 1;
        emit ValueChanged(storedValue, "decrement");
    }

    function getValue() public view returns (uint256) {
        return storedValue;
    }
}