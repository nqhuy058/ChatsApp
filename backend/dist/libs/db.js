import mongoose from 'mongoose';
export const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        const dbName = process.env.DB_NAME || 'baobao'; // Tên database mặc định
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }
        // Kết nối với database name
        await mongoose.connect(mongoUri, {
            dbName: dbName, // Chỉ định tên database
        });
        console.log(`✅ MongoDB connected to database: ${dbName}`);
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};
