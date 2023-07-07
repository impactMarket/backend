import { SinonSpy, SinonStub } from 'sinon';
import crypto from 'crypto';

export async function waitForStubCall(stub: SinonStub<any, any> | SinonSpy<any, any>, callNumber: number) {
    return new Promise(resolve => {
        const validationInterval = setInterval(() => {
            if (stub.callCount >= callNumber) {
                resolve('');
                clearInterval(validationInterval);
            }
        }, 1000);
    });
}

export function randomTx() {
    const result: string[] = [];
    const characters = 'ABCDEFabcdef0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 64; i++) {
        result.push(characters.charAt(crypto.randomInt(charactersLength)));
    }
    return '0x' + result.join('');
}

export function jumpToTomorrowMidnight() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 1);
    return tomorrow;
}
