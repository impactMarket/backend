import { IGlobalStatus } from "../../types";
import TransactionsService from "./transactions";


export default class GlobalStatusService {
    public static async get(): Promise<IGlobalStatus> {
        return await TransactionsService.getGlobalStatus();
    }
}