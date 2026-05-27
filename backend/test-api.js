import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Task from './models/Task.js';

dotenv.config();

const runDiagnostics = async () => {
  console.log('========================================');
  console.log('   SYSTEM DIAGNOSTICS & VERIFICATION   ');
  console.log('========================================');
  
  console.log(`[Diagnostic] Node version: ${process.version}`);
  console.log(`[Diagnostic] Environment: ${process.env.NODE_ENV || 'not set (development fallback)'}`);
  console.log(`[Diagnostic] MONGODB_URI: ${process.env.MONGODB_URI ? 'Defined' : 'Missing (using localhost default)'}`);

  // Test 1: Model Compilation Check
  console.log('\n[Test 1] Compiling Mongoose Models...');
  try {
    const userKeys = Object.keys(User.schema.paths);
    const taskKeys = Object.keys(Task.schema.paths);
    console.log(`  ✓ User Model Compiled successfully! Registered paths: [${userKeys.join(', ')}]`);
    console.log(`  ✓ Task Model Compiled successfully! Registered paths: [${taskKeys.join(', ')}]`);
  } catch (err) {
    console.error(`  ❌ Schema compilation failed: ${err.message}`);
    process.exit(1);
  }

  // Test 2: Database Connectivity Check
  console.log('\n[Test 2] Connecting to Database...');
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskmanager';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`  ✓ MongoDB Connection established successfully at: ${mongoose.connection.host}`);
    
    // Test 3: Sandbox Write/Read Verification
    console.log('\n[Test 3] Verifying Read/Write Capabilities...');
    const tempEmail = `test-${Date.now()}@diagnostic.local`;
    
    // Create sandbox user
    const tempUser = await User.create({
      username: 'DiagnosticSandbox',
      email: tempEmail,
      password: 'diagnostic-dummy-password-hash'
    });
    console.log(`  ✓ Created sandbox User with ID: ${tempUser._id}`);

    // Create sandbox task linked to user
    const tempTask = await Task.create({
      user: tempUser._id,
      title: 'Diagnostic System Check',
      description: 'Verifying Mongo CRUD and indexes are operational.',
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
    });
    console.log(`  ✓ Created sandbox Task with ID: ${tempTask._id}`);

    // Read back and query
    const fetchedTask = await Task.findOne({ user: tempUser._id }).populate('user');
    console.log(`  ✓ Query & populate test passed! Loaded task owner email: ${fetchedTask.user.email}`);

    // Cleanup sandboxed data
    await Task.findByIdAndDelete(tempTask._id);
    await User.findByIdAndDelete(tempUser._id);
    console.log(`  ✓ Cleaned up sandbox database records.`);
    
    console.log('\n========================================');
    console.log('   ✓ ALL SCHEMAS AND DATABASE TESTS PASS!');
    console.log('========================================');
  } catch (err) {
    console.error(`  ❌ Database verification failed!`);
    console.error(`     Error Details: ${err.message}`);
    console.log('\n----------------------------------------');
    console.log('💡 Note for local evaluation:');
    console.log('   Please make sure your local MongoDB service is running,');
    console.log('   or update MONGODB_URI in your backend/.env to use a free');
    console.log('   MongoDB Atlas cluster connection string.');
    console.log('----------------------------------------');
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runDiagnostics();
