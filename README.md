install dependencies
```
npm ci
```

compile server
```
npx tsc -p tsconfig.json
```

compile client
```
tsc -p tsconfig.browser.json
```
copy resources and other non typescript files and
```
npm run copy-files
```
clear compiled files
```
npm run prebuild
```

# TODO: 
* compile server 
* compile client
* complete typescript, remove all any and other hacks
* complete migration from sockets to webrtc

run server
```
node dist.server/server/index.js
```

run client
```
cd dist/src/
```

```
node start-web.js
```
