// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.5;

contract Community {
    address[] public _managers;
    constructor(address[] memory managers_) {
        for (uint256 i = 0; i < managers_.length; i++) {
            _managers.push(managers_[i]);
        }
    }
}

contract CommunityAdmin {
    event CommunityAdded(
        address indexed communityAddress,
        address[] managers,
        uint256 claimAmount,
        uint256 maxClaim,
        uint256 decreaseStep,
        uint256 baseInterval,
        uint256 incrementInterval,
        uint256 minTranche,
        uint256 maxTranche
    );

    event CommunityRemoved(address indexed communityAddress);

    event CommunityMigrated(
        address[] managers,
        address indexed communityAddress,
        address indexed previousCommunityAddress
    );

    address public cUSD_;
    constructor(address _cUSD) {
        cUSD_ = _cUSD;
    }
    
    function addCommunity(
        address[] memory managers_,
        uint256 claimAmount_,
        uint256 maxClaim_,
        uint256 decreaseStep_,
        uint256 baseInterval_,
        uint256 incrementInterval_,
        uint256 minTranche_,
        uint256 maxTranche_
    ) external {
        address communityAddress = address(new Community(managers_));
        emit CommunityAdded(
            communityAddress,
            managers_,
            claimAmount_,
            maxClaim_,
            decreaseStep_,
            baseInterval_,
            incrementInterval_,
            minTranche_,
            maxTranche_
        );
    }
    
    function migrateCommunity(address[] memory managers_, address previousCommunity_) external {
        address newCommunityAddress = address(new Community(managers_));
        emit CommunityMigrated(managers_, newCommunityAddress, previousCommunity_);
    }
    
    function removeCommunity(address community_) external {
        emit CommunityRemoved(community_);
    }
}