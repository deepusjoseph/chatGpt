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
const storage = multer.memoryStorage();
const upload = multer({
    storage
});
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
openai.api_key = process.env.OPENAI_API_KEY;
app.get("/", function (req, res) {
    res.render("home");
});
app.post("/uploadFile", upload.single("mypic"), async (req, res, next) => {
    const file = req.file;
    const includeText = req.body.include;
    if (!file) {
        const error = new Error("Please upload a file");
        error.httpStatusCode = 400;
        return next(error);
    }
    const transcripts = Buffer.from(file.buffer).toString("utf-8");
    const fileInfo = [
        transcripts,
        'I want you to be a great video script writer. When it comes to writing content, two factors are crucial,"perplexity" and "burstiness." Perplexity measures the complexity of text. Separately, burstiness compaes the variations of sentences. Humans tend to write with greater burstiness, for example, with some longer or complex sentences alongside shorter ones. AI sentences tend to be more uniform. Therefore, when writing the following content I am going to ask you to create, I need it to have a good amount of perplexity and burstiness. Do you understand?',
        `Please give me a list of section headings for a detailed video script. you may also wish to include ${includeText}`,
        'Give me a list of all B-Roll footage mentioned for all sections',
        'Provide a 150 word Summary to describe this video to potential audiences for this YouTube Video',
        'Provide a comma separated list of around 40 tags suitable for this YouTube video',
        'Provide 15 Catchy titles for this YouTube video',
        'Provide 15 Short titles for this YouTube Video',
        'Provide 15, 2 or 3 word phrases for the thumbnail text of this video',
        'Now suggest 15 ideas for detailed thumbnail images',
        ''
    ];
    var questionSet1 = fileInfo.slice(0, 3);
    var questionSet2 = fileInfo.slice(3);
    // Create a new PDF document
    const doc = new PDFDocument();
    // Pipe the PDF document to a new file
    let rand = Math.floor(Math.random() * 1000);
    const filename = `output_${rand}.pdf`;
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);
    var answerSet1;
    for (let question of questionSet1) {
        answerSet1 = await ask_question(question);
        // ans.push(answer);
    }  
    var answerSet1Array = [];
    answerSet1Array.push(answerSet1)
    answerSet1Array.shift();
    const answerSet1ArrayPro = answerSet1.split('\n').filter(item => item.trim() !== '').map(item => item.replace(/^\d+\.\s+/, ''));
    // let section_answer
    for (let question of answerSet1ArrayPro) {
        section_answer = await section_details(question, fileInfo[0]);
        section_answer = section_answer.replace('\n', '')
        doc.font('Helvetica-Bold').fontSize(14).text(question);
        doc.font('Helvetica').fontSize(12).text(section_answer, { indent: 20 });
        doc.moveDown();
    }
    for (let i = 3; i < 10; i++) {
        let questionArray = [];
        questionArray.push(answerSet1, fileInfo[i])
        var answerSet2 = await ask_question(questionArray)
        doc.font('Helvetica-Bold').fontSize(14).text(fileInfo[i]);
        doc.font('Helvetica').fontSize(12).text(answerSet2, { indent: 20 });
        doc.moveDown();

    }

    //B-Roll Footage
    // let bRollFootage = [];
    // bRollFootage.push(answerSet1, fileInfo[3])
    // var answerSet2 = await ask_question(bRollFootage)
    // doc.font('Helvetica-Bold').fontSize(14).text(fileInfo[3]);
    // doc.font('Helvetica').fontSize(12).text(answerSet2, { indent: 20 });
    // doc.moveDown();

    // //Summary
    // let summary = [];
    // summary.push(answerSet1, fileInfo[4])
    // var answerSet2 = await ask_question(summary)
    // doc.font('Helvetica-Bold').fontSize(14).text(fileInfo[4]);
    // doc.font('Helvetica').fontSize(12).text(answerSet2, { indent: 20 });
    // doc.moveDown();

    // //tags
    // let tags = [];
    // tags.push(answerSet1, fileInfo[5])
    // var answerSet2 = await ask_question(tags)
    // doc.font('Helvetica-Bold').fontSize(14).text(fileInfo[5]);
    // doc.font('Helvetica').fontSize(12).text(answerSet2, { indent: 20 });
    // doc.moveDown();
    // //titles
    // let titles = [];
    // titles.push(answerSet1, fileInfo[6])
    // var answerSet2 = await ask_question(titles)
    // doc.font('Helvetica-Bold').fontSize(14).text(fileInfo[6]);
    // doc.font('Helvetica').fontSize(12).text(answerSet2, { indent: 20 });
    // doc.moveDown();

    // //catchyTitles
    // let catchyTitles = [];
    // catchyTitles.push(answerSet1, fileInfo[7])
    // var answerSet2 = await ask_question(catchyTitles)
    // doc.font('Helvetica-Bold').fontSize(14).text(fileInfo[7]);
    // doc.font('Helvetica').fontSize(12).text(answerSet2, { indent: 20 });
    // doc.moveDown();

    // //phrases
    // let phrases = [];
    // phrases.push(answerSet1, fileInfo[8])
    // var answerSet2 = await ask_question(phrases)
    // doc.font('Helvetica-Bold').fontSize(14).text(fileInfo[8]);
    // doc.font('Helvetica').fontSize(12).text(answerSet2, { indent: 20 });
    // doc.moveDown();


    // //thumbnails
    // let thumbnails = [];
    // thumbnails.push(answerSet1, fileInfo[9])
    // var answerSet2 = await ask_question(thumbnails)
    // doc.font('Helvetica-Bold').fontSize(14).text(fileInfo[9]);
    // doc.font('Helvetica').fontSize(12).text(answerSet2, { indent: 20 });
    // doc.moveDown();

    //Images
    // const thumbnailIdeas = answerSet2.split('\n').filter(item => item.trim() !== '').map(item => item.replace(/^\d+\.\s+/, '')).slice(0, 3);
    // console.log(thumbnailIdeas, 'jsdhjs')
    // const prompt = thumbnailIdeas.join("\n");
    // console.log(prompt, 'ans')
    // doc.font('Helvetica-Bold').fontSize(14).text(fileInfo[9]);
    // thumbnailIdeas.map(async (item) => {
    //     var images = await image_generation(item);
    //     console.log(images, 'ima')
    //     doc.font('Helvetica').fontSize(10).text('Image',{link: images,underline: true});
    //     doc.moveDown();
    // })
    doc.end();
    await new Promise(resolve => {
        doc.on('end', resolve);
    });
    stream.end();
    // Return the filename and mimetype of the generated file
    const mimetype = 'application/pdf';
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', mimetype);

    // Send the PDF file as the response
    const streams = fs.createReadStream(filename);
    streams.pipe(res);

});
async function ask_question(prompt) {
    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Answer the following question:${prompt}`,
        max_tokens: 2048,

    });
    let answer = completion.data.choices[0].text.trim();
    answer = answer.replace('\n', '')
    return answer;
};
async function section_details(question, trainingSet) {
    let promptarray = [trainingSet,
        `Write a very detailed video script including B-Roll suggestions for the section:${question}`
    ]
    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Answer the following question:${promptarray}`,
        max_tokens: 2048,

    });
    let answer = completion.data.choices[0].text.trim();
    answer = answer.replace('\n', '')
    return answer;
}
async function image_generation(prompt) {
    console.log(prompt, 'pro')
    const response = await openai.createImage({
        prompt: prompt,
        n: 1,
        size: "1024x1024",
    });
    // console.log(response,'rers')
    console.log(response.data.data, 'sduisud')
    return response.data.data['0'].url;
};
app.listen(8080, function (error) {
    if (error) throw error
    console.log("Server created Successfully on PORT 8080")
});