const UserModel = require("./UserModel")
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/quizGame")
.then((r)=>{console.log("connected to the database")})
.catch(e=>{console.error("laksjdf")})

const TestSchema = new mongoose.Schema({
    userId: Object,
    title: String,
    desc: String,
    subject: String
});
const TestModel = new mongoose.model("Test", TestSchema);

const QuestionSchema = new mongoose.Schema({
    testId: Object,
    question: String,
    answer: String,
    index: {
        type: Number,
        min: 0
    }
});
const QuestionModel = new mongoose.model("Question", QuestionSchema); 

const getTests = (userId)=>{
    return new Promise(async (resolve, reject)=>{
        try {
            const result = await TestModel.find({userId});
            if (result.length >= 1)
                resolve(result);
            resolve(false);
        } catch(e) {
            reject(e);
        }
    });
}

module.exports.getTests = getTests;

let allQuestions = null;
QuestionModel.find({})
.then((r)=>{
    allQuestions=r;
    allQuestions.push("Default 1");
    allQuestions.push("Default 2");
})
.catch((e)=>{console.log("Something went wrong getting all the queastions")});

function genRandom(area) {
    return Math.floor(Math.random()*area);
}

function isIn(array, target){
    for (const item of array) {
        if (item == target)
            return true;
    }
    return false;
}

function getPossibleAnswers (answer) {
    const length = allQuestions.length;

    let temp = [];
    let random = null;
    for (let i = 0; i < 3; i++)
    {
        while (temp.length < 4) {
            random = genRandom(length);
            const picked = allQuestions[random];
            if (isIn(temp, picked.answer) || picked.answer === answer) {
                continue;
            }
            else {
                if (picked.answer)
                    temp.push(picked.answer);
                else 
                    temp.push(picked)
                break;
            }
        }
    }
    random = genRandom(length);
    temp.splice(random, 0, answer);
    return temp;
} 

module.exports.getIndividualInfo = (userId, testId)=>{
    return new Promise(async (resolve, reject)=>{
        try {
            let questions = await QuestionModel.find({}); 
            let result = [];
            for (let question of questions)
            {
                if (testId == question.testId) {
                    const possible = getPossibleAnswers(question.answer);
                    question.answer = possible;
                    question.possible = possible;
                    result.push(question);
                }
            }
            const testInfo = await TestModel.findOne({_id: testId, userId: userId});
            resolve([testInfo, result]);
        } catch(e) {
            reject(e);
        }
    });
};
module.exports.addTest = (userId, title, desc, subject, questions)=>{
    return new Promise(async (resolve, reject)=>{
        try {
            // add the test
            const temp = new TestModel({userId, title, desc, subject});
            await temp.save();
            // now add the questions correlated to the test
            for (const index in questions) {
                questions[index].testId = temp._id;
            }
            const result = await QuestionModel.insertMany(questions);
            console.log(result);
            if (result)
                resolve(true);
        } catch(e) {
            reject(e);
        }
    });
};
module.exports.model = TestModel;
