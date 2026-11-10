const { app, BrowserWindow, ipcMain } = require('electron');
const { writeFile } = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
app.whenReady().then(async () => {
    const { navDataService } = await import(pathToFileURL(path.resolve('dist/navdata/registry.js')));
    const results = [{
        id: 'fenix', name: 'Fenix', location: 'C:\\Test\\Fenix', status: 'ready', message: 'Found 3 database files.',
        files: ['active', 'default', 'standby'].map(name => ({
            name: `navdata-${name}.db3`, path: `C:\\Test\\Fenix\\navdata-${name}.db3`, size: 290000000, modified: new Date().toISOString(),
            packages: [{ packageId: 'gibraltar', name: 'Gibraltar RNAV approaches', version: '1.0.0', state: 'missing', message: '71 required records are missing. Matching records will be reused.' }]
        }))
    }, {
        id: 'fslabs', name: 'FSLabs', location: 'C:\\Test\\FSLabs', status: 'ready', message: 'Found 1 database file.',
        files: [{ name: 'navdata.rom', path: 'C:\\Test\\FSLabs\\navdata.rom', size: 100, modified: new Date().toISOString(),
            packages: [{packageId: 'gibraltar', name: 'Gibraltar RNAV approaches', version: '1.0.0', state: 'missing', message: '67 required records are missing.'}] }]
    }];
    const called = new Set();
    ipcMain.handle('navdata:packages', () => navDataService.packages.map(({id,name,version,description})=>({id,name,version,description})));
    ipcMain.handle('navdata:scan', () => results);
    // Exercise the renderer action without modifying an installed database.
    ipcMain.handle('navdata:install', (_event, request) => {
        assert.ok(['fenix','fslabs'].includes(request.platformId));
        assert.equal(request.packageId,'gibraltar');
        const file=results.find(result=>result.id===request.platformId).files[0];
        assert.equal(request.databasePath,file.path);
        called.add(request.platformId);
        file.packages[0].state='installed';
        file.packages[0].message='UI test: all required records installed.';
        return {success:true,message:'UI test insertion completed.'};
    });
    const win = new BrowserWindow({show:false,width:1200,height:900,webPreferences:{preload:path.resolve('dist/preload.cjs'),contextIsolation:true,nodeIntegration:false}});
    await win.loadFile(path.resolve('src/index.html'));
    await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{
      const start=Date.now(); const timer=setInterval(()=>{
        if(document.querySelectorAll('#files tr').length){clearInterval(timer);resolve();}
        else if(Date.now()-start>10000){clearInterval(timer);reject(new Error('UI did not load'));}
      },50);
    })`);
    const ui = await win.webContents.executeJavaScript(`({title:document.title,rows:document.querySelectorAll('#files tr').length,buttons:document.querySelectorAll('.insert-button').length,package:document.querySelector('#data-package').value,fslabsDisabled:document.querySelector('#tab-fslabs').disabled,fslabsAriaDisabled:document.querySelector('#tab-fslabs').getAttribute('aria-disabled')})`);
    assert.equal(ui.title,'BAVirtual Custom Nav Data');
    assert.equal(ui.rows,3);
    assert.equal(ui.buttons,3);
    assert.equal(ui.package,'gibraltar');
    assert.equal(ui.fslabsDisabled,true);
    assert.equal(ui.fslabsAriaDisabled,'true');
    const screenshot=path.join(app.getPath('temp'),'bav-navdata-ui.png');
    await writeFile(screenshot,(await win.capturePage()).toPNG());
    await win.webContents.executeJavaScript(`document.querySelector('.insert-button').click()`);
    await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{
      const start=Date.now(); const timer=setInterval(()=>{
        if(document.querySelector('#operation-feedback').dataset.state==='success' && !document.querySelector('#refresh').disabled){clearInterval(timer);resolve();}
        else if(Date.now()-start>10000){clearInterval(timer);reject(new Error('Insert UI did not settle'));}
      },50);
    })`);
    assert.equal(called.has('fenix'),true);
    assert.equal(await win.webContents.executeJavaScript(`document.querySelectorAll('.insert-button').length`),2);
    await win.webContents.executeJavaScript(`document.querySelector('#tab-fslabs').click()`);
    const fslabsTab = await win.webContents.executeJavaScript(`({selected:document.querySelector('#tab-fslabs').getAttribute('aria-selected'),panelLabelledBy:document.querySelector('#platform-panel').getAttribute('aria-labelledby'),rows:document.querySelectorAll('#files tr').length,buttons:document.querySelectorAll('.insert-button').length})`);
    assert.equal(fslabsTab.selected,'false');
    assert.equal(fslabsTab.panelLabelledBy,'tab-fenix');
    assert.equal(fslabsTab.rows,3);
    assert.equal(fslabsTab.buttons,2);
    assert.equal(called.has('fslabs'),false);
    console.log('PASS: real Electron preload, package selector, status rows, mock Fenix insert action, and disabled FSLabs tab.');
    console.log('Screenshot:',screenshot);
    app.exit(0);
}).catch(error=>{console.error(error);app.exit(1);});
