const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config()
const express = require("express")
const path = require("path")
const multer = require("multer")
const app = express()
const axios = require('axios');
const fs = require('fs');
const PDFDocument = require('pdfkit');

// View Engine Setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

const maxSize = 1 * 1000 * 1000;
const storage = multer.memoryStorage();
const upload = multer({
    storage
});
app.get("/", function (req, res) {
    res.render("home");
})
app.post("/uploadFile", upload.single("mypic"), async (req, res, next) => {
    const file = req.file;
    if (!file) {
        const error = new Error("Please upload a file");
        error.httpStatusCode = 400;
        return next(error);
    }
    const multerText = Buffer.from(file.buffer).toString("utf-8").split('\n');
    multerText.pop();

    const result = {
        fileText: multerText,
    };
    const promises = multerText.map(async (question) => ask_question(question));
    const answers = await Promise.all(promises);
    const { filename, mimetype } = await generate_document(multerText, answers);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', mimetype);

    // Send the PDF file as the response
    const stream = fs.createReadStream(filename);
    stream.pipe(res);
});
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
async function ask_question(question) {
    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Answer the following question:${question}`,
        max_tokens: 2048,

    });
    const answer = completion.data.choices[0].text.trim();
    return answer;
}
async function generate_document(multerText, answers) {
    // Create a new PDF document
    const doc = new PDFDocument();
    // Pipe the PDF document to a new file
    let rand = Math.floor(Math.random() * 1000);
    const filename = `output_${rand}.pdf`;
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);
    for (let i = 0; i < multerText.length; i++) {
        doc.font('Helvetica-Bold').fontSize(14).text(multerText[i]);
        doc.font('Helvetica').fontSize(12).text(answers[i], { indent: 20 });
        doc.moveDown();
    }

    // Finalize the PDF document and close the write stream
    doc.end();
    await new Promise(resolve => {
        doc.on('end', resolve);
    });
    stream.end();
    // Return the filename and mimetype of the generated file
    const mimetype = 'application/pdf';
    return { filename, mimetype };
}
app.get("/download/", (req, res) => {
    const filePath = __dirname + "/questions.txt";
    res.download(
        filePath,
        "questions.txt",
        (err) => {
            if (err) {
                res.send({
                    error: err,
                    msg: "Problem downloading the file"
                })
            }
        });
});
app.listen(8080, function (error) {
    if (error) throw error
    console.log("Server created Successfully on PORT 8080")
})


