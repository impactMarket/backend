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

Invoke Local (to run locally)
```
sls invoke local -f function-name
```

Deploy lambda
```
cd services/update-borrowers
sls deploy --stage STAGE --aws-profile PROFILE
```

If you get an "heap out of memory" on the previous command, append `NODE_OPTIONS=--max_old_space_size=4096` to it at the beginning.