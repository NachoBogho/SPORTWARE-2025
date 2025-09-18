#!/usr/bin/env node

const { exec } = require('child_process');

/**
 * Script para liberar el puerto 3001 y puertos relacionados
 * Útil cuando hay procesos zombi o el servidor no se cerró correctamente
 */

class PortManager {
  constructor() {
    this.defaultPorts = [3001, 3002, 3003, 3004, 3005];
  }

  log(emoji, message, status = 'info') {
    const colors = {
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      info: '\x1b[36m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[status]}${emoji} ${message}${colors.reset}`);
  }

  async killPortWindows(port) {
    return new Promise((resolve) => {
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
          this.log('ℹ️', `Puerto ${port}: No hay procesos activos`, 'info');
          resolve(false);
          return;
        }

        const lines = stdout.split('\n').filter(line => line.trim());
        const pids = new Set();

        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
            const pid = parts[4];
            if (pid && pid !== '0') {
              pids.add(pid);
            }
          }
        });

        if (pids.size === 0) {
          this.log('ℹ️', `Puerto ${port}: No hay PIDs para terminar`, 'info');
          resolve(false);
          return;
        }

        let killed = 0;
        const totalPids = pids.size;

        pids.forEach(pid => {
          exec(`taskkill /F /PID ${pid}`, (killError) => {
            killed++;
            if (killError) {
              this.log('⚠️', `Error terminando PID ${pid}: ${killError.message}`, 'warning');
            } else {
              this.log('✅', `Proceso ${pid} terminado (puerto ${port})`, 'success');
            }

            if (killed === totalPids) {
              resolve(true);
            }
          });
        });
      });
    });
  }

  async killPortUnix(port) {
    return new Promise((resolve) => {
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (error || !stdout.trim()) {
          this.log('ℹ️', `Puerto ${port}: No hay procesos activos`, 'info');
          resolve(false);
          return;
        }

        const pids = stdout.trim().split('\n').filter(pid => pid.trim());
        
        if (pids.length === 0) {
          this.log('ℹ️', `Puerto ${port}: No hay PIDs para terminar`, 'info');
          resolve(false);
          return;
        }

        let killed = 0;
        pids.forEach(pid => {
          exec(`kill -9 ${pid}`, (killError) => {
            killed++;
            if (killError) {
              this.log('⚠️', `Error terminando PID ${pid}: ${killError.message}`, 'warning');
            } else {
              this.log('✅', `Proceso ${pid} terminado (puerto ${port})`, 'success');
            }

            if (killed === pids.length) {
              resolve(true);
            }
          });
        });
      });
    });
  }

  async killPort(port) {
    const isWindows = process.platform === 'win32';
    
    this.log('🔍', `Verificando puerto ${port}...`, 'info');
    
    if (isWindows) {
      return await this.killPortWindows(port);
    } else {
      return await this.killPortUnix(port);
    }
  }

  async killAllPorts(ports = this.defaultPorts) {
    this.log('🚀', 'Iniciando limpieza de puertos...', 'info');
    console.log('='.repeat(50));

    let totalKilled = 0;

    for (const port of ports) {
      const killed = await this.killPort(port);
      if (killed) totalKilled++;
      
      // Pequeña pausa entre puertos
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('='.repeat(50));
    this.log('📊', `Limpieza completada. Puertos procesados: ${ports.length}`, 'info');
    
    if (totalKilled > 0) {
      this.log('✅', `Procesos terminados en ${totalKilled} puertos`, 'success');
      this.log('⏱️', 'Esperando 2 segundos para liberación completa...', 'info');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      this.log('ℹ️', 'No se encontraron procesos para terminar', 'info');
    }

    return totalKilled;
  }

  async checkPorts(ports = this.defaultPorts) {
    this.log('🔍', 'Verificando estado de puertos...', 'info');
    console.log('='.repeat(50));

    const isWindows = process.platform === 'win32';

    for (const port of ports) {
      const command = isWindows 
        ? `netstat -ano | findstr :${port}`
        : `lsof -i:${port}`;

      await new Promise((resolve) => {
        exec(command, (error, stdout) => {
          if (error || !stdout.trim()) {
            this.log('✅', `Puerto ${port}: Disponible`, 'success');
          } else {
            this.log('🔴', `Puerto ${port}: En uso`, 'error');
            if (stdout.trim()) {
              console.log(`    ${stdout.trim().split('\n')[0]}`);
            }
          }
          resolve();
        });
      });
    }

    console.log('='.repeat(50));
  }

  printHelp() {
    console.log('🛠️  Gestor de Puertos SportWare');
    console.log('================================');
    console.log('');
    console.log('Uso: node scripts/portManager.js [comando] [opciones]');
    console.log('');
    console.log('Comandos:');
    console.log('  kill [puerto]     - Terminar procesos en puerto específico');
    console.log('  kill-all          - Terminar procesos en puertos por defecto (3001-3005)');
    console.log('  check             - Verificar estado de puertos');
    console.log('  help              - Mostrar esta ayuda');
    console.log('');
    console.log('Ejemplos:');
    console.log('  node scripts/portManager.js kill 3001');
    console.log('  node scripts/portManager.js kill-all');
    console.log('  node scripts/portManager.js check');
    console.log('');
  }
}

// Ejecutar según argumentos
async function main() {
  const manager = new PortManager();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'kill':
      const port = parseInt(args[1]) || 3001;
      await manager.killPort(port);
      break;

    case 'kill-all':
      await manager.killAllPorts();
      break;

    case 'check':
      await manager.checkPorts();
      break;

    case 'help':
    case '--help':
    case '-h':
      manager.printHelp();
      break;

    default:
      if (command) {
        console.log(`❌ Comando desconocido: ${command}`);
      }
      manager.printHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Error:', error.message);
  process.exit(1);
});

module.exports = PortManager;
