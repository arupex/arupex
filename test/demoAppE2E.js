describe('Demo App', () => {

    let spawn = require('child_process').spawnSync;
    let assert = require('assert');

    it('check result', () => {
        let result = spawn('node', ['app.js'], { cwd : `${__dirname}/../demo/`}).stdout;

        let data = JSON.parse(result);

        let body = JSON.parse(data.body);
        assert.deepEqual(body.code, 200);
        assert.deepEqual(typeof body.data, 'object');
        assert.deepEqual(body.message, 'ok')
    });

    it('mock check result', () => {
        let spawnResult = spawn('node', ['app.js'], {
            cwd : `${__dirname}/../demo/`,
            env : Object.assign(process.env, { MOCK : true })
        });

        let result = spawnResult.stdout.toString();

        result = result.replace(/^.*mocks are enabled for this session/, '');
        if(!result){
            console.error(spawnResult.stderr);
        }

        let data = JSON.parse(result);

        let body = JSON.parse(data.body);
        assert.deepEqual(body.code, 200);
        assert.deepEqual(typeof body.data, 'object');
        assert.deepEqual(body.data, { MOCK : true });
        assert.deepEqual(body.message, 'ok')
    });

});