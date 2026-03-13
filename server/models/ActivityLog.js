const mongoose = require('mongoose');

const activityLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    },
    // Target user details (e.g. admin acting on another user)
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    targetUsername: {
      type: String,
    },
    targetEmail: {
      type: String,
    },
    // Flexible payload: score, playtime, etc.
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
