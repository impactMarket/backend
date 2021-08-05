import { SinonSpy, SinonStub } from 'sinon';

export async function waitForStubCall(
    stub: SinonStub<any, any> | SinonSpy<any, any>,
    callNumber: number
) {
    return new Promise((resolve) => {
        const validationInterval = setInterval(() => {
            if (stub.callCount >= callNumber) {
                resolve('');
                clearInterval(validationInterval);
            }
        }, 1000);
    });
}
