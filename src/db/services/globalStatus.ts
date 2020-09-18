import { IGlobalStatus } from "../../types";


export default class GlobalStatusService {
    public static async counterAdd(type: string, amount: number): Promise<void> {
        //
    }

    public static async get(): Promise<IGlobalStatus> {
        return {
            totalRaised: 2360401,
            totalDistributed: 952778,
            totalBeneficiaries: 6912,
            totalClaims: 380847,
        }
    }
}