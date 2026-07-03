const cp = require('child_process');
const path = require('path');

const startServerPath = path.resolve('node_modules/next/dist/server/lib/start-server.js');
console.log("Forking", startServerPath);

const child = cp.fork(startServerPath, {
    stdio: 'pipe',
    env: {
        ...process.env,
        __NEXT_DEV_SERVER: '1',
        NEXT_PRIVATE_WORKER: '1',
    }
});

child.stdout.on('data', (data) => {
    console.log('[CHILD STDOUT]', data.toString());
});

child.stderr.on('data', (data) => {
    console.error('[CHILD STDERR]', data.toString());
});

child.on('message', (msg) => {
    console.log('[CHILD MSG]', msg);
    if (msg && msg.nextWorkerReady) {
        child.send({
            nextWorkerOptions: {
                dir: "/Users/manu/Desktop/MAPFRE/frontend",
                port: 3333,
                allowRetry: true,
                isDev: true,
                hostname: "0.0.0.0"
            }
        });
    }
});

child.on('exit', (code, signal) => {
    console.log('[CHILD EXIT]', 'code:', code, 'signal:', signal);
});
