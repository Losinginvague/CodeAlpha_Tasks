// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MultiSend {
    event Sent(address indexed recipient, uint256 amount);
    event MultiSendCompleted(uint256 totalRecipients, uint256 totalAmount);

    // Sends equal amounts of Ether to each address in the array.
    // "payable" allows this function to receive ETH along with the call.
    function multiSend(address[] calldata recipients) public payable {
        uint256 numberOfRecipients = recipients.length;

        // Basic safety checks
        require(numberOfRecipients > 0, "Recipient list is empty");
        require(msg.value > 0, "Must send some Ether");

        // Calculate equal share per recipient (integer division)
        uint256 amountPerRecipient = msg.value / numberOfRecipients;
        require(amountPerRecipient > 0, "Amount too small to split");

        // Loop through each address and send their share
        for (uint256 i = 0; i < numberOfRecipients; i++) {
            address recipient = recipients[i];
            require(recipient != address(0), "Invalid address in list");

            (bool success, ) = payable(recipient).call{value: amountPerRecipient}("");
            require(success, "Transfer failed for one recipient");

            emit Sent(recipient, amountPerRecipient);
        }

        emit MultiSendCompleted(numberOfRecipients, msg.value);
    }
}