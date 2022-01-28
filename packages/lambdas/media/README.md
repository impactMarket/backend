```
yarn build
-- move .js files in /build to root folder
zip -r function.zip .
aws lambda update-function-code --function-name newImageUploaded --zip-file fileb://function.zip
```