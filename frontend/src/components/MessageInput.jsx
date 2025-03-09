import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Mic, Smile } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

const MessageInput = () => {
  const { sendMessage, editMessage, replyingTo, editingMessage, setReplyingTo, setEditingMessage } = useChatStore();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
    }
  }, [editingMessage]);

  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.stream?.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview);
      }
    };
  }, [audioPreview]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        setAudioPreview(audioUrl);
      };

      mediaRecorder.start();
      recorderRef.current = mediaRecorder;
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Error accessing microphone");
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      recorderRef.current.stream.getTracks().forEach(track => track.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioPreview) return;

    try {
      let voiceNoteData;
      if (audioPreview) {
        const response = await fetch(audioPreview);
        const blob = await response.blob();
        voiceNoteData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      if (editingMessage) {
        await editMessage(editingMessage._id, text);
        setEditingMessage(null);
      } else {
        await sendMessage({
          text: text.trim(),
          image: imagePreview,
          voiceNote: voiceNoteData,
          replyTo: replyingTo?._id,
        });
        setReplyingTo(null);
      }

      setText("");
      setImagePreview(null);
      setAudioPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    }
  };

  return (
    <div className="p-4 w-full bg-base-100/95 backdrop-blur-lg border-t border-base-300 relative">
      {/* Reply/Edit Preview */}
      {(replyingTo || editingMessage) && (
        <div className="mb-2 p-2 bg-base-200 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">
              {editingMessage ? "Editing message" : "Replying to"}
            </span>
            <p className="text-sm opacity-75">{editingMessage?.text || replyingTo?.text}</p>
          </div>
          <button
            onClick={() => {
              setReplyingTo(null);
              setEditingMessage(null);
            }}
            className="btn btn-ghost btn-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative w-full max-w-[200px] lg:max-w-[300px]">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-auto rounded-lg border border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 p-1.5 rounded-full bg-base-300 hover:bg-base-200 transition-colors shadow-md"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Audio Preview */}
      {audioPreview && (
        <div className="mb-3 flex items-center gap-2">
          <audio src={audioPreview} controls className="w-full max-w-[300px]" />
          <button
            onClick={() => setAudioPreview(null)}
            className="btn btn-circle btn-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-[1400px] mx-auto relative">
        <div className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg text-base lg:text-lg py-6"
            placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          
          {!editingMessage && (
            <div className="flex gap-3 justify-start">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              
              <button
                type="button"
                className="btn btn-circle btn-md lg:btn-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>

              <button
                type="button"
                className="btn btn-circle btn-md lg:btn-lg"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>

              <button
                type="button"
                className={`btn btn-circle ${isRecording ? 'btn-error animate-pulse' : ''}`}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
              >
                <Mic className="w-5 h-5" />
                {isRecording && <span className="absolute -top-2 -right-2 text-xs">{recordingTime}s</span>}
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-circle btn-md lg:btn-lg"
          disabled={!text.trim() && !imagePreview && !audioPreview}
        >
          <Send className="w-5 h-5 lg:w-6 lg:h-6" />
        </button>
      </form>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div 
          className="absolute bottom-20 right-4 mb-8 z-10 shadow-lg rounded-lg overflow-hidden"
          ref={emojiPickerRef}
        >
          <EmojiPicker 
            onEmojiClick={(emojiData) => setText(prev => prev + emojiData.emoji)}
            width={300}
            height={300}
            lazyLoadEmojis={true}
            searchDisabled={false}
            skinTonesDisabled={true}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
};

export default MessageInput;
