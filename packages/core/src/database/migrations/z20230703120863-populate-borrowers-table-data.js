'use strict';

const ethers = require('ethers');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        let borrowers = [];
        let manager = '';
        if (process.env.API_ENVIRONMENT === 'production') {
            borrowers = [
                {
                    id: '0x01039ec31a223e7e39540277a49f97c607bbe2dd'
                },
                {
                    id: '0x01730f5bbce32b48d34ddcca5e3558f610359866'
                },
                {
                    id: '0x01acd6ad92c57b6390ddfe662b834d26979dad1d'
                },
                {
                    id: '0x025d1ffc23cde9eb00a1b61d53ebcdc78e9637d5'
                },
                {
                    id: '0x02e272816cd5c8aadb533b1251ee0b2b4607aba2'
                },
                {
                    id: '0x0533a1b83f459f09172c058e399fe32e5ad6394e'
                },
                {
                    id: '0x05562bff49f8c70bacc42bab8e543e9d7be942f7'
                },
                {
                    id: '0x0591890994aaa1225bd496a1cdc172d5ce9e0f7c'
                },
                {
                    id: '0x05dd7e68c03862ae8a05437ff4767801b1c52c10'
                },
                {
                    id: '0x06c3cef6ac0706e8ff665ddc9fc95caf15e83d78'
                },
                {
                    id: '0x07f2d76603076cfa935590ba933ae593b4ad016b'
                },
                {
                    id: '0x08b6dca0dd21cee087c88cb14a28e4aba7b4d875'
                },
                {
                    id: '0x08d484a8b354b9d6164296846d8c79e6d91cdba7'
                },
                {
                    id: '0x0901186958378c29211b4ab74108d65bd7351ddb'
                },
                {
                    id: '0x091033adc7fbdd4a1109c938585bfb54d0fcf051'
                },
                {
                    id: '0x0a49968bf14000d8c9b35acd417dc6d312f1f252'
                },
                {
                    id: '0x0a7a4f6c07a2fa1b8d19f1212a0e594fcb822e24'
                },
                {
                    id: '0x0cda5a6bcb9b213ce92a756391cfa892e963311f'
                },
                {
                    id: '0x10b4a5462c8e73fad8b74c5d0e25608508a2dc68'
                },
                {
                    id: '0x120c25c7a0fbc0652c0e237ea90d585ac0f46cfe'
                },
                {
                    id: '0x13ae92b3ff0fbe31b24f633ab216342c03c10dfc'
                },
                {
                    id: '0x177b5dbcb1ca7a115d295b03247cee0c10f14d53'
                },
                {
                    id: '0x18c2713bc7f740d289a1ffa9ec7e705cc739fd0e'
                },
                {
                    id: '0x192eef17e0412966ddb675d03455633c94a3898b'
                },
                {
                    id: '0x1d9d13c0232832aa015feaededd3863ad06223b6'
                },
                {
                    id: '0x1f236333a0a561522d9de9daddcb143963a5d141'
                },
                {
                    id: '0x203176c2a1bd6f611631764881bc9489d52ac0bd'
                },
                {
                    id: '0x214222984db4893279f82ec722832c1c7bd352a1'
                },
                {
                    id: '0x22c1bc631f6adbdba181fafdbbfcb3ec497dc6f5'
                },
                {
                    id: '0x258598c42ecaafb3ea12a62d5721ba4b2d15caff'
                },
                {
                    id: '0x2a512e2719eba2de2bd87a3126f2e935fb5cd794'
                },
                {
                    id: '0x2a636aeb9a8384639a7b6b8ffa56a26a41502c51'
                },
                {
                    id: '0x2a790f090801fa490142221c16b316403083d8ed'
                },
                {
                    id: '0x2baab2958098c080164d8cbb9cc364aff3797005'
                },
                {
                    id: '0x2bbe21aa16458e353cc601d97ca00606f597b03e'
                },
                {
                    id: '0x2eaec7447c6242691562bdfbb544b9dcc443d2a3'
                },
                {
                    id: '0x2ee7ba539e8de86b2bd73717aeab631ab8a97490'
                },
                {
                    id: '0x2f3cf45bc698929f09fe20c2f3a3dd4b2e2bf801'
                },
                {
                    id: '0x3175fe5b25027dd68fcff1bed5efd2715f3cf8d6'
                },
                {
                    id: '0x3226cda34e59f116e8cd52e25769f128798058e3'
                },
                {
                    id: '0x32a398bbb24e59b05cbef5e9cbe3b93987b508e3'
                },
                {
                    id: '0x34526740b4b978aa0a6d11deb7036143bf4beafa'
                },
                {
                    id: '0x35f7b095451ba3947c2873b2649a84daf2c5ed7c'
                },
                {
                    id: '0x3632c5b4cc9edf1ae9414db71004615be7037ba0'
                },
                {
                    id: '0x3644a628796a3f55ec8ed029ce2721786e58314a'
                },
                {
                    id: '0x3723afb28b25a8a2d3ea5157c40d39502855df41'
                },
                {
                    id: '0x37ea151e580a78f322e9c24f65c49aa853ecff80'
                },
                {
                    id: '0x3d235b707936e34ea46646295f02a1601f8d5ae0'
                },
                {
                    id: '0x3d5540cbdd374a40646dff3e4d829eaa93b6b7aa'
                },
                {
                    id: '0x3ea2eb7128c91b976994ce155019f6f26064e479'
                },
                {
                    id: '0x43d51bcd4dc86e8d8e7ca1e0bd1b2204f143ec76'
                },
                {
                    id: '0x45266f9975416c3862ba266eeeb16beac0240c34'
                },
                {
                    id: '0x45c5e5ec249d209423a8bd6a58b2a71c56d03dae'
                },
                {
                    id: '0x47228bd4aa9c8a9108d895d7f4086216ab995365'
                },
                {
                    id: '0x4a5930301968bd91e841c412ea552a48b67e4803'
                },
                {
                    id: '0x4b240c005dc16156e78fce87cb5bce5e3c0e4831'
                },
                {
                    id: '0x4d378f0d993bee21abc14b842b8d751bfcb22643'
                },
                {
                    id: '0x4d7c62fff684791c166c822452ca08af4dbd3956'
                },
                {
                    id: '0x4d91a59e01ce651341a605cb1fb5e00302f7becc'
                },
                {
                    id: '0x4d97e80e7cc5ef0b0ca671b664fd3e8ce428432d'
                },
                {
                    id: '0x4e14d8665663aa2703842145d94866c8212c5dff'
                },
                {
                    id: '0x4e36e59adae65779a1a51fddf9fef2924681dd29'
                },
                {
                    id: '0x4ec12e4f5b6434db41d84a162f60b120cb68286a'
                },
                {
                    id: '0x50a4274443229d3991e17f9d11aa8f9839a18983'
                },
                {
                    id: '0x510882cf27265fb9a767cd975b93418548fb7f7a'
                },
                {
                    id: '0x517b6aebce77267befb62066cd82ede078639518'
                },
                {
                    id: '0x5189da9dec0ab0ea524b22c1592bd68fe7505759'
                },
                {
                    id: '0x56edef153223e8d71a16d37948722622be93c1a8'
                },
                {
                    id: '0x5a660ad283ba8dd22a114dfe5eab1afa2bbefe42'
                },
                {
                    id: '0x5b20e355c220c1c3c168d81ee68e031ae7000c8c'
                },
                {
                    id: '0x5b97ac28feaeb384e4ce94094068fa506cb01ba4'
                },
                {
                    id: '0x5d5d9bdf784cbcb866b5d25fd2980c8d6b3a1d8f'
                },
                {
                    id: '0x5deff913912f7c61eb8dd4dc90f722999b142579'
                },
                {
                    id: '0x5e6d0ac9ef5208e2af160e9eb707ad5864058d38'
                },
                {
                    id: '0x5ff68b757bdb3f8f117b3ad1e620de297e01805f'
                },
                {
                    id: '0x6004feefad2c34445963058e949e5db6de68d4fe'
                },
                {
                    id: '0x61cd52d3bd30de41c589f4ebc779232aabfa886e'
                },
                {
                    id: '0x64e9e29ef256003439cb251db0cfd82c6a7c36d8'
                },
                {
                    id: '0x652dfcc5c5f3eebbd982849c9f46bb0c55f2ed98'
                },
                {
                    id: '0x6663b467d0ea460cec33d7ab9203407910290570'
                },
                {
                    id: '0x688e1dd872735b203b285afaff48c3e5a425f77b'
                },
                {
                    id: '0x6ace28ee04a0b063114ff19bdcbc9e9c27488594'
                },
                {
                    id: '0x6b8be9d2a60f3b00b21effd0424442fc80ee7013'
                },
                {
                    id: '0x6bdaea27a2c80b7cb7a4bf31e3f7bf8eb580b5f3'
                },
                {
                    id: '0x6cf06f0df298e0a61cdc5023c7c9d286f9e26967'
                },
                {
                    id: '0x702f643dddb97f59d936340e97a351cb2549f25e'
                },
                {
                    id: '0x726a3e0510a4552cd766b5ef463ff1a43465696f'
                },
                {
                    id: '0x72c8a50b1c6a55e162c39dad241a83c87cba497c'
                },
                {
                    id: '0x72d3a3b9fb8f67a284e71d6b639a6f9f7ddb13d3'
                },
                {
                    id: '0x72e916ccf2d2d81c7d8ca23e04df7eeaab74b8f4'
                },
                {
                    id: '0x7491d16e4d0c9bdd4e15a4eac815072617a748f8'
                },
                {
                    id: '0x74b75936d64ff3dfdaef85a9d666f85d93c02890'
                },
                {
                    id: '0x77fd279c802251a53c45d5856c0b7c8b662f8ca9'
                },
                {
                    id: '0x7a7e60bd6f13f1858fc91037492a616ff57570d6'
                },
                {
                    id: '0x7c09f0e414cfadc0972ada1187a4c8dd561f6398'
                },
                {
                    id: '0x839714b9215f2f21ca8986ebe972d8b39e041011'
                },
                {
                    id: '0x83c520e4ea659cefb89ace0c5dc13a3205a83c6c'
                },
                {
                    id: '0x8472d6831cffc90fb06fdbbfeb9e7f76577eee56'
                },
                {
                    id: '0x8671cd70540e25dbffa062fd5f75e04540c380b4'
                },
                {
                    id: '0x890f9734e0535f0014a86f38c5ee49f781707546'
                },
                {
                    id: '0x8da530fe4f6aa9556f77737b7ae6c97d806403c5'
                },
                {
                    id: '0x8e4b579ac99e8dee8a7fcbaba2aad538562d3765'
                },
                {
                    id: '0x8e7621839b5b0d9536c32588b712f1fa3a3b7f35'
                },
                {
                    id: '0x902baf29ddd24a8d4424dfa0b4e4b1789a7b8f8f'
                },
                {
                    id: '0x904f6d8149bf3d6afb8b53d3a54a772060608a39'
                },
                {
                    id: '0x926583fc5dd8567ed5a0e1b2db597a5c38a0a219'
                },
                {
                    id: '0x9385385c4727bec12c879ea88073bced4679f12d'
                },
                {
                    id: '0x94822237dcf2b10a384bd46186d2fd4a9d2d1944'
                },
                {
                    id: '0x95002c340c4df33301c26ab3526db5cae41aa194'
                },
                {
                    id: '0x95a2f66c7c2a3b2787d5459b9f2c533a05b79637'
                },
                {
                    id: '0x95c5736b0250033ec89580708b8f3471e57087c2'
                },
                {
                    id: '0x994aee1c52bfdaedcf4c6d9fc63371588a09b035'
                },
                {
                    id: '0x99e404752900d9d92a7b8d24849a84be0e49adf9'
                },
                {
                    id: '0x9cf0261b0a970e6367b63a0fb67f1a17424318fd'
                },
                {
                    id: '0x9ee76e791c9dd5d0b4b3cb973cec773b8c00acbe'
                },
                {
                    id: '0x9fc2728fbbaacb4ec4f1b26a75d455a41dfec299'
                },
                {
                    id: '0xa122e3f94c4f23c63e87512a74e0b187a73faa34'
                },
                {
                    id: '0xa1a870be0b697a9d25afd6a080a3da5b0a1c833c'
                },
                {
                    id: '0xa1d2cf543497634cec870de69e526b02b13b2afc'
                },
                {
                    id: '0xa2af19a56ccfb953ec183b9d0d7d6930d9e8c9a3'
                },
                {
                    id: '0xa3ce0d22d53f86fc5488d5122c6be12f41a8ba8e'
                },
                {
                    id: '0xa691233eb7b537cb1c70ee4eb60f807a9db0904f'
                },
                {
                    id: '0xa91a0e00e7704de690c06b17d69ebff36b45e50e'
                },
                {
                    id: '0xa9a143d97276e5cb4885f27f0c2ec267fe485680'
                },
                {
                    id: '0xab047fa2b2f2065400534531533b813408a2af34'
                },
                {
                    id: '0xab9350caa014c4b24cb3ffee0490cd5fc7549d93'
                },
                {
                    id: '0xaceac95e05e912c305aee9fa2118e3b60fe14a3e'
                },
                {
                    id: '0xade0d99d01b3b640a789550b9d7e5e2007d2bfd8'
                },
                {
                    id: '0xae211a5b05991ff98eb76858563b732cf429c3a1'
                },
                {
                    id: '0xae85d7b8384a1ce067ec0f76ddc6abc885d7ae75'
                },
                {
                    id: '0xaf2beef42d6c33379e1b90214f1fc26900c9263c'
                },
                {
                    id: '0xb2244dbf9879ca6079f51dbac6735e0b7d32ec7a'
                },
                {
                    id: '0xb36cc1509db0672a76510f40033e2390a8d24acd'
                },
                {
                    id: '0xb4a60beb2282aba9d4ddb86379f456c1938b0494'
                },
                {
                    id: '0xb581bc116106b52ade5b156ae8e17152a787216c'
                },
                {
                    id: '0xb607c5b256f3445b277c1769e4f4959157f0ce7a'
                },
                {
                    id: '0xb861bef577ebb1f2b9f905a074a025ae8b6c28c8'
                },
                {
                    id: '0xb95cdd42ff828dd7490763023312066e904d4802'
                },
                {
                    id: '0xbb30556fca674f17692b3a5f3226eadf61e253b5'
                },
                {
                    id: '0xc04da623bf0ec06bd7e893d1fb44c18487d94b55'
                },
                {
                    id: '0xc155c28404e8dd74b977eb42643e56bd3dd03e7f'
                },
                {
                    id: '0xc4824bd16cb878cccf9c796e5055fa6b75ac4ea7'
                },
                {
                    id: '0xc86942010916c962ca5f2aa81f225e468858cc5d'
                },
                {
                    id: '0xc8e03215cff257ac142836a6ea5dbc24f1bc7bb9'
                },
                {
                    id: '0xca291dd77ce5c3847f0ed0d09d8c89b1d8d14ba4'
                },
                {
                    id: '0xcc5b69a2a128e06bf4bc3eb96714ca29217de584'
                },
                {
                    id: '0xcdc8c48473ef9df614b42e80ff1c3148ecaf911d'
                },
                {
                    id: '0xcee57079450f3a92386da84418bd2d2b3629d79a'
                },
                {
                    id: '0xcf3cabe60c50a2c853e9f2cc5986bffa454c79a4'
                },
                {
                    id: '0xcf9866297a2583c44b21636a323bf5074addec33'
                },
                {
                    id: '0xcff4c23d37c20fdceb629e94ecd276a7f5505f3c'
                },
                {
                    id: '0xd57e2b216a3fd36d28b99ec3c81592de8df0e52e'
                },
                {
                    id: '0xd61fdc9f4d0cd29d5a92061ceaf10c8a410c6ff3'
                },
                {
                    id: '0xd6530b16aa97a886f3379cab08b74a30ce1c30ab'
                },
                {
                    id: '0xd872b2e5280e3e053412ffdff5cd3dfefdc64f00'
                },
                {
                    id: '0xd930342aafe4544618a1e340aa3edb4204ac16f6'
                },
                {
                    id: '0xd93db2565faebcd98f7e51c9bdd078cd31264205'
                },
                {
                    id: '0xda36fcda8cddbe56dbc48cb09996dc9b1288e4fa'
                },
                {
                    id: '0xdb3be3835e924564007ce6e265045d81b68ebc32'
                },
                {
                    id: '0xdc8a30166fbcfc651c5332a81e3cc65b221912ed'
                },
                {
                    id: '0xdcae1cf9a41d10cb3e56fa52cdcb6c47cdd41a10'
                },
                {
                    id: '0xddd6ed3138dbca997745bf42ed376c10595e5561'
                },
                {
                    id: '0xde38b31784d03ccc81d38a0582274288b2dc12cc'
                },
                {
                    id: '0xdedfe49abd6948009103d2825b5e0f47bc0ef0c0'
                },
                {
                    id: '0xdf269bf4e422f905dffb48fe27ca3bafe43a33de'
                },
                {
                    id: '0xe130a52bcdaeb5ab1502309b94cd0261306aeecf'
                },
                {
                    id: '0xe236b3dfb5ebd9bee28d758b67126d99527ec633'
                },
                {
                    id: '0xe91c2e860d169fc5715b434ff100db5af0b16f16'
                },
                {
                    id: '0xeca57fcb575c1fa20b787338e19862ea42e50c6c'
                },
                {
                    id: '0xefa1567e84f429b28ad856e3baf68fa5242af343'
                },
                {
                    id: '0xf009920757dfd4b4fd86eef4ca6980909881b891'
                },
                {
                    id: '0xf12c648ca16ec3a2bc217c9e2ac13c598f0c927b'
                },
                {
                    id: '0xf464727da936c9c4d4ac19ca7d0b56285f602855'
                },
                {
                    id: '0xf6674df18d72ace0745713ed0b22580a1840330a'
                },
                {
                    id: '0xfc3f810aa071c0dc3eead3f3de870c98528572e1'
                },
                {
                    id: '0xfe81272363a26683be019ba7bb4322ad01a4ebeb'
                },
                {
                    id: '0xfef15dbe7e16902a9ccc9e670e5f5ee80c8f9915'
                }
            ];
            manager = '0xa035E6173A78f38EC444AE23617026f5D562AbFC';
        } else {
            borrowers = [
                {
                    id: '0x07a3f76f2b92af8d8f79a41b45739c7718ffc3c7'
                },
                {
                    id: '0x1732aead09143608dc56ae9173bdbdb7468cff6e'
                },
                {
                    id: '0x185f2b301231fab7c83893e449a56f79905d39ff'
                },
                {
                    id: '0x19fa2976a8d55a8d733da471d6dcc1a308572b72'
                },
                {
                    id: '0x1cee59c0e744478817959d9d0c6801ca86b664f0'
                },
                {
                    id: '0x21ed3f458bfa78c7dde91dc76c916dbc61cfd735'
                },
                {
                    id: '0x266490c833928159f3803e7e4f17dec3585e570f'
                },
                {
                    id: '0x2745b7fda1dd04a0f05b42b1e85ec3ad04d607f3'
                },
                {
                    id: '0x286cd9f6e8ef062a29b71ded2e7b086c27de9618'
                },
                {
                    id: '0x2abae50300759c283af0ae0322891e18ab688dec'
                },
                {
                    id: '0x33b650c44f6af08adbfd0405383e87977112d71a'
                },
                {
                    id: '0x409e34321f4770621f4dee1d9f17a775c5a318c0'
                },
                {
                    id: '0x43d22ea4623b97c41372b29345024bd9c535f7ee'
                },
                {
                    id: '0x5bde6f9a08a0a929fcb043341b1d8b7da2ac692e'
                },
                {
                    id: '0x5c7f26811aab19c668621b1239bb92c6480d8c37'
                },
                {
                    id: '0x707c4bf95e0abf1061874ae3a83cff8fc7b796d9'
                },
                {
                    id: '0x7867b012c2afa1ac075252a85b42e2345ae109db'
                },
                {
                    id: '0x7d46650fc90daf690d92d9fe89cdd918bfe99e72'
                },
                {
                    id: '0x7da11ef9a7d4900704682bea196cac1a9e49e4d6'
                },
                {
                    id: '0x829be7dfa214ca19dd8a135ce9a161e4d52120d4'
                },
                {
                    id: '0x8fbe40e856aa31e14840a2eb8d6ee9d0ea6d8f6e'
                },
                {
                    id: '0x90b14926d88ad51c871f6b08d98e7157e40233be'
                },
                {
                    id: '0x9c2f3d36e15e5b40f08640a782435f15266aeb96'
                },
                {
                    id: '0xaad66c1ec0d0b6e603a675da2a4166f5e211c299'
                },
                {
                    id: '0xad0541f0889736b2840fc0b3301bb68d043f1505'
                },
                {
                    id: '0xb5acfeab8560c3851946b8e6923f241f9517bb78'
                },
                {
                    id: '0xbcbeb4e2aa1b13b1de5054ee38e502432c22baca'
                },
                {
                    id: '0xbfa720bda56a52832247896812b40d6b92633cac'
                },
                {
                    id: '0xcae94bc39045f9fa3bb7ffab28299ab9502fcd4e'
                },
                {
                    id: '0xcbcbf1084a8c43e23a7e9f57327a97c77343ebb1'
                }
            ];
            manager = '0x4BacE87B3fdAF29E1e84164E87a84CDA0B42608a';
        }

        const User = await queryInterface.sequelize.define(
            'app_user',
            {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                address: {
                    type: Sequelize.STRING(44),
                    allowNull: false,
                    unique: true
                },
                avatarMediaPath: {
                    type: Sequelize.STRING(44),
                    allowNull: true
                },
                firstName: {
                    type: Sequelize.STRING(128)
                },
                lastName: {
                    type: Sequelize.STRING(128)
                },
                language: {
                    type: Sequelize.STRING(8),
                    defaultValue: 'en',
                    allowNull: false
                },
                currency: {
                    type: Sequelize.STRING(4),
                    defaultValue: 'USD'
                },
                walletPNT: {
                    type: Sequelize.STRING(256)
                },
                appPNT: {
                    type: Sequelize.STRING(256)
                },
                gender: {
                    type: Sequelize.STRING(2)
                },
                year: {
                    type: Sequelize.INTEGER
                },
                children: {
                    type: Sequelize.INTEGER
                },
                lastLogin: {
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.fn('now'),
                    allowNull: false
                },
                active: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
                    allowNull: false
                },
                email: {
                    type: Sequelize.STRING(64),
                    allowNull: true
                },
                emailValidated: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false
                },
                bio: {
                    type: Sequelize.STRING(512),
                    allowNull: true
                },
                country: {
                    type: Sequelize.STRING(64),
                    allowNull: true
                },
                phone: {
                    type: Sequelize.STRING(64),
                    allowNull: true
                },
                phoneValidated: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false
                },
                readBeneficiaryRules: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false
                },
                readManagerRules: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false
                },
                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE
                },
                deletedAt: {
                    allowNull: true,
                    type: Sequelize.DATE
                }
            },
            {
                tableName: 'app_user',
                sequelize: queryInterface.sequelize // this bit is important
            }
        );

        const MicroCreditBorrowers = await queryInterface.sequelize.define(
            'microcredit_borrowers',
            {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.INTEGER
                },
                userId: {
                    allowNull: false,
                    type: Sequelize.INTEGER
                },
                performance: {
                    allowNull: false,
                    type: Sequelize.INTEGER
                },
                lastNotificationRepayment: {
                    allowNull: true,
                    type: Sequelize.DATE
                },
                manager: {
                    allowNull: false,
                    type: Sequelize.STRING(48)
                }
            },
            {
                tableName: 'microcredit_borrowers',
                sequelize: queryInterface.sequelize, // this bit is important
                timestamps: false
            }
        );

        const users = await User.findAll({
            attributes: ['id'],
            where: {
                address: {
                    [Sequelize.Op.in]: borrowers.map(borrower => ethers.utils.getAddress(borrower.id))
                }
            }
        });

        await MicroCreditBorrowers.bulkCreate(users.map(user => ({ userId: user.id, performance: 100, manager })));
    },
    async down(queryInterface, Sequelize) {}
};
