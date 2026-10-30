const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('shahnamehDesktopBridge', {
  platform: process.platform,
  arch: process.arch,
  isDesktopApp: true,
  appVersion: '1.1.0',
});
