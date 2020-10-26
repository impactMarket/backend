import { NotifiedBacker } from '../db/models/notifiedBacker';


export default class NotifiedBackerService {

    public static async add(
        address: string,
        communityId: string
    ): Promise<boolean> {
        const backer = await NotifiedBacker.findOne({ where: { backer: address, communityId } });
        if (backer === null) {
            const updated = await NotifiedBacker.create({
                address,
                communityId
            });
            return updated[0] > 0;
        } else {
            // 3 days in ms
            if (new Date().getTime() - backer.at.getTime() >= 259200000) {
                const updated = await NotifiedBacker.update(
                    { at: new Date() },
                    {
                        where: {
                            backer: address,
                            communityId
                        }
                    });
                return updated[0] > 0;
            }
        }
        return false;
    }
}