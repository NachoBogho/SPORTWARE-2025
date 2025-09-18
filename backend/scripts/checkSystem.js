const { exec } = require('child_process');
const mongoose = require('mongoose');
require('dotenv').config();

class SystemChecker {
  constructor() {
    this.checks = [];
    this.passed = 0;
    this.failed = 0;
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

  async checkNode() {
    return new Promise((resolve) => {
      exec('node --version', (error, stdout) => {
        if (error) {
          this.log('❌', 'Node.js no está instalado', 'error');
          this.failed++;
          resolve(false);
        } else {
          const version = stdout.trim();
          this.log('✅', `Node.js ${version} detectado`, 'success');
          this.passed++;
          resolve(true);
        }
      });
    });
  }

  async checkNpm() {
    return new Promise((resolve) => {
      exec('npm --version', (error, stdout) => {
        if (error) {
          this.log('❌', 'npm no está instalado', 'error');
          this.failed++;
          resolve(false);
        } else {
          const version = stdout.trim();
          this.log('✅', `npm ${version} detectado`, 'success');
          this.passed++;
          resolve(true);
        }
      });
    });
  }

  async checkMongoDB() {
    return new Promise((resolve) => {
      exec('mongod --version', (error, stdout) => {
        if (error) {
          this.log('⚠️', 'MongoDB no está instalado o no está en PATH', 'warning');
          this.log('ℹ️', 'Intentando conectar directamente...', 'info');
          this.testMongoConnection().then(resolve);
        } else {
          const version = stdout.split('\n')[0];
          this.log('✅', `${version} detectado`, 'success');
          this.passed++;
          this.testMongoConnection().then((connected) => {
            resolve(connected && true);
          });
        }
      });
    });
  }

  async testMongoConnection() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sportware';
      this.log('🔄', `Probando conexión a ${mongoUri}...`, 'info');
      
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000
      });
      
      this.log('✅', 'Conexión a MongoDB exitosa', 'success');
      this.passed++;
      
      await mongoose.connection.close();
      return true;
    } catch (error) {
      this.log('❌', `Error conectando a MongoDB: ${error.message}`, 'error');
      this.failed++;
      return false;
    }
  }

  async checkEnvironment() {
    this.log('🔍', 'Verificando variables de entorno...', 'info');
    
    const requiredVars = ['MONGODB_URI', 'MONGODB_DB_NAME', 'PORT'];
    let envPassed = true;

    for (const varName of requiredVars) {
      if (process.env[varName]) {
        this.log('✅', `${varName}: ${process.env[varName]}`, 'success');
      } else {
        this.log('⚠️', `${varName}: No definida (usando valor por defecto)`, 'warning');
        envPassed = false;
      }
    }

    if (envPassed) {
      this.passed++;
    } else {
      this.failed++;
    }

    return envPassed;
  }

  async checkDependencies() {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      this.log('📦', 'Verificando dependencias...', 'info');
      
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      const requiredDeps = ['express', 'mongoose', 'cors', 'morgan', 'dotenv'];
      let depsOk = true;

      for (const dep of requiredDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.log('✅', `${dep}: ${packageJson.dependencies[dep]}`, 'success');
        } else {
          this.log('❌', `${dep}: No encontrada en dependencies`, 'error');
          depsOk = false;
        }
      }

      if (depsOk) {
        this.passed++;
      } else {
        this.failed++;
      }

      return depsOk;
    } catch (error) {
      this.log('❌', `Error verificando dependencies: ${error.message}`, 'error');
      this.failed++;
      return false;
    }
  }

  async checkProjectStructure() {
    const fs = require('fs').promises;
    const path = require('path');
    
    this.log('📁', 'Verificando estructura del proyecto...', 'info');
    
    const requiredFiles = [
      'server.js',
      'config/database.js',
      'scripts/seedDatabase.js',
      'models/Cliente.js',
      'models/Cancha.js',
      'models/Reserva.js',
      'models/Configuracion.js'
    ];

    let structureOk = true;

    for (const file of requiredFiles) {
      try {
        const filePath = path.join(__dirname, '..', file);
        await fs.access(filePath);
        this.log('✅', `${file}: Existe`, 'success');
      } catch (error) {
        this.log('❌', `${file}: No encontrado`, 'error');
        structureOk = false;
      }
    }

    if (structureOk) {
      this.passed++;
    } else {
      this.failed++;
    }

    return structureOk;
  }

  async runAllChecks() {
    this.log('🚀', 'Iniciando verificación del sistema SportWare...', 'info');
    console.log('='.repeat(60));

    await this.checkNode();
    await this.checkNpm();
    await this.checkMongoDB();
    await this.checkEnvironment();
    await this.checkDependencies();
    await this.checkProjectStructure();

    console.log('='.repeat(60));
    this.log('📊', 'RESUMEN DE VERIFICACIÓN', 'info');
    this.log('✅', `Verificaciones exitosas: ${this.passed}`, 'success');
    this.log('❌', `Verificaciones fallidas: ${this.failed}`, 'error');

    if (this.failed === 0) {
      this.log('🎉', '¡Sistema listo para usar!', 'success');
      this.log('🚀', 'Puedes ejecutar: npm run dev', 'info');
    } else {
      this.log('⚠️', 'Hay problemas que necesitan atención', 'warning');
      this.printRecommendations();
    }

    return this.failed === 0;
  }

  printRecommendations() {
    this.log('💡', 'RECOMENDACIONES:', 'info');
    
    if (this.failed > 0) {
      console.log('\n📋 Para solucionar los problemas:');
      console.log('1. Instalar MongoDB: https://www.mongodb.com/try/download/community');
      console.log('2. Instalar dependencias: npm install');
      console.log('3. Configurar variables de entorno en .env');
      console.log('4. Verificar que MongoDB esté ejecutándose');
      console.log('5. Ejecutar: npm run seed (para datos de ejemplo)');
    }
  }
}

// Ejecutar verificación
const checker = new SystemChecker();
checker.runAllChecks().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('Error durante la verificación:', error);
  process.exit(1);
});
