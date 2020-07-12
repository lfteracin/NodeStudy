const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const authConfig = require('../../config/auth');
const nodemailer = require('nodemailer');
const mailer = require('../../modules/mailer');

const router = express.Router();

function generateToken(params = {}) {
    return jwt.sign(
        params, authConfig.secret, {
            expiresIn: 86400
        });
}

router.post('/register', async (req, res) => {
    const {
        email
    } = req.body;

    try {
        if (await User.findOne({ email }))
            return res.status(400).send({ error: 'User already exists' });

        const user = await User.create(req.body);
        user.password = undefined;

        return res.send({
            user,
            token: generateToken({
                id: user.id
            }),
        });
    } catch (err) {
        return res.status(400).send({ error: 'User registration failed' });
    };
});

router.post('/authenticate', async (req, res) => {
    const {
        email,
        password
    } = req.body;

    const user = await User.findOne({
        email
    }).select('+password');

    if (!user)
        return res.status(400).send({
            error: 'User not found'
        });

    if(!user.enabled)
        return res.status(400).send({ error: 'User disable'});

    if (!await bcrypt.compare(password, user.password))
        return res.status(400).send({
            error: 'Wrong Password'
        });

    user.password = undefined;

    res.send({
        user,
        token: generateToken({
            id: user.id
        }),
    });
});

router.post('/forgot_password', async (req, res) => {
    const {
        email
    } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).send({ error: 'User not found' });
        
        const token = crypto.randomBytes(20).toString('hex');
        const now = new Date();
        now.setHours(now.getHours() + 1);
        
        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now,
            }
        });
        console.log(user, token, now);

        mailer.sendMail({
            to: email,
            from: 'nodestudy@gmail.com',
            subject: 'Reset password request',
            template: 'auth/forgotPassword',
            context: {token},
        }, (err) => {
            if(err){
                console.log(err);
                return res.status(400).send({ error: 'Cannot send forgot password e-mail'});
            }
       
            return res.send({ sucess: 'true'});
        })
    } catch (err) {
        console.log(err);
        res.status(400).send({
            error: 'Error on forgot password, please review your data and try again'
        });
    }
})

router.post('/reset_password', async(req, res) => {
    const {email, token, password} = req.body;

    try{
        const user = await User.findOne({ email })
            .select('+passwordResetToken passwordResetExpires');

        if (!user)
            return res.status(400).send({ error: 'User not found' });

        if(token !== user.passwordResetToken)
            return res.status(400).send({ error: 'Invalid token'});

        const now = new Date();
        if(now > user.passwordResetExpires)
            return res.status(400).send({ error: 'Expired token, generate a new one!' });
        
        user.password = password;

        await user.save();

        res.send();
    } catch (err) {
        res.status(400).send({ error: 'Cannot reset your password, try again' });
    }
})

module.exports = app => app.use('/auth', router);