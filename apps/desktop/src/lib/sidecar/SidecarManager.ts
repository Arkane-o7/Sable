import { spawn, ChildProcess } from 'child_process'
import { platform } from 'os'
import path from 'path'
import { EventEmitter } from 'events'
import { SidecarCommand, SidecarResponse, SidecarNotification } from './types'

type SidecarName = 'sable-notify' | 'sable-search' | 'sable-automation'

interface SidecarConfig {
  name: SidecarName
  usesPowerShell?: boolean  // For Windows, use PowerShell script instead of exe
}

const SIDECAR_CONFIGS: Record<SidecarName, SidecarConfig> = {
  'sable-notify': { name: 'sable-notify', usesPowerShell: true },
  'sable-search': { name: 'sable-search', usesPowerShell: false },
  'sable-automation': { name: 'sable-automation', usesPowerShell: false },
}

// Note: This manager is designed for Electron main process
// For renderer process, use the IPC bridge in preload.ts

export class SidecarManager extends EventEmitter {
  private processes: Map<SidecarName, ChildProcess> = new Map()
  private buffers: Map<SidecarName, string> = new Map()
  
  private getSidecarPath(name: SidecarName): { command: string, args: string[] } {
    const config = SIDECAR_CONFIGS[name]
    const platformDir = platform() // 'win32', 'darwin', 'linux'
    
    // In dev: use sidecars folder in project root
    // In prod: use resources folder (Electron-specific)
    const resourcesPath = (process as any).resourcesPath as string | undefined
    const isDev = !resourcesPath || resourcesPath.includes('node_modules')
    
    const baseDir = isDev 
      ? path.join(__dirname, '..', '..', '..', 'sidecars', platformDir)
      : path.join(resourcesPath!, 'sidecars', platformDir)
    
    if (platform() === 'win32' && config.usesPowerShell) {
      // Use PowerShell to run the script
      const scriptPath = path.join(baseDir, `${name}.ps1`)
      return {
        command: 'powershell.exe',
        args: ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-File', scriptPath]
      }
    }
    
    // Native binary
    const ext = platform() === 'win32' ? '.exe' : ''
    return {
      command: path.join(baseDir, `${name}${ext}`),
      args: []
    }
  }
  
  start(name: SidecarName): boolean {
    if (this.processes.has(name)) {
      console.log(`Sidecar ${name} already running`)
      return true
    }
    
    const { command, args } = this.getSidecarPath(name)
    console.log(`Starting sidecar: ${command} ${args.join(' ')}`)
    
    try {
      const proc = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      this.buffers.set(name, '')
      
      proc.stdout?.on('data', (data: Buffer) => {
        this.handleOutput(name, data.toString())
      })
      
      proc.stderr?.on('data', (data: Buffer) => {
        console.error(`[${name}] Error:`, data.toString())
      })
      
      proc.on('error', (err) => {
        console.error(`[${name}] Failed to start:`, err.message)
        this.processes.delete(name)
        this.emit('error', { sidecar: name, error: err.message })
      })
      
      proc.on('exit', (code) => {
        console.log(`[${name}] Exited with code ${code}`)
        this.processes.delete(name)
        this.emit('exit', { sidecar: name, code })
      })
      
      this.processes.set(name, proc)
      return true
    } catch (err) {
      console.error(`Failed to start sidecar ${name}:`, err)
      return false
    }
  }
  
  private handleOutput(name: SidecarName, data: string) {
    // Buffer data and split by newlines (each line is a JSON message)
    let buffer = (this.buffers.get(name) || '') + data
    const lines = buffer.split('\n')
    
    // Keep incomplete line in buffer
    this.buffers.set(name, lines.pop() || '')
    
    for (const line of lines) {
      if (!line.trim()) continue
      
      try {
        const response: SidecarResponse = JSON.parse(line)
        this.handleResponse(name, response)
      } catch (err) {
        console.error(`[${name}] Invalid JSON:`, line)
      }
    }
  }
  
  private handleResponse(name: SidecarName, response: SidecarResponse) {
    switch (response.type) {
      case 'notification':
        this.emit('notification', response.payload as SidecarNotification)
        break
      case 'search-results':
        this.emit('search-results', response.payload)
        break
      case 'ready':
        console.log(`[${name}] Ready`)
        this.emit('ready', { sidecar: name })
        break
      case 'error':
        console.error(`[${name}] Error:`, response.payload)
        this.emit('error', { sidecar: name, error: response.payload })
        break
      default:
        this.emit(response.type, response.payload)
    }
  }
  
  send(name: SidecarName, command: SidecarCommand): boolean {
    const proc = this.processes.get(name)
    if (!proc || !proc.stdin) {
      console.error(`Sidecar ${name} not running`)
      return false
    }
    
    try {
      proc.stdin.write(JSON.stringify(command) + '\n')
      return true
    } catch (err) {
      console.error(`Failed to send command to ${name}:`, err)
      return false
    }
  }
  
  stop(name: SidecarName) {
    const proc = this.processes.get(name)
    if (proc) {
      this.send(name, { type: 'stop' })
      setTimeout(() => {
        if (this.processes.has(name)) {
          proc.kill()
          this.processes.delete(name)
        }
      }, 1000)
    }
  }
  
  stopAll() {
    for (const name of this.processes.keys()) {
      this.stop(name)
    }
  }
  
  isRunning(name: SidecarName): boolean {
    return this.processes.has(name)
  }
}

// Singleton instance
export const sidecarManager = new SidecarManager()
