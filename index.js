const express = require('express');
const joi = require('joi');
const fs = require('fs').promises;

const app = express();
const dataFilePath = './users.json';

let users = [];

let uniqueID = 0;
const userSchema = joi.object({
    firstName: joi.string().min(1).required(),
    secondName: joi.string().min(1).required(),
    age: joi.number().min(0).max(150).required(),
    city: joi.string().min(1),
});

app.use(express.json());

async function loadUsersFromFile() {
    try {
        const data = await fs.readFile(dataFilePath, 'utf8');
        users = JSON.parse(data);
        uniqueID = users.length > 0 ? Math.max(...users.map(u => u.id)) : 0;
    } catch (err) {
        console.log('No data file');
        users = [];
        uniqueID = 0;
    }
}

async function saveUsersToFile() {
    try {
        await fs.writeFile(dataFilePath, JSON.stringify(users, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving to file:', err);
    }
}

loadUsersFromFile();

app.get('/users', (req, res) => {
    res.send({ users });
});

app.get('/users/:id', (req, res) => {
    const userId = +req.params.id;
    const user = users.find(user => user.id === userId);
    if (user) {
        res.send({ user });
    } else {
        res.status(404).send({ user: null });
    }
});

app.post('/users', (req, res) => {
    const result = userSchema.validate(req.body);
    if (result.error) {
        return res.status(400).send({ error: result.error.details });
    }

    uniqueID += 1;
    const newUser = {
        id: uniqueID,
        ...req.body,
    };

    users.push(newUser);
    saveUsersToFile();
    res.send({ id: uniqueID });
});

app.put('/users/:id', (req, res) => {
    const result = userSchema.validate(req.body);
    if (result.error) {
        return res.status(400).send({ error: result.error.details });
    }

    const userId = +req.params.id;
    const user = users.find(user => user.id === userId);

    if (user) {
        const { firstName, secondName, age, city } = req.body;
        user.firstName = firstName;
        user.secondName = secondName;
        user.age = age;
        user.city = city;

        saveUsersToFile();
        res.send({ user });
    } else {
        res.status(404).send({ user: null });
    }
});

app.delete('/users/:id', (req, res) => {
    const userId = +req.params.id;
    const user = users.find(user => user.id === userId);

    if (user) {
        const userIndex = users.indexOf(user);
        users.splice(userIndex, 1);
        saveUsersToFile();
        res.send({ user });
    } else {
        res.status(404).send({ user: null });
    }
});

app.listen(3000);