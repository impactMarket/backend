import BigNumber from "bignumber.js";
import { GlobalDataTypeEnum, IGlobalStatus } from "../../types";
import { GlobalStatus } from "../models/globalStatus";


export default class GlobalStatusService {
    public static async counterAdd(type: string, amount: string): Promise<[number, GlobalStatus[]]> {
        const previousValue = await GlobalStatus.findOne({ where: { key: type } });
        const newValue = new BigNumber(previousValue!.value).plus(amount).toString();
        return await GlobalStatus.update({
            value: newValue,
        }, { returning: true, where: { key: type } });
    }

    public static async get(): Promise<IGlobalStatus> {
        let totalRaised = '0';
        let totalDistributed = '0';
        let totalBeneficiaries = '0';
        let totalClaims = '0';
        const global = await GlobalStatus.findAll({ raw: true });
        global.forEach((g) => {
            switch (g.key) {
                case GlobalDataTypeEnum.totalRaised:
                    totalRaised = g.value;
                    break;
                case GlobalDataTypeEnum.totalDistributed:
                    totalDistributed = g.value;
                    break;
                case GlobalDataTypeEnum.totalBeneficiaries:
                    totalBeneficiaries = g.value;
                    break;
                case GlobalDataTypeEnum.totalClaims:
                    totalClaims = g.value;
                    break;
            }
        });
        return {
            totalRaised,
            totalDistributed,
            totalBeneficiaries,
            totalClaims,
        }
    }
}