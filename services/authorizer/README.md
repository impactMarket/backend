## Lambda Authorizer

> The purpose of the lambda "authorizer" is to validate a JSON Web Token (JWT) and ensure the authenticity and authorization of requests received at our API Gateway. The requested JWT is not the same as the one used by the general API users and must be created using a specific "secret key".
This lambda will be triggered for each request made to our API Gateway ( eg. to get images) and to be successful you just need to send the JWT token in the "Authorization" header of the request.

### Configure Serverless Framework
```
npm install -g serverless

serverless config credentials \
    --provider aws \
    --key AWS_ACCESS_KEY_ID \
    --secret AWS_SECRET_ACCESS_KEY
```

### Invoke Local
```
sls invoke local -f function-name
```

### Deploy lambda
```
cd services/authorizer
sls deploy --stage STAGE --aws-profile PROFILE
```