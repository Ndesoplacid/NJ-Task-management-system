import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    deadline: {
      type: Date,
      required: [true, 'Task deadline date/time is required'],
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add index on user and deadline for rapid query scanning in cron and controller
TaskSchema.index({ user: 1, deadline: 1 });
TaskSchema.index({ emailSent: 1, deadline: 1 });

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

export default Task;
