const express = require("express"); 
const TestModel = require("../models/TestModel");
const ApplicationError = require("../ApplicationError");
const router = express.Router();

router.use(express.urlencoded());
router.use(express.json());

const verifyAction = (req, res, next)=>{
    if (req.session.userId)
        return next();
    else
        throw new ApplicationError("You're not signed in to perform this action", 404);
};
router.get("/home", (req, res)=>{
    if(req.session.userId) {
        TestModel.getTests(req.session.userId)
        .then((r)=>{
            console.log(r);
            res.render("home", {title: "Home", username: req.session.username, stylesheets: null, tests: r});
        })
        .catch(e=>{throw e});
    }
    else
        res.redirect("/");
});

router.get("/addTest", verifyAction, (req, res)=>{
    // redirect to the test page
    res.render("test", {title: "Creating Test", creating: true, username: req.session.username, stylesheets:["css/testEdit.css"], testId: null});
});
router.post("/addTest", (req, res)=>{
    const { title, desc, subject, questions } = req.body;
    TestModel.addTest(req.session.userId, title, desc, subject, questions)
    .then((r)=>{
        if (r)
            res.JSON({result: true});
    })
    .catch((e)=>{
        throw e;
    })
});
router.post("/updateQuestion", (req, res)=>{
    console.log(req.body);
    console.log(req.params);
    console.log(req.query);
    const { question, answer } = req.body;
});
router.get("/test/:testId", verifyAction, (req, res)=>{
    const {testId} = req.params;
    // get testid informatin, send to the test page
    // provide the basic test information
    TestModel.getIndividualInfo(testId, req.session.userId)
    .then((r)=>{
        res.render("test", {title: "test_title_here", creating: false, stylesheets:["css/testView.css"], testId: testId, testInfo: r});
    })
    .catch((e)=>{
        throw e;
    });
    // provide data
});
router.get("/getTest", verifyAction, (req, res)=>{
    });


module.exports = router;
