import BeneficiaryService from './beneficiary';
import ClaimLocationService from './claimLocation';
import ClaimLocationServiceV2 from './claimLocation/index';
import CommunityService from './community';
import { CommunityCreateService } from './community/create';
import { CommunityDetailsService } from './community/details';
import { CommunityListService } from './community/list';
import CommunityContractService from './communityContract';
import CommunityDailyMetricsService from './communityDailyMetrics';
import CommunityDemographicsService from './communityDemographics';
import ManagerService from './managers';

export {
    BeneficiaryService,
    ClaimLocationService,
    ClaimLocationServiceV2,
    // TODO: can we remove this? Is it being used?
    CommunityService,
    CommunityContractService,
    CommunityDailyMetricsService,
    ManagerService,
    CommunityDemographicsService,
    CommunityDetailsService,
    CommunityListService,
    CommunityCreateService,
};
