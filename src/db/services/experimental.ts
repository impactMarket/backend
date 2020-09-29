// import IPFS from 'ipfs';
// import OrbitDB from 'orbit-db';

// let db;
// const initOrbitDb = async () => {
//     const ipfs = await IPFS.create({
//         repo: './path-for-js-ipfs-repo',
//     });
//     const orbitdb = await OrbitDB.createInstance(ipfs);
//     // Create / Open a database
//     db = await orbitdb.docs('impactmarket.transactions');
//     await db.load();
//     console.log(db.id);
// };
// initOrbitDb();

export default class ExperimentalService {
    public static async addTransaction(params: any): Promise<string> {
        const hash = ''; //await db.put(params);
        return hash;
    }

    public static get(): any[] {
        const result = ['']; //db.get('');
        return result
    }
}