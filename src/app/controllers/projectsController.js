const express = require('express');
const authMiddleware = require('../middlewares/auth');

//Model import
const User = require('../models/User');
const Project = require('../models/Projects');
const Task = require('../models/Task');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try{
        const projects = await Project.find().populate(['user', 'tasks']);

        return res.send({ projects });
    }
    catch(err){
        console.log(err);
        res.status(400).send({ error: 'Error loading projects', message: err});
    }
});

router.get('/:projectId', async(req, res) => {
    try{
        const project = await Project.findById(req.params.projectId).populate([ 'user', 'tasks' ]);

        return res.send({ project });
    }
    catch(err){
        console.log(err);
        res.status(400).send({ error: 'Error loading projects', message: err});
    }
});

router.post('/', async(req, res) => {
    try{
        const { title, description, tasks} = req.body;
        const project = await Project.create({ title, description, user: req.userId});

        await Promise.all(tasks.map(async task => {
            const projectTask = new Task({...task, project: project._id});

            await projectTask.save();

            project.task.push(projectTask);
        }));

        await project.save();

        return res.send({ project });
    }
    catch(err){
        console.log(err);
        res.status(400).send({ error: 'Invalid request to create a new project'});
    }
});

router.put('/:projectId', async(req, res) => {
    try{
        const { title, description, tasks} = req.body;
        
        const project = await Project.findByIdAndUpdate(req.params.projectId, {
            title,
            description
        }, { new: true });

        project.tasks = [];
        await Task.remove({ project: project._id });

        await Promise.all(tasks.map(async task => {
            const projectTask = new Task({...task, project: project._id});

            await projectTask.save();

            project.task.push(projectTask);
        }));

        await project.save();

        return res.send({ project });
    }
    catch(err){
        console.log(err);
        res.status(400).send({ error: 'Invalid request to update a project'});
    }
});

router.delete('/:projectId', async(req, res) => {
    try{
        const project = await (await Project.findByIdAndRemove(req.params.projectId));

        return res.send({ success: 'true' });
    }
    catch(err){
        console.log(err);
        res.status(400).send({ error: 'Error removing project', message: err});
    }
});

module.exports = app => app.use('/projects', router);