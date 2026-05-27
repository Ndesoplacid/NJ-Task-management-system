import Task from '../models/Task.js';

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
export const createTask = async (req, res) => {
  try {
    const { title, description, deadline, status, priority } = req.body;

    if (!title || !deadline) {
      return res.status(400).json({ success: false, message: 'Please provide task title and deadline' });
    }

    const taskDeadline = new Date(deadline);
    if (isNaN(taskDeadline.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid deadline date format' });
    }

    const task = await Task.create({
      user: req.user._id,
      title,
      description: description || '',
      deadline: taskDeadline,
      status: status || 'Pending',
      priority: priority || 'Medium',
      emailSent: false, // Ensure defaults
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error(`[Task Creation Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while creating task' });
  }
};

/**
 * @desc    Get all user tasks (with sorting and filtering)
 * @route   GET /api/tasks
 * @access  Private
 */
export const getTasks = async (req, res) => {
  try {
    const query = { user: req.user._id };

    // Filtering by Status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filtering by Priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Sorting definition
    let sortOptions = { deadline: 1 }; // Default: earliest deadline first
    if (req.query.sortBy === 'deadline_desc') {
      sortOptions = { deadline: -1 };
    } else if (req.query.sortBy === 'deadline_asc') {
      sortOptions = { deadline: 1 };
    } else if (req.query.sortBy === 'created_desc') {
      sortOptions = { createdAt: -1 };
    }

    const tasks = await Task.find(query).sort(sortOptions);

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    console.error(`[Task Fetch Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while fetching tasks' });
  }
};

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
export const updateTask = async (req, res) => {
  try {
    const { title, description, deadline, status, priority } = req.body;

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Confirm task ownership
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this task' });
    }

    // Prepare fields to update
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;

    if (deadline !== undefined) {
      const taskDeadline = new Date(deadline);
      if (isNaN(taskDeadline.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid deadline date format' });
      }

      // If deadline changed, reset emailSent to allow resending reminder email
      if (taskDeadline.getTime() !== task.deadline.getTime()) {
        updateData.deadline = taskDeadline;
        updateData.emailSent = false;
      }
    }

    // If status changed to Completed or anything else, reset or preserve mail sent flags
    if (status === 'Completed') {
      updateData.emailSent = true; // Completed tasks do not need deadlines sent
    } else if (status !== undefined && status !== 'Completed' && task.status === 'Completed') {
      // Re-opened task: let them receive reminders again
      updateData.emailSent = false;
    }

    task = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, task });
  } catch (error) {
    console.error(`[Task Update Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while updating task' });
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Confirm ownership
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this task' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error(`[Task Deletion Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while deleting task' });
  }
};
