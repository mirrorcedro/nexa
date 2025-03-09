import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only mark as read if the current user is the receiver
    if (message.receiverId.toString() === userId.toString()) {
      message.isRead = true;
      await message.save();
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in markMessageAsRead: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, voiceNote } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    let voiceNoteUrl;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    if (voiceNote) {
      const uploadResponse = await cloudinary.uploader.upload(voiceNote, {
        resource_type: "video",
      });
      voiceNoteUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      voiceNote: voiceNoteUrl,
    });

    // Update last message for both users
    await User.findByIdAndUpdate(senderId, { lastMessage: newMessage._id });
    await User.findByIdAndUpdate(receiverId, { lastMessage: newMessage._id });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized to delete this message" });
    }

    await Message.findByIdAndDelete(messageId);
    
    // Notify the receiver about message deletion
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", messageId);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting message" });
  }
};

export const forwardMessage = async (req, res) => {
  try {
    const { messageId, receiverId } = req.params;
    const senderId = req.user._id;

    // Find the original message
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Create the forwarded message
    const forwardedMessage = new Message({
      senderId,
      receiverId,
      text: originalMessage.text,
      image: originalMessage.image,
      voiceNote: originalMessage.voiceNote,
      isForwarded: true
    });

    await forwardedMessage.save();

    // Update last message for both users
    await User.findByIdAndUpdate(senderId, { lastMessage: forwardedMessage._id });
    await User.findByIdAndUpdate(receiverId, { lastMessage: forwardedMessage._id });

    // Notify receiver through socket
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", forwardedMessage);
    }

    res.status(201).json(forwardedMessage);
  } catch (error) {
    console.error("Error in forwardMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized to edit this message" });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { text, isEdited: true },
      { new: true }
    );

    // Notify through socket
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", updatedMessage);
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ error: "Error editing message" });
  }
};
