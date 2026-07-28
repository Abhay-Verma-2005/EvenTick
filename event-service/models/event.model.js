import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 120,
    },
    description: {
      type: String,
      maxLength: 2000,
    },
    catchyLine: {
      type: String,
      default: "Live the Moment. Make it Memorable.",
    },
    category: {
      type: String,
      required: true,
      enum: {
        values: ["concert", "conference", "workshop", "sports", "comedy", "theater", "festival", "meetup", "other"],
        message: `{VALUE} is not a valid event category`,
      },
    },
    imageUrl: {
      type: String,
      default: "https://i.postimg.cc/Bb1cv7cj/def-poster.png",
    },
    posterUrl: {
      type: String,
      default: "https://i.postimg.cc/Bb1cv7cj/def-poster.png",
    },
    flexUrl: {
      type: String,
      default: "https://i.postimg.cc/44hSyW3V/def-flex.png",
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
    },
    venue: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    totalSeats: {
      type: Number,
      min: 0,
    },
    availableSeats: {
      type: Number,
      min: 0,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostName: {
      type: String,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    ratings: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      }
    }],
    status: {
      type: String,
      enum: {
        values: ["live", "upcoming", "completed", "cancelled"],
        message: `{VALUE} is not a valid event status`,
      },
      default: "live",
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes for recommendation queries
eventSchema.index({ city: 1, date: 1, status: 1 });
eventSchema.index({ rating: -1 });
eventSchema.index({ createdAt: -1 });

// Schema Methods
eventSchema.methods.getEventDateTime = function () {
  if (!this.date) return null;
  const date = new Date(this.date);
  if (this.time) {
    const timeMatch = this.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let [_, hours, minutes, ampm] = timeMatch;
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);
      if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
      date.setHours(hours, minutes, 0, 0);
    } else {
      const time24Match = this.time.match(/(\d+):(\d+)/);
      if (time24Match) {
         date.setHours(parseInt(time24Match[1], 10), parseInt(time24Match[2], 10), 0, 0);
      }
    }
  }
  return date;
};

eventSchema.methods.isCancellable = function () {
  const eventDate = this.getEventDateTime();
  if (!eventDate) return true; // Fallback
  const now = new Date();
  return (eventDate.getTime() - now.getTime()) > 60 * 60 * 1000;
};

eventSchema.methods.isPast = function () {
  const eventDate = this.getEventDateTime();
  if (!eventDate) return false;
  return eventDate.getTime() < new Date().getTime();
};

export default mongoose.model("Event", eventSchema);
