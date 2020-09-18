import IPFS from 'ipfs';
import OrbitDB from 'orbit-db';
import { ExperimentalDbGlobalData, IGlobalStatus } from '../../types';


let dbGlobalCounter = [
    ExperimentalDbGlobalData.totalRaised,
    ExperimentalDbGlobalData.totalDistributed,
    ExperimentalDbGlobalData.totalBeneficiaries,
    ExperimentalDbGlobalData.totalClaims,
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
            totalRaised: ExperimentalService.counterGet(ExperimentalDbGlobalData.totalRaised),
            totalDistributed: ExperimentalService.counterGet(ExperimentalDbGlobalData.totalDistributed),
            totalBeneficiaries: ExperimentalService.counterGet(ExperimentalDbGlobalData.totalBeneficiaries),
            totalClaims: ExperimentalService.counterGet(ExperimentalDbGlobalData.totalClaims),
        };
    }
}