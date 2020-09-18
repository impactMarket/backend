const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')


let db;
const initOrbitDb = async () => {
    const ipfs = await IPFS.create({ repo: "./path-for-js-ipfs-repo" });
    const orbitdb = await OrbitDB.createInstance(ipfs);
    // Create / Open a database
    db = await orbitdb.counter("impactmarket.global.totalraised");
    await db.load();
};
initOrbitDb();

export default class ExperimentalService {
    public static async add(amount: number): Promise<void> {
        await db.inc(amount);
    }
    public static async get(): Promise<number> {
        return db.value;
    }
}