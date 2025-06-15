const WritingModel = require('./models/writing.model');

// Helper to parse pagination params with defaults
function getPaginationParams(req) {
  const page = parseInt(req.query.page) || 1;
  const size = req.query.size ? parseInt(req.query.size) : null;
  return { page, size };
}

// Create a new writing
exports.addWriting = async (req, res) => {
  try {
    const data = {
      content: req.body.content,
      type: req.body.type,
      userId: req.user.userId,
      isPrivate: req.body?.isPrivate ?? true, // default true if not provided
    };

    const created = await new WritingModel(data).save();
    if (created) {
      res.json({ success: true, message: 'Your writing was saved.' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to save writing.' });
    }
  } catch (err) {
    console.error('Error adding writing:', err);
    res.status(500).json({ error: 'Failed to save writing.' });
  }
};

// List writings created by logged-in user with optional pagination
exports.listMyWritings = async (req, res) => {
  try {
    const { page, size } = getPaginationParams(req);
    const query = { userId: req.user.userId };

    let writings, totalCount, totalPages;
    if (size) {
      totalCount = await WritingModel.countDocuments(query);
      totalPages = Math.ceil(totalCount / size);
      writings = await WritingModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size);
    } else {
      writings = await WritingModel.find(query).sort({ createdAt: -1 });
      totalCount = writings.length;
      totalPages = 1;
    }

    res.json({
      success: true,
      data: writings,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize: size || totalCount,
      },
    });
  } catch (err) {
    console.error('Error listing my writings:', err);
    res.status(500).json({ error: 'Failed to list your writings.' });
  }
};

// List all public writings 
exports.listPublicWritings = async (req, res) => {
  try {
    const { page, size } = getPaginationParams(req);
    let query = {
      isPrivate: false,
      //userId: { $ne: req.user.userId },
    };
    if(req.query.excludeMe){
        query.userId= { $ne: req.user.userId }
    }

    let writings, totalCount, totalPages;
    if (size) {
      totalCount = await WritingModel.countDocuments(query);
      totalPages = Math.ceil(totalCount / size);
      writings = await WritingModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size);
    } else {
      writings = await WritingModel.find(query).sort({ createdAt: -1 });
      totalCount = writings.length;
      totalPages = 1;
    }

    res.json({
      success: true,
      data: writings,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize: size || totalCount,
      },
    });
  } catch (err) {
    console.error('Error listing public writings:', err);
    res.status(500).json({ error: 'Failed to list public writings.' });
  }
};

// Get one writing by id (only if owner or public)
exports.getWritingById = async (req, res) => {
  try {
    const writing = await WritingModel.findById(req.params.id);
    if (!writing) {
      return res.status(404).json({ error: 'Writing not found.' });
    }

    // Allow access if public or owned by user
    if (writing.isPrivate && writing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ success: true, data: writing });
  } catch (err) {
    console.error('Error getting writing:', err);
    res.status(500).json({ error: 'Failed to get writing.' });
  }
};

// Edit a writing by id (only owner can edit)
exports.editWriting = async (req, res) => {
  try {
    const writing = await WritingModel.findById(req.params.id);
    if (!writing) {
      return res.status(404).json({ error: 'Writing not found.' });
    }
    if (writing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied. You can only edit your own writings.' });
    }

    writing.content = req.body.content ?? writing.content;
    writing.type = req.body.type ?? writing.type;
    if (typeof req.body.isPrivate === 'boolean') {
      writing.isPrivate = req.body.isPrivate;
    }

    await writing.save();
    res.json({ success: true, message: 'Writing updated successfully.', data: writing });
  } catch (err) {
    console.error('Error editing writing:', err);
    res.status(500).json({ error: 'Failed to update writing.' });
  }
};

// Delete a writing by id (only owner can delete)
exports.deleteWriting = async (req, res) => {
  try {
    const writing = await WritingModel.findById(req.params.id);
    if (!writing) {
      return res.status(404).json({ error: 'Writing not found.' });
    }
    if (writing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own writings.' });
    }

    await WritingModel.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Writing deleted successfully.' });
  } catch (err) {
    console.error('Error deleting writing:', err);
    res.status(500).json({ error: 'Failed to delete writing.' });
  }
};
