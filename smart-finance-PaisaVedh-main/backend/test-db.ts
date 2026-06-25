import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('='.repeat(50));
    console.log('Testing MongoDB Atlas Connection');
    console.log('='.repeat(50));
    
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI is not defined in .env file');
      console.log('\nPlease add your MongoDB Atlas connection string to .env file:');
      console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/paisavedh');
      return;
    }
    
    // Hide password in logs
    const hiddenURI = mongoURI.replace(/\/\/(.*)@/, '//***:***@');
    console.log(`Connection string: ${hiddenURI}`);
    
    console.log('\n⏳ Connecting to MongoDB Atlas...');
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
    await mongoose.connection.close();
    console.log('\n🎉 Connection is working perfectly!');
    
  } catch (error: any) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.message.includes('bad auth')) {
      console.log('\n🔧 Fix: Incorrect username or password');
      console.log('1. Go to MongoDB Atlas → Database Access');
      console.log('2. Check your username and reset password');
      console.log('3. Update .env file with correct credentials');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('timed out')) {
      console.log('\n🔧 Fix: Network issue - IP not whitelisted');
      console.log('1. Go to MongoDB Atlas → Network Access');
      console.log('2. Click "Add IP Address"');
      console.log('3. Add 0.0.0.0/0 (or your current IP)');
      console.log('4. Wait 1-2 minutes for changes to apply');
    }
  }
};

testConnection();