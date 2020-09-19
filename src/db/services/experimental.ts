import IPFS from 'ipfs';
import OrbitDB from 'orbit-db';
import { GlobalDataTypeEnum, IGlobalStatus } from '../../types';


let dbGlobalCounter = [
    GlobalDataTypeEnum.totalRaised,
    GlobalDataTypeEnum.totalDistributed,
    GlobalDataTypeEnum.totalBeneficiaries,
    GlobalDataTypeEnum.totalClaims,
]
let db = {};
const initOrbitDb = async () => {
    const ipfs = await IPFS.create({ repo: './path-for-js-ipfs-repo' });
    const orbitdb = await OrbitDB.createInstance(ipfs);
    // Create / Open a database
    dbGlobalCounter.forEach((dbName) => {
        orbitdb.counter(`impactmarket.global.${dbName}`).then((dbInstance) => {
            dbInstance.load().then(() => db[dbName] = dbInstance);
        });
    });
};
initOrbitDb();

export default class ExperimentalService {
    public static async counterAdd(type: string, amount: number): Promise<void> {
        await db[type].inc(amount);
    }

    public static counterGet(type: string): number {
        return db[type].value;
    }

    public static get(): IGlobalStatus {
        return {
            totalRaised: ExperimentalService.counterGet(GlobalDataTypeEnum.totalRaised).toString(),
            totalDistributed: ExperimentalService.counterGet(GlobalDataTypeEnum.totalDistributed).toString(),
            totalBeneficiaries: ExperimentalService.counterGet(GlobalDataTypeEnum.totalBeneficiaries).toString(),
            totalClaims: ExperimentalService.counterGet(GlobalDataTypeEnum.totalClaims).toString(),
        };
    }
}