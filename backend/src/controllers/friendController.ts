import { Response } from "express";
import { AuthRequest } from "../types/express";
import Friend from "../models/Friend";
import Conversation from "../models/Convesation"; // Sửa typo nếu tên file của bạn là Conversation.ts
import mongoose from "mongoose";
import { USER_POPULATE_FIELDS } from "../utils/constants";

/**
 * Lấy danh sách bạn bè (Đã tối ưu Search bằng Aggregation)
 */
const getFriends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string || "").trim();
    const skip = (page - 1) * limit;

    const userId = req.user._id;

    // Pipeline Aggregation để tìm và lọc bạn bè ngay tại DB
    const pipeline: any[] = [
      // 1. Tìm các quan hệ bạn bè của user này
      {
        $match: {
          $or: [{ userA: userId }, { userB: userId }]
        }
      },
      // 2. Xác định ai là bạn (người còn lại)
      {
        $addFields: {
          friendId: {
            $cond: {
              if: { $eq: ["$userA", userId] },
              then: "$userB",
              else: "$userA"
            }
          }
        }
      },
      // 3. Join với bảng users để lấy thông tin bạn bè
      {
        $lookup: {
          from: "users", // Tên collection trong DB (thường là số nhiều)
          localField: "friendId",
          foreignField: "_id",
          as: "friendInfo"
        }
      },
      // 4. Unwind mảng friendInfo (vì lookup trả về mảng)
      { $unwind: "$friendInfo" },
      // 5. Nếu có search, lọc theo tên hoặc username
      ...(search ? [{
        $match: {
          $or: [
            { "friendInfo.display_name": { $regex: search, $options: "i" } },
            { "friendInfo.user_name": { $regex: search, $options: "i" } }
          ]
        }
      }] : []),
      // 6. Sắp xếp mới nhất
      { $sort: { createdAt: -1 } },
      // 7. Phân trang
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      }
    ];

    const result = await Friend.aggregate(pipeline);

    const data = result[0].data || [];
    const total = result[0].metadata[0]?.total || 0;

    // Format lại dữ liệu trả về cho đẹp
    const formattedFriends = data.map((item: any) => ({
      _id: item._id, // ID của mối quan hệ bạn bè
      friendId: {    // Thông tin người bạn
        _id: item.friendInfo._id,
        user_name: item.friendInfo.user_name,
        display_name: item.friendInfo.display_name,
        avatarURL: item.friendInfo.avatarURL,
        bio: item.friendInfo.bio
      },
      createdAt: item.createdAt
    }));

    res.status(200).json({
      message: "Lấy danh sách bạn bè thành công",
      friends: formattedFriends,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get friends error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Kiểm tra quan hệ bạn bè với một user
 */
const checkFriendship = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "userId không hợp lệ" });
      return;
    }

    if (req.user._id.equals(userId)) {
      res.status(200).json({ message: "Chính là bạn", isFriend: false, isSelf: true });
      return;
    }

    const [userA, userB] = [req.user._id.toString(), userId].sort();
    const friend = await Friend.findOne({
      userA: new mongoose.Types.ObjectId(userA),
      userB: new mongoose.Types.ObjectId(userB)
    })
      .populate("userA", USER_POPULATE_FIELDS)
      .populate("userB", USER_POPULATE_FIELDS);

    if (!friend) {
      res.status(200).json({
        message: "Chưa là bạn bè",
        isFriend: false,
        friend: null
      });
      return;
    }

    res.status(200).json({
      message: "Đã là bạn bè",
      isFriend: true,
      friend
    });
  } catch (error) {
    console.error("Check friendship error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Hủy kết bạn
 */
const unfriend = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { friendId } = req.params; // Đây là ID của bản ghi Friend hoặc User ID kia

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      res.status(400).json({ message: "ID không hợp lệ" });
      return;
    }

    // 1. Tìm bản ghi quan hệ bạn bè
    // Logic thông minh: Tìm theo ID bản ghi trước, nếu không thấy thì tìm theo cặp User ID
    let friendRecord = await Friend.findById(friendId);

    if (!friendRecord) {
      const [userA, userB] = [req.user._id.toString(), friendId].sort();
      friendRecord = await Friend.findOne({
        userA: new mongoose.Types.ObjectId(userA),
        userB: new mongoose.Types.ObjectId(userB)
      });
    }

    if (!friendRecord) {
      res.status(404).json({ message: "Không tìm thấy quan hệ bạn bè hoặc đã hủy trước đó" });
      return;
    }

    // 2. Kiểm tra quyền (chỉ người trong cuộc mới được hủy)
    const isParticipant =
      friendRecord.userA.toString() === req.user._id.toString() ||
      friendRecord.userB.toString() === req.user._id.toString();

    if (!isParticipant) {
      res.status(403).json({ message: "Bạn không có quyền hủy mối quan hệ này" });
      return;
    }

    // 3. Xóa bản ghi Friend
    await Friend.findByIdAndDelete(friendRecord._id);

    // 4. KHÔNG XÓA CONVERSATION
    // Chúng ta giữ nguyên conversation để user vẫn đọc được tin nhắn cũ.
    // Việc chặn nhắn tin tiếp hay không sẽ do messageController quyết định (check setting "nhận tin từ người lạ").

    res.status(200).json({ message: "Hủy kết bạn thành công" });

  } catch (error) {
    console.error("Unfriend error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const friendController = {
  getFriends,
  checkFriendship,
  unfriend
};