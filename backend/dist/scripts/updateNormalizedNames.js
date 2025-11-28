import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";
// Load env
dotenv.config();
/**
 * Helper: Remove Vietnamese accents
 */
const removeVietnameseAccents = (str) => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
};
/**
 * Migration script: Update normalized_display_name cho tất cả users
 * Sử dụng cursor để tránh memory leak với DB lớn
 */
const updateNormalizedNames = async () => {
    try {
        // Connect DB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");
        // Đếm tổng số users
        const totalUsers = await User.countDocuments({});
        console.log(`📊 Found ${totalUsers} users`);
        if (totalUsers === 0) {
            console.log("⚠️  No users to update");
            await mongoose.disconnect();
            process.exit(0);
        }
        let updated = 0;
        const batchSize = 100; // Process 100 users at a time
        // Sử dụng cursor để stream data thay vì load hết vào RAM
        const cursor = User.find({}).cursor({ batchSize });
        console.log(`🚀 Starting migration with batch size: ${batchSize}`);
        for await (const user of cursor) {
            try {
                // Tính normalized_display_name trực tiếp
                const normalizedName = removeVietnameseAccents(user.display_name);
                // Update trực tiếp bằng updateOne để tránh overhead của .save()
                await User.updateOne({ _id: user._id }, { $set: { normalized_display_name: normalizedName } });
                updated++;
                // Log progress mỗi 100 users
                if (updated % 100 === 0) {
                    const progress = ((updated / totalUsers) * 100).toFixed(2);
                    console.log(`⏳ Updated ${updated}/${totalUsers} users (${progress}%)...`);
                }
            }
            catch (error) {
                console.error(`❌ Failed to update user ${user._id}:`, error);
            }
        }
        console.log(`✅ Successfully updated ${updated}/${totalUsers} users with normalized_display_name`);
        // Create indexes if not exist
        console.log("🔧 Ensuring indexes...");
        try {
            await User.collection.createIndex({ normalized_display_name: 1 }, { name: 'normalized_display_name_1' });
            console.log("✅ Index 'normalized_display_name_1' created");
        }
        catch (error) {
            if (error.code === 86 || error.codeName === 'IndexKeySpecsConflict') {
                console.log("ℹ️  Index 'normalized_display_name_1' already exists");
            }
            else {
                throw error;
            }
        }
        await mongoose.disconnect();
        console.log("👋 Disconnected from MongoDB");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
};
updateNormalizedNames();
