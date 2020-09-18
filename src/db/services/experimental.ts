import IPFS from 'ipfs';
import OrbitDB from 'orbit-db';


let dbGlobalCounter = [
    'totalraised',
    'totaldistributed',
    'totalbeneficiaries',
    'totalclaims',
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
    public static async counterGet(type: string): Promise<number> {
        return db[type].value;
    }
}