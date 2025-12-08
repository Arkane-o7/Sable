import { app, BrowserWindow, screen, ipcMain, globalShortcut, clipboard, nativeImage, shell } from 'electron'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'
import { platform } from 'os'
import Store from 'electron-store'

// Initialize electron-store for persistent data
const store = new Store({
  name: 'sable-data',
  encryptionKey: 'sable-desktop-secure-key', // Basic encryption for auth tokens
})

// Disable hardware acceleration to prevent GPU conflicts with other apps
// This helps with transparency and prevents video blur issues in other apps
app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null
let lastClipboardText = ''
let lastClipboardImageHash = ''
let clipboardInterval: NodeJS.Timeout | null = null
let notifySidecar: ChildProcess | null = null
let notifyBuffer = ''

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

// ============= Clipboard Monitoring =============
function getImageHash(image: Electron.NativeImage): string {
  if (image.isEmpty()) return ''
  const buffer = image.toPNG()
  // Simple hash based on buffer length and first/last bytes
  return `${buffer.length}-${buffer[0]}-${buffer[buffer.length - 1]}`
}

function startClipboardMonitoring() {
  // Initialize with current clipboard content
  lastClipboardText = clipboard.readText() || ''
  const currentImage = clipboard.readImage()
  lastClipboardImageHash = getImageHash(currentImage)

  // Poll clipboard every 500ms
  clipboardInterval = setInterval(() => {
    if (!mainWindow) return

    // Check for text changes
    const currentText = clipboard.readText() || ''
    if (currentText && currentText !== lastClipboardText) {
      lastClipboardText = currentText
      mainWindow.webContents.send('clipboard-changed', {
        type: 'text',
        content: currentText
      })
    }

    // Check for image changes
    const currentImg = clipboard.readImage()
    if (!currentImg.isEmpty()) {
      const currentHash = getImageHash(currentImg)
      if (currentHash !== lastClipboardImageHash) {
        lastClipboardImageHash = currentHash
        const dataUrl = currentImg.toDataURL()
        mainWindow.webContents.send('clipboard-changed', {
          type: 'image',
          content: dataUrl
        })
      }
    }
  }, 500)
}

function stopClipboardMonitoring() {
  if (clipboardInterval) {
    clearInterval(clipboardInterval)
    clipboardInterval = null
  }
}

// IPC handler to write to clipboard
ipcMain.on('clipboard-write-text', (_, text: string) => {
  clipboard.writeText(text)
  lastClipboardText = text // Update our tracking to avoid re-sending
})

ipcMain.on('clipboard-write-image', (_, dataUrl: string) => {
  const image = nativeImage.createFromDataURL(dataUrl)
  clipboard.writeImage(image)
  lastClipboardImageHash = getImageHash(image)
})

// Get current clipboard content
ipcMain.handle('clipboard-read', () => {
  const text = clipboard.readText()
  const image = clipboard.readImage()
  
  if (text) {
    return { type: 'text', content: text }
  }
  if (!image.isEmpty()) {
    return { type: 'image', content: image.toDataURL() }
  }
  return null
})

// ============= Notification Sidecar =============
function getSidecarPath(): { command: string, args: string[] } {
  const isDev = process.env.VITE_DEV_SERVER_URL
  const baseDir = isDev 
    ? path.join(__dirname, '..', 'sidecars', 'win32')
    : path.join(process.resourcesPath, 'sidecars', 'win32')
  
  if (platform() === 'win32') {
    const scriptPath = path.join(baseDir, 'sable-notify.ps1')
    return {
      command: 'powershell.exe',
      args: ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-File', scriptPath]
    }
  }
  
  // macOS/Linux (not implemented yet)
  return { command: '', args: [] }
}

