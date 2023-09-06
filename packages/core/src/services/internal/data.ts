import { getMonthlyDonationsByCommunity } from '../../subgraph/queries/internal';

export default class InternalDataService {
    public async getMonthlyDonationsByCommunity() {
        return getMonthlyDonationsByCommunity();
    }
}
