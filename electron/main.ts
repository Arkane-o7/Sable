import { app, BrowserWindow, screen, ipcMain, globalShortcut } from 'electron'
import path from 'path'

// Disable hardware acceleration to prevent GPU conflicts with other apps
// This helps with transparency and prevents video blur issues in other apps
app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    // Must be focusable to receive keyboard input
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Set always on top with 'floating' level
  mainWindow.setAlwaysOnTop(true, 'floating')
  
  // Prevent window from being shown in taskbar/alt-tab
  mainWindow.setSkipTaskbar(true)

  // Make the window click-through for transparent areas
  mainWindow.setIgnoreMouseEvents(true, { forward: true })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Show window without stealing focus initially
  mainWindow.showInactive()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC handlers for mouse events
ipcMain.on('set-ignore-mouse-events', (_, ignore: boolean, options?: { forward: boolean }) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, options)
  }
})

// Toggle always on top
ipcMain.on('toggle-always-on-top', (_, value: boolean) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(value)
  }
})

// Get screen dimensions
ipcMain.handle('get-screen-size', () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  return { width, height }
})

app.whenReady().then(() => {
  createWindow()

  // Register global shortcut for new chat
  // Try multiple shortcuts in case some are taken by other apps
  const shortcuts = ['CommandOrControl+Shift+Space', 'CommandOrControl+Shift+S', 'CommandOrControl+`']
  let registered = false
  
  for (const shortcut of shortcuts) {
    if (!registered && globalShortcut.register(shortcut, () => {
      console.log(`Toggle chat triggered via ${shortcut}`)
      if (mainWindow) {
        mainWindow.webContents.send('toggle-chat')
      }
    })) {
      console.log(`Registered shortcut: ${shortcut}`)
      registered = true
    }
  }
  
  if (!registered) {
    console.log('Warning: Could not register any chat toggle shortcut')
  }

  // Register Escape to minimize to dock
  globalShortcut.register('Escape', () => {
    if (mainWindow) {
      mainWindow.webContents.send('minimize-to-dock')
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