function startNotifySidecar() {
  if (platform() !== 'win32') {
    console.log('Notification sidecar only available on Windows')
    return
  }
  
  if (notifySidecar) {
    console.log('Notification sidecar already running')
    return
  }
  
  const { command, args } = getSidecarPath()
  if (!command) return
  
  console.log(`Starting notification sidecar: ${command} ${args.join(' ')}`)
  
  try {
    notifySidecar = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    notifySidecar.stdout?.on('data', (data: Buffer) => {
      handleSidecarOutput(data.toString())
    })
    
    notifySidecar.stderr?.on('data', (data: Buffer) => {
      console.error('[sable-notify] Error:', data.toString())
    })
    
    notifySidecar.on('error', (err) => {
      console.error('[sable-notify] Failed to start:', err.message)
      notifySidecar = null
    })
    
    notifySidecar.on('exit', (code) => {
      console.log(`[sable-notify] Exited with code ${code}`)
      notifySidecar = null
    })
    
    // Send start command after a short delay
    setTimeout(() => {
      if (notifySidecar?.stdin) {
        notifySidecar.stdin.write(JSON.stringify({ type: 'start' }) + '\n')
      }
    }, 1000)
    
  } catch (err) {
    console.error('Failed to start notification sidecar:', err)
  }
}

function handleSidecarOutput(data: string) {
  notifyBuffer += data
  const lines = notifyBuffer.split('\n')
  notifyBuffer = lines.pop() || ''
  
  for (const line of lines) {
    if (!line.trim()) continue
    
    try {
      const response = JSON.parse(line)
      
      if (response.type === 'notification' && mainWindow) {
        mainWindow.webContents.send('system-notification', response.payload)
      } else if (response.type === 'ready') {
        console.log('[sable-notify] Ready to receive notifications')
      } else if (response.type === 'error') {
        console.error('[sable-notify] Error:', response.payload?.message)
      }
    } catch (err) {
      console.error('[sable-notify] Invalid JSON:', line)
    }
  }
}

function stopNotifySidecar() {
  if (notifySidecar) {
    try {
      notifySidecar.stdin?.write(JSON.stringify({ type: 'stop' }) + '\n')
      setTimeout(() => {
        if (notifySidecar) {
          notifySidecar.kill()
          notifySidecar = null
        }
      }, 1000)
    } catch (err) {
      console.error('Error stopping notification sidecar:', err)
    }
  }
}

// IPC handler to start/stop notification listener
ipcMain.handle('start-notification-listener', () => {
  startNotifySidecar()
  return { success: true }
})

ipcMain.handle('stop-notification-listener', () => {
  stopNotifySidecar()
  return { success: true }
})

// ============= Electron Store IPC =============
ipcMain.handle('store-get', (_, key: string) => {
  return store.get(key)
})

ipcMain.handle('store-set', (_, key: string, value: unknown) => {
  store.set(key, value)
})

ipcMain.handle('store-delete', (_, key: string) => {
  store.delete(key as any)
})

// ============= External URLs (OAuth) =============
ipcMain.handle('open-external', async (_, url: string) => {
  await shell.openExternal(url)
})

// ============= Deep Link Handler (OAuth Callback) =============
// Register sable:// protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('sable', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('sable')
}

// Handle the protocol on Windows/Linux
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_, commandLine) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
    
    // Handle deep link on Windows
    const deepLink = commandLine.find(arg => arg.startsWith('sable://'))
    if (deepLink) {
      handleDeepLink(deepLink)
    }
  })
}

// Handle deep link on macOS
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

function handleDeepLink(url: string) {
  console.log('Deep link received:', url)
  
  // Forward auth callback to renderer for Supabase to handle
  if (mainWindow) {
    mainWindow.webContents.send('auth-callback', url)
  }
}

app.whenReady().then(() => {
  createWindow()
  
  // Start clipboard monitoring
  startClipboardMonitoring()

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

  // Register Focus Mode shortcut (Ctrl+`)
  // Note: backtick might be used by another shortcut, try alternatives
  const focusShortcuts = ['CommandOrControl+`', 'CommandOrControl+Shift+F', 'CommandOrControl+Alt+F']
  let focusRegistered = false
  
  for (const shortcut of focusShortcuts) {
    if (!focusRegistered && globalShortcut.register(shortcut, () => {
      console.log(`Toggle Focus Mode triggered via ${shortcut}`)
      if (mainWindow) {
        mainWindow.webContents.send('toggle-focus-mode')
      }
    })) {
      console.log(`Registered Focus Mode shortcut: ${shortcut}`)
      focusRegistered = true
    }
  }
  
  if (!focusRegistered) {
    console.log('Warning: Could not register any Focus Mode shortcut')
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
  stopClipboardMonitoring()
  stopNotifySidecar()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
