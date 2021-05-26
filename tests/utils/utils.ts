export function randomTx() {
    var result: string[] = [];
    var characters = 'ABCDEFabcdef0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 64; i++) {
        result.push(
            characters.charAt(Math.floor(Math.random() * charactersLength))
        );
    }
    return '0x' + result.join('');
}
