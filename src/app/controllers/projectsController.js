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
        const projects = await Project.find().populate('user');

        return res.send({ projects });
    }
    catch(err){
        console.log(err);
        res.status(400).send({ error: 'Error loading projects', message: err});
    }
});

router.get('/:projectId', async(req, res) => {
    res.send({ user: req.userId });
});

router.post('/', async(req, res) => {
    const {email} = req.body;
    try{
        const project = await Project.create({ ...req.body, user: req.userId});

        return res.send({ project });
    }
    catch(err){
        console.log(err);
        res.status(400).send({ error: 'Invalid request to create a new project'});
    }
});

router.put('/:projectId', async(req, res) => {
    res.send({ user: req.userId });
});

router.delete('/:projectId', async(req, res) => {
    res.send({ user: req.userId });
});

module.exports = app => app.use('/projects', router);