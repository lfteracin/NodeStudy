const mongoose = require('../../database');

const ProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required : true,
    },
    description: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    task: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;