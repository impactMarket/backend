Configure Serverless Framework
```
npm install -g serverless

serverless config credentials \
    --provider aws \
    --key AWS_ACCESS_KEY_ID \
    --secret AWS_SECRET_ACCESS_KEY
```

Build `core`
```
cd packages/core
yarn build
```

Deploy lambda
```
cd services/media
sls deploy
```