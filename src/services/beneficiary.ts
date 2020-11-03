import { Beneficiary } from '../db/models/beneficiary';


export default class BeneficiaryService {

    public static async add(
        address: string,
        communityId: string,
        txAt: Date,
    ): Promise<boolean> {
        // if user does not exist, add to pending list
        // otherwise update
        const user = await Beneficiary.findOne({ where: { address } });
        if (user === null) {
            const updated = await Beneficiary.create({
                address,
                communityId,
                txAt,
            });
            return updated[0] > 0;
        }
        return true;
    }

    public static async getAllInCommunity(
        communityId: string,
    ): Promise<Beneficiary[]> {
        return await Beneficiary.findAll({ where: { communityId } });
    }

    public static async get(
        address: string,
    ): Promise<Beneficiary | null> {
        return await Beneficiary.findOne({ where: { address } });
    }

    public static async remove(
        address: string,
    ): Promise<void> {
        await Beneficiary.destroy({ where: { address } });
    }
}