import { SinonStub } from 'sinon';

export async function waitForStubCall(stub: SinonStub<any, any>, callNumber: number) {
    return new Promise((resolve) => {
        const validationInterval = setInterval(() => {
            if (stub.callCount >= callNumber) {
                resolve('');
                clearInterval(validationInterval);
            }
        }, 1000)
    });
}