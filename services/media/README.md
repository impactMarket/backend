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

Invoke Local
```
sls invoke local -f function-name
```

Deploy lambda
```
cd services/media
sls deploy --stage STAGE
```