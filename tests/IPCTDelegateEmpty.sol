//SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.5;

contract IPCTDelegate {
    event ProposalCreated(
        uint256 id,
        address proposer,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 startBlock,
        uint256 endBlock,
        string description
    );

    event ProposalCanceled(uint256 id);

    event ProposalQueued(uint256 id, uint256 eta);

    event ProposalExecuted(uint256 id);

    uint256 public proposalCount;

    constructor() public {
        proposalCount = 0;
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description
    ) public returns (uint256) {
        uint256 startBlock = block.number; // start right away
        uint256 endBlock = startBlock + 1; // 1 block
        
        proposalCount++;

        emit ProposalCreated(
            proposalCount,
            msg.sender,
            targets,
            values,
            signatures,
            calldatas,
            startBlock,
            endBlock,
            description
        );
        return proposalCount;
    }

    function queue(uint256 proposalId) public {
        emit ProposalQueued(proposalId, block.number + 2);
    }

    function execute(uint256 proposalId) public {
        emit ProposalExecuted(proposalId);
    }

    function cancel(uint256 proposalId) public {
        emit ProposalCanceled(proposalId);
    }
}
