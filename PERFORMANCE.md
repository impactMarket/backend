<div align="center">
    <img src="logo.png">
</div>

> impactMarket enables access to inclusive financial solutions, including Unconditional Basic Income programs to support and empower vulnerable communities. Donate now and join our mission of promoting financial inclusion.

# Performance tests
Load tests

## climem & autocannon

This are the tests currently being used. Focused on memory usage.

To test you first need to run the API with `yarn start:local` and then start the *climem* with `yarn climem`.
Then use *autocannon* to do the requests. There is an example at `yarn test:load`. See *autocannon* docs for more.

To learn more about both tools see [this](https://www.youtube.com/watch?v=2u9KRSMpTQQ) and [this](https://www.youtube.com/watch?v=PBp-S5HxR8A)

## [Clinic.js](https://clinicjs.org/)

Clinic.js offers 3 tools to help with performance analysis: Doctor, Bubbleprof, and Flame.

This tests are still under research.

### Installation
```
npm install -g clinic
```

### Clinic.js Doctor

Diagnose performance issues in your Node.js applications.
Run (should point to a js file):
```
clinic doctor -- node ./packages/api/dist/app.js 
 ```
 
While running it's possible to do requests to the local endpoints and the Doctor will analyze them.
After doing all the requests wanted. Press CTRL+C to shut down the API and start the Doctor report.
 
 It is to possible automate the requests using `autocannon`.
 For that, run:
 ```
 clinic doctor --autocannon [ /api/v2/communities ] -- node ./packages/api/dist/app.js 
 ```
 
 ### Clinic.js Bubbleprof
Creates bubble graphs.

```
 clinic bubbleprof --autocannon [ /api/v2/communities ] -- node ./packages/api/dist/app.js 
```

 ### Clinic.js Flame
Creates flamegraphs.

```
 clinic flame --autocannon [ /api/v2/communities ] -- node ./packages/api/dist/app.js 
```


