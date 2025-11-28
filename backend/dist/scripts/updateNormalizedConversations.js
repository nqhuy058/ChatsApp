import mongoose from "mongoose";
import Conversation from "../models/Convesation.js";
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
 * Migration script: Update normalized_name cho group conversations
 */
const updateNormalizedConversations = async () => {
    try {
        // Connect DB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");
        // Đếm tổng số group conversations
        const totalConversations = await Conversation.countDocuments({ type: 'group' });
        console.log(`📊 Found ${totalConversations} group conversations`);
        if (totalConversations === 0) {
            console.log("ℹ️  No group conversations to update");
            await mongoose.disconnect();
            process.exit(0);
        }
        let updated = 0;
        const batchSize = 100;
        // Sử dụng cursor để stream data
        const cursor = Conversation.find({ type: 'group' }).cursor({ batchSize });
        console.log(`🚀 Starting migration with batch size: ${batchSize}`);
        for await (const conversation of cursor) {
            try {
                if (conversation.group?.name) {
                    const normalizedName = removeVietnameseAccents(conversation.group.name);
                    await Conversation.updateOne({ _id: conversation._id }, { $set: { 'group.normalized_name': normalizedName } });
                    updated++;
                    if (updated % 50 === 0) {
                        const progress = ((updated / totalConversations) * 100).toFixed(2);
                        console.log(`⏳ Updated ${updated}/${totalConversations} conversations (${progress}%)...`);
                    }
                }
            }
            catch (error) {
                console.error(`❌ Failed to update conversation ${conversation._id}:`, error);
            }
        }
        console.log(`✅ Successfully updated ${updated}/${totalConversations} conversations with normalized_name`);
        // Create index if not exist
        console.log("🔧 Ensuring index...");
        try {
            await Conversation.collection.createIndex({ 'group.normalized_name': 1 }, { name: 'group_normalized_name_1' });
            console.log("✅ Index 'group_normalized_name_1' created");
        }
        catch (error) {
            if (error.code === 86 || error.codeName === 'IndexKeySpecsConflict') {
                console.log("ℹ️  Index 'group_normalized_name_1' already exists");
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
updateNormalizedConversations();
