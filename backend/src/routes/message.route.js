import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  getMessages, 
  getUsersForSidebar, 
  sendMessage,
  markMessageAsRead,
  deleteMessage,
  editMessage,
  forwardMessage
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.put("/read/:messageId", protectRoute, markMessageAsRead);
router.delete("/:messageId", protectRoute, deleteMessage);
router.put("/edit/:messageId", protectRoute, editMessage);
router.post("/forward/:messageId/:receiverId", protectRoute, forwardMessage);

export default router;
