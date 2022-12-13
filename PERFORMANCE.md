<div align="center">
    <img src="logo.png">
</div>

> Decentralized Poverty Alleviation Protocol. impactMarket enables any vulnerable community to implement poverty alleviation mechanisms, like Unconditional Basic Income.

Preliminary results of performance tests.

## [Clinic.js](https://clinicjs.org/)

Clinic.js offers 3 tools to help with performance analysis: Doctor, Bubbleprof, and Flame.

### Installation
```
npm install -g 
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


