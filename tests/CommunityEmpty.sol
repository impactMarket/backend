// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.5;

/**
 * @notice Welcome to the Community contract. For each community
 * there will be one proxy contract deployed by CommunityAdmin.
 * The implementation of the proxy is this contract. This enable
 * us to save tokens on the contract itself, and avoid the problems
 * of having everything in one single contract.
 *Each community has it's own members and and managers.
 */
contract Community {

    bool internal _locked;
    uint256 internal _claimAmount;
    uint256 internal _baseInterval;
    uint256 internal _incrementInterval;
    uint256 internal _maxClaim;
    uint256 internal _validBeneficiaryCount;
    uint256 internal _treasuryFunds;
    uint256 internal _privateFunds;
    uint256 internal _decreaseStep;
    uint256 internal _minTranche;
    uint256 internal _maxTranche;

    event ManagerAdded(address indexed manager, address indexed account);
    event ManagerRemoved(address indexed manager, address indexed account);
    event BeneficiaryAdded(address indexed manager, address indexed beneficiary);
    event BeneficiaryRemoved(address indexed manager, address indexed beneficiary);
    event BeneficiaryClaim(address indexed beneficiary, uint256 amount);
    event CommunityLocked(address indexed manager);
    event CommunityUnlocked(address indexed manager);
    event BeneficiaryParamsUpdated(
        uint256 oldClaimAmount,
        uint256 oldMaxClaim,
        uint256 oldDecreaseStep,
        uint256 oldBaseInterval,
        uint256 oldIncrementInterval,
        uint256 newClaimAmount,
        uint256 newMaxClaim,
        uint256 newDecreaseStep,
        uint256 newBaseInterval,
        uint256 newIncrementInterval
    );

    constructor(
        address[] memory managers_,
        uint256 claimAmount_,
        uint256 maxClaim_,
        uint256 decreaseStep_,
        uint256 baseInterval_,
        uint256 incrementInterval_,
        uint256 minTranche_,
        uint256 maxTranche_,
        address previousCommunity_
    ) {
        _claimAmount = claimAmount_;
        _baseInterval = baseInterval_;
        _incrementInterval = incrementInterval_;
        _maxClaim = maxClaim_;
        _minTranche = minTranche_;
        _maxTranche = maxTranche_;
        // _previousCommunity = previousCommunity_;
        _decreaseStep = decreaseStep_;
        _locked = false;


        for (uint256 i = 0; i < managers_.length; i++) {
            emit ManagerAdded(msg.sender, managers_[i]);
        }
    }

    function updateBeneficiaryParams(
        uint256 claimAmount_,
        uint256 maxClaim_,
        uint256 decreaseStep_,
        uint256 baseInterval_,
        uint256 incrementInterval_
    ) external {

        uint256 oldClaimAmount = _claimAmount;
        uint256 oldMaxClaim = _maxClaim;
        uint256 oldDecreaseStep = _decreaseStep;
        uint256 oldBaseInterval = _baseInterval;
        uint256 oldIncrementInterval = _incrementInterval;

        _claimAmount = claimAmount_;
        _maxClaim = maxClaim_;
        _decreaseStep = decreaseStep_;
        _baseInterval = baseInterval_;
        _incrementInterval = incrementInterval_;

        emit BeneficiaryParamsUpdated(
            oldClaimAmount,
            oldMaxClaim,
            oldDecreaseStep,
            oldBaseInterval,
            oldIncrementInterval,
            _claimAmount,
            _maxClaim,
            _decreaseStep,
            _baseInterval,
            _incrementInterval
        );
    }

    function addManager(address account_)
        external
        
    {
        emit ManagerAdded(msg.sender, account_);
    }

    function removeManager(address account_) external {
        emit ManagerRemoved(msg.sender, account_);
    }

    function addBeneficiary(address beneficiaryAddress_)
        external
        
    {
        emit BeneficiaryAdded(msg.sender, beneficiaryAddress_);
    }

    function removeBeneficiary(address beneficiaryAddress_)
        external
        
    {
        emit BeneficiaryRemoved(msg.sender, beneficiaryAddress_);
    }

    function claim() external {
        emit BeneficiaryClaim(msg.sender, _claimAmount);
    }

    function lock() external {
        emit CommunityLocked(msg.sender);
    }

    function unlock() external {
        emit CommunityUnlocked(msg.sender);
    }
}